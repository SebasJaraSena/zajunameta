import { t } from "ttag";

export const LOADING_MESSAGE_BY_SETTING = {
  "doing-science": {
    // eslint-disable-next-line ttag/no-module-declaration -- see metabase#55045
    name: t`Haciendo ciencia...`,
    value: (isSlow?: boolean) =>
      isSlow ? t`Esperando los resultados...` : t`Haciendo ciencia...`,
  },
  "running-query": {
    // eslint-disable-next-line ttag/no-module-declaration -- see metabase#55045
    name: t`Ejecutando consulta...`,
    value: (_isSlow?: boolean) => t`Ejecutando consulta...`,
  },
  "loading-results": {
    // eslint-disable-next-line ttag/no-module-declaration -- see metabase#55045
    name: t`Cargando resultados...`,
    value: (_isSlow?: boolean) => t`Cargando resultados...`,
  },
};

export const getLoadingMessageOptions = () =>
  Object.entries(LOADING_MESSAGE_BY_SETTING).map(([value, option]) => ({
    label: option.name,
    value,
  }));
