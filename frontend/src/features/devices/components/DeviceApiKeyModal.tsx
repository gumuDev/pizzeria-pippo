"use client";

import { Modal, Typography, Input, Button, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface Props {
  apiKey: string | null;
  onClose: () => void;
}

export function DeviceApiKeyModal({ apiKey, onClose }: Props) {
  const handleCopy = async () => {
    if (!apiKey) return;
    await navigator.clipboard.writeText(apiKey);
    message.success("Copiado al portapapeles");
  };

  return (
    <Modal
      title="Dispositivo creado"
      open={!!apiKey}
      onOk={onClose}
      onCancel={onClose}
      okText="Ya lo copié"
      cancelButtonProps={{ style: { display: "none" } }}
      closable={false}
      maskClosable={false}
    >
      <Text type="warning" strong style={{ display: "block", marginBottom: 12 }}>
        Copiá este API key ahora — no se puede volver a ver.
      </Text>
      <Input.Group compact style={{ display: "flex" }}>
        <Input value={apiKey ?? ""} readOnly style={{ fontFamily: "monospace" }} />
        <Button icon={<CopyOutlined />} onClick={handleCopy} />
      </Input.Group>
      <Text type="secondary" style={{ display: "block", marginTop: 12, fontSize: 13 }}>
        Configurá este valor en la app del celular (URL del backend + este API key) para que pueda reportar los pagos de Yape.
      </Text>
    </Modal>
  );
}
