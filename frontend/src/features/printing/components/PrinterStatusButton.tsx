"use client";

import { Button, Tooltip } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import type { PrinterStatus } from "../types/printing.types";

interface Props {
  status: PrinterStatus;
  deviceName: string;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function PrinterStatusButton({ status, deviceName, onConnect, onDisconnect }: Props) {
  if (status === "unsupported") {
    return (
      <Tooltip title="Este navegador no soporta Bluetooth — usa Chrome en Android o PC">
        <Button icon={<PrinterOutlined />} disabled />
      </Tooltip>
    );
  }

  const connected = status === "connected";
  return (
    <Tooltip
      title={
        connected
          ? `Impresora: ${deviceName} — clic para desconectar`
          : "Conectar impresora Bluetooth"
      }
    >
      <Button
        icon={<PrinterOutlined />}
        loading={status === "connecting"}
        onClick={connected ? onDisconnect : onConnect}
        style={connected ? { color: "#16a34a", borderColor: "#16a34a" } : undefined}
      />
    </Tooltip>
  );
}
