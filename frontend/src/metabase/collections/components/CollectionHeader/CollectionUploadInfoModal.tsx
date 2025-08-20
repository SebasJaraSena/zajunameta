import { t } from "ttag";

import Button from "metabase/common/components/Button";
import Link from "metabase/common/components/Link";
import { useSelector } from "metabase/lib/redux";
import { getApplicationName } from "metabase/selectors/whitelabel";
import { Modal } from "metabase/ui";

import {
  InfoModalBody,
  InfoModalContainer,
  InfoModalTitle,
  NewBadge,
} from "./CollectionUpload.styled";

export const UploadInfoModal = ({
  isAdmin,
  onClose,
}: {
  isAdmin: boolean;
  onClose: () => void;
}) => {
  const applicationName = useSelector(getApplicationName);
  return (
    <Modal
      opened
      onClose={onClose}
      size="30rem"
      padding="2rem"
      styles={{ header: { marginBottom: "1rem" } }}
    >
      <InfoModalContainer>
        <NewBadge>{t`Nuevo`}</NewBadge>
        <InfoModalTitle>{t`Subir CSVS a ${applicationName}`}</InfoModalTitle>
        {isAdmin ? (
          <>
            <InfoModalBody>
              <p>
                {t`Los miembros del equipo podrán subir archivos CSV y trabajar con ellos como cualquier otra fuente de datos.`}
              </p>
              <p>
                {t`Podrás elegir la base de datos predeterminada donde se deben almacenar los datos al habilitar la función.`}
              </p>
            </InfoModalBody>
            <Button as={Link} to="/admin/settings/uploads" primary role="link">
              {t`Ir a la configuración`}
            </Button>
          </>
        ) : (
          <>
            <InfoModalBody>
              <p>
                {t`Necesitarás pedirle a tu administrador que habilite esta función para comenzar. Luego, podrás subir archivos CSV y trabajar con ellos como cualquier otra fuente de datos.`}
              </p>
            </InfoModalBody>
            <Button onClick={onClose}>{t`Entendido`}</Button>
          </>
        )}
      </InfoModalContainer>
    </Modal>
  );
};
