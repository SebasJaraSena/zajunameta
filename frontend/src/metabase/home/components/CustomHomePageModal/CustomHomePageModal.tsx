import { useCallback, useState } from "react";
import { t } from "ttag";

import { trackCustomHomepageDashboardEnabled } from "metabase/admin/settings/analytics";
import { updateSettings } from "metabase/admin/settings/settings";
import Button from "metabase/common/components/Button/Button";
import { DashboardSelector } from "metabase/common/components/DashboardSelector/DashboardSelector";
import Modal from "metabase/common/components/Modal";
import ModalContent from "metabase/common/components/ModalContent";
import { useDispatch, useSelector } from "metabase/lib/redux";
import { addUndo, dismissUndo } from "metabase/redux/undo";
import { refreshCurrentUser } from "metabase/redux/user";
import { getApplicationName } from "metabase/selectors/whitelabel";
import { Box, Text } from "metabase/ui";
import type { DashboardId } from "metabase-types/api";

const CUSTOM_HOMEPAGE_SETTING_KEY = "custom-homepage";
const CUSTOM_HOMEPAGE_DASHBOARD_SETTING_KEY = "custom-homepage-dashboard";
const CUSTOM_HOMEPAGE_REDIRECT_TOAST_KEY = "dismissed-custom-dashboard-toast";

interface CustomHomePageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomHomePageModal = ({
  isOpen,
  onClose,
}: CustomHomePageModalProps) => {
  const [dashboardId, setDashboardId] = useState<DashboardId>();
  const dispatch = useDispatch();

  const handleSave = async () => {
    await dispatch(
      updateSettings({
        [CUSTOM_HOMEPAGE_DASHBOARD_SETTING_KEY]: dashboardId,
        [CUSTOM_HOMEPAGE_SETTING_KEY]: true,
        [CUSTOM_HOMEPAGE_REDIRECT_TOAST_KEY]: true,
      }),
    );

    const id = Date.now();
    await dispatch(
      addUndo({
        message: () => (
          <Box ml="0.5rem" mr="2.5rem">
            <Text
              span
              c="text-white"
              fw={700}
            >{t`This dashboard has been set as your homepage.`}</Text>
            <br />
            <Text
              span
              c="text-white"
            >{t`You can change this in Admin > Settings > General.`}</Text>
          </Box>
        ),
        icon: "info",
        timeout: 10000,
        id,
        actions: [dismissUndo({ undoId: id })],
        actionLabel: "Got it",
        canDismiss: false,
      }),
    );
    await dispatch(refreshCurrentUser());
    trackCustomHomepageDashboardEnabled("homepage");
  };

  const handleChange = useCallback(
    (value?: DashboardId) => {
      if (value) {
        setDashboardId(value);
      } else {
        setDashboardId(undefined);
      }
    },
    [setDashboardId],
  );

  const handleClose = useCallback(() => {
    setDashboardId(undefined);
    onClose();
  }, [onClose, setDashboardId]);

  const applicationName = useSelector(getApplicationName);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent
        title={t`Personalizar la página de inicio`}
        onClose={handleClose}
        footer={[
          <Button onClick={handleClose} key="custom-homepage-modal-cancel">
            {t`Cancelar`}
          </Button>,
          <Button
            primary
            onClick={handleSave}
            key="custom-homepage-modal-save"
            disabled={!dashboardId}
          >
            {t`Guardar`}
          </Button>,
        ]}
      >
        <p>{t`Elige un panel que sirva como página de inicio. Si las personas no tienen permiso para ver el panel seleccionado, Zajuna las redirigirá a la página de inicio predeterminada. Puedes actualizar o restablecer la página de inicio en cualquier momento en Configuración de administrador > Configuración > General.`}</p>
        <DashboardSelector value={dashboardId} onChange={handleChange} />
      </ModalContent>
    </Modal>
  );
};
