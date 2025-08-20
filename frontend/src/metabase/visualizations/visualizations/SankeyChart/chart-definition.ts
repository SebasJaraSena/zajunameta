import { t } from "ttag";

import { getSankeyChartColumns } from "metabase/visualizations/echarts/graph/sankey/model/dataset";
import { ChartSettingsError } from "metabase/visualizations/lib/errors";
import { columnSettings } from "metabase/visualizations/lib/settings/column";
import {
  dimensionSetting,
  metricSetting,
} from "metabase/visualizations/lib/settings/utils";
import { findSensibleSankeyColumns } from "metabase/visualizations/lib/utils";
import {
  getDefaultSize,
  getMinSize,
} from "metabase/visualizations/shared/utils/sizes";
import type {
  ComputedVisualizationSettings,
  VisualizationSettingsDefinitions,
} from "metabase/visualizations/types";
import { isDate, isDimension, isMetric } from "metabase-lib/v1/types/utils/isa";
import type { DatasetData, RawSeries, Series } from "metabase-types/api";

import { hasCyclicFlow } from "./utils/cycle-detection";

const MAX_SANKEY_NODES = 150;

export const SETTINGS_DEFINITIONS = {
  ...columnSettings({ hidden: true }),
  ...dimensionSetting("sankey.source", {
    // eslint-disable-next-line ttag/no-module-declaration -- see metabase#55045
    section: t`Datos`,
    // eslint-disable-next-line ttag/no-module-declaration -- see metabase#55045
    title: t`Fuente`,
    showColumnSetting: true,
    persistDefault: true,
    dashboard: false,
    autoOpenWhenUnset: false,
    getDefault: ([series]: RawSeries) =>
      findSensibleSankeyColumns(series.data)?.source,
  }),
  ...dimensionSetting("sankey.target", {
    // eslint-disable-next-line ttag/no-module-declaration -- see metabase#55045
    section: t`Datos`,
    // eslint-disable-next-line ttag/no-module-declaration -- see metabase#55045
    title: t`Objetivo`,
    showColumnSetting: true,
    persistDefault: true,
    dashboard: false,
    autoOpenWhenUnset: false,
    getDefault: ([series]: RawSeries) =>
      findSensibleSankeyColumns(series.data)?.target,
  }),
  ...metricSetting("sankey.value", {
    // eslint-disable-next-line ttag/no-module-declaration -- see metabase#55045
    section: t`Datos`,
    // eslint-disable-next-line ttag/no-module-declaration -- see metabase#55045
    title: t`Valor`,
    showColumnSetting: true,
    persistDefault: true,
    dashboard: false,
    autoOpenWhenUnset: false,
    getDefault: ([series]: RawSeries) =>
      findSensibleSankeyColumns(series.data)?.metric,
  }),
  "sankey.node_align": {
    // eslint-disable-next-line ttag/no-module-declaration -- see metabase#55045
    section: t`Visualización`,
    // eslint-disable-next-line ttag/no-module-declaration -- see metabase#55045
    title: t`Alinear`,
    widget: "select",
    default: "left",
    props: {
      options: [
        {
          // eslint-disable-next-line ttag/no-module-declaration -- see metabase#55045
          name: t`Izquierda`,
          value: "left",
        },
        {
          // eslint-disable-next-line ttag/no-module-declaration -- see metabase#55045
          name: t`Derecha`,
          value: "right",
        },
        {
          // eslint-disable-next-line ttag/no-module-declaration -- see metabase#55045
          name: t`Justificar`,
          value: "justify",
        },
      ],
    },
  },
  "sankey.show_edge_labels": {
    // eslint-disable-next-line ttag/no-module-declaration -- see metabase#55045
    section: t`Visualización`,
    // eslint-disable-next-line ttag/no-module-declaration -- see metabase#55045
    title: t`Mostrar etiquetas de borde`,
    widget: "toggle",
    default: false,
    inline: true,
  },
  "sankey.label_value_formatting": {
    // eslint-disable-next-line ttag/no-module-declaration -- see metabase#55045
    section: t`Visualización`,
    // eslint-disable-next-line ttag/no-module-declaration -- see metabase#55045
    title: t`Formato automático`,
    widget: "segmentedControl",
    props: {
      options: [
        // eslint-disable-next-line ttag/no-module-declaration -- see metabase#55045
        { name: t`Automático`, value: "auto" },
        // eslint-disable-next-line ttag/no-module-declaration -- see metabase#55045
        { name: t`Compacto`, value: "compact" },
        // eslint-disable-next-line ttag/no-module-declaration -- see metabase#55045
        { name: t`Lleno`, value: "full" },
      ],
    },
    getHidden: (
      _series: Series,
      vizSettings: ComputedVisualizationSettings,
    ) => {
      return !vizSettings["sankey.show_edge_labels"];
    },
    default: "auto",
  },
  "sankey.edge_color": {
    // eslint-disable-next-line ttag/no-module-declaration -- see metabase#55045
    section: t`Visualización`,
    // eslint-disable-next-line ttag/no-module-declaration -- see metabase#55045
    title: t`Color del borde`,
    widget: "segmentedControl",
    default: "source",
    props: {
      options: [
        // eslint-disable-next-line ttag/no-module-declaration -- see metabase#55045
        { name: t`Gris`, value: "gray" },
        // eslint-disable-next-line ttag/no-module-declaration -- see metabase#55045
        { name: t`Fuente`, value: "source" },
        // eslint-disable-next-line ttag/no-module-declaration -- see metabase#55045
        { name: t`Objetivo`, value: "target" },
      ],
    },
  },
};

