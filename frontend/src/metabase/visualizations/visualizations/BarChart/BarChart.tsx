import { t } from "ttag";

import {
  getDefaultSize,
  getMinSize,
} from "metabase/visualizations/shared/utils/sizes";
import { CartesianChart } from "metabase/visualizations/visualizations/CartesianChart";
import {
  COMBO_CHARTS_SETTINGS_DEFINITIONS,
  getCartesianChartDefinition,
} from "metabase/visualizations/visualizations/CartesianChart/chart-definition";

import type {
  VisualizationProps,
  VisualizationSettingsDefinitions,
} from "../../types";

Object.assign(
  BarChart,
  getCartesianChartDefinition({
    getUiName: () => t`Barra`,
    identifier: "bar",
    iconName: "bar",
    // eslint-disable-next-line ttag/no-module-declaration -- see metabase#55045
    noun: t`gráfico de barras`,
    minSize: getMinSize("bar"),
    defaultSize: getDefaultSize("bar"),
    settings: {
      ...COMBO_CHARTS_SETTINGS_DEFINITIONS,
    } as any as VisualizationSettingsDefinitions,
  }),
);

export function BarChart(props: VisualizationProps) {
  return <CartesianChart {...props} />;
}
