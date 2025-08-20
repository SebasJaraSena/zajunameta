import cx from "classnames";
import { t } from "ttag";

import ActionButton from "metabase/common/components/ActionButton";
import Button from "metabase/common/components/Button";
import EditBar from "metabase/common/components/EditBar";
import ButtonsS from "metabase/css/components/buttons.module.css";
import type Question from "metabase-lib/v1/Question";

import S from "./MetricEditorHeader.module.css";

type MetricEditorHeaderProps = {
  question: Question;
  isDirty: boolean;
  isRunnable: boolean;
  onCreate: (question: Question) => void;
  onSave: (question: Question) => Promise<void>;
  onCancel: () => void;
};

export function MetricEditorHeader({
  question,
  isDirty,
  isRunnable,
  onCreate,
  onSave,
  onCancel,
}: MetricEditorHeaderProps) {
  const handleCreate = () => onCreate(question);
  const handleSave = () => onSave(question);

  return (
    <EditBar
      className={S.root}
      title={question.displayName() ?? t`New metric`}
      buttons={[
        <Button key="cancel" small onClick={onCancel}>{t`Cancelar`}</Button>,
        !question.isSaved() ? (
          <Button key="create" primary small onClick={handleCreate}>
            {t`Guardar`}
          </Button>
        ) : (
          <ActionButton
            key="save"
            actionFn={handleSave}
            disabled={!isRunnable || !isDirty}
            normalText={t`Guardar cambios`}
            activeText={t`Guardando…`}
            failedText={t`Error al guardar`}
            successText={t`Guardado`}
            className={cx(
              ButtonsS.Button,
              ButtonsS.ButtonPrimary,
              ButtonsS.ButtonSmall,
            )}
          />
        ),
      ]}
    />
  );
}