export const SANKEY_CHART_DEFINITION = {
  getUiName: () => t`Sankey`,
  identifier: "sankey",
  iconName: "sankey",
  // eslint-disable-next-line ttag/no-module-declaration -- see metabase#55045
  noun: t`gráfico de sankey`,
  minSize: getMinSize("sankey"),
  defaultSize: getDefaultSize("sankey"),
  isSensible: (data: DatasetData) => {
    const { cols, rows } = data;
    const numDimensions = cols.filter(
      (col) => isDimension(col) && !isDate(col),
    ).length;
    const numMetrics = cols.filter(isMetric).length;

    const hasEnoughRows = rows.length >= 1;
    const hasSuitableColumnTypes =
      cols.length >= 3 && numDimensions >= 2 && numMetrics >= 1;

    if (!hasSuitableColumnTypes || !hasEnoughRows) {
      return false;
    }

    const suitableColumns = findSensibleSankeyColumns(data);
    if (!suitableColumns) {
      return false;
    }

    const sankeyColumns = getSankeyChartColumns(cols, {
      "sankey.source": suitableColumns.source,
      "sankey.target": suitableColumns.target,
      "sankey.value": suitableColumns.metric,
    });
    if (!sankeyColumns) {
      return false;
    }

    return !hasCyclicFlow(
      data.rows,
      sankeyColumns.source.index,
      sankeyColumns.target.index,
    );
  },
  checkRenderable: (
    rawSeries: RawSeries,
    settings: ComputedVisualizationSettings,
  ) => {
    const { rows, cols } = rawSeries[0].data;

    if (rows.length === 0) {
      return;
    }
    const sankeyColumns = getSankeyChartColumns(cols, settings);
    if (!sankeyColumns) {
      throw new ChartSettingsError(t`¿Qué columnas quieres usar?`, {
        section: `Data`,
      });
    }

    if (sankeyColumns.source.index === sankeyColumns.target.index) {
      throw new ChartSettingsError(
        t`Seleccione dos columnas diferentes para origen y destino para crear un flujo.`,
        { section: "Data" },
      );
    }

    if (
      hasCyclicFlow(
        rows,
        sankeyColumns.source.index,
        sankeyColumns.target.index,
      )
    ) {
      throw new ChartSettingsError(
        t`Las columnas seleccionadas crean flujos circulares. Prueba a seleccionar columnas diferentes que fluyan en una dirección.`,
        { section: "Data" },
      );
    }

    const nodesCount = new Set(
      rows.flatMap((row) => [
        row[sankeyColumns.source.index],
        row[sankeyColumns.target.index],
      ]),
    ).size;

    if (nodesCount > MAX_SANKEY_NODES) {
      throw new ChartSettingsError(
        t`El gráfico Sankey no admite más de ${MAX_SANKEY_NODES} nodos únicos.`,
      );
    }
  },
  hasEmptyState: true,
  settings: {
    ...SETTINGS_DEFINITIONS,
  } as any as VisualizationSettingsDefinitions,
};
