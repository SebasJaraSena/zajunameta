import { t } from "ttag";

import { Button, Flex, Icon, List, Modal } from "metabase/ui";

interface MoveQuestionsIntoDashboardsInfoModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export const MoveQuestionsIntoDashboardsInfoModal = ({
  onConfirm,
  onCancel,
}: MoveQuestionsIntoDashboardsInfoModalProps) => (
  <Modal
    opened
    onClose={onCancel}
    title={t`¿Mover las preguntas a sus paneles de control?`}
    size="35rem"
    withCloseButton={false}
    data-testid="move-questions-into-dashboard-info-modal"
  >
    <List spacing="md" mt="1.25rem">
      <List.Item
        icon={<Icon name="collection" c="brand" mb="-2px" />}
        lh="1.5rem"
      >
        {t`Si una pregunta solo aparece en un único panel de esta colección, se moverá a ese panel para ordenar la colección.`}
      </List.Item>
      <List.Item icon={<Icon name="group" c="brand" mb="-2px" />} lh="1.5rem">
        {t`Los permisos no cambiarán.`}
      </List.Item>
    </List>

    <Flex justify="flex-end" gap="md" pt="1rem">
      <Button variant="subtle" onClick={onCancel}>{t`Cancelar`}</Button>
      <Button variant="filled" onClick={onConfirm}>
        {t`Previsualizar los cambios`}
      </Button>
    </Flex>
  </Modal>
);
