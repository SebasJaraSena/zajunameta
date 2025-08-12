import type { Ref } from "react";
import { forwardRef } from "react";
import { t } from "ttag";

import { LogoRoot } from "./MetabotLogo.styled";

type MetabotVariant = keyof typeof urlByVariant;

const urlByVariant = {
  happy: "app/assets/img/zajuna-happy.svg"
};

export interface MetabotLogoProps {
  className?: string;
  variant?: MetabotVariant;
}

const MetabotLogo = forwardRef(function MetabotLogo(
  { variant = "happy", ...rest }: MetabotLogoProps,
  ref: Ref<HTMLImageElement>,
) {
  return (
    <LogoRoot
      {...rest}
      ref={ref}
      alt={t`Zajuna`}
      src={urlByVariant[variant]}
    />
  );
});

// eslint-disable-next-line import/no-default-export -- deprecated usage
export default MetabotLogo;
