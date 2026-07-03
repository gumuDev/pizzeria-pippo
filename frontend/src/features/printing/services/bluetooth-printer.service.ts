/**
 * Web Bluetooth transport for ESC/POS thermal printers.
 * Encapsulates device selection, GATT connection and chunked writes.
 * Holds the active connection — the same pattern used for realtime channels.
 */
import {
  BLE_CHUNK_DELAY_MS,
  BLE_CHUNK_SIZE,
  BLE_PRINTER_SERVICES,
} from "../constants/printing.constants";

let device: BluetoothDevice | null = null;
let characteristic: BluetoothRemoteGATTCharacteristic | null = null;
let intentionalDisconnect = false;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function findWritableCharacteristic(
  server: BluetoothRemoteGATTServer
): Promise<BluetoothRemoteGATTCharacteristic | null> {
  for (const serviceUuid of BLE_PRINTER_SERVICES) {
    try {
      const service = await server.getPrimaryService(serviceUuid);
      const characteristics = await service.getCharacteristics();
      const writable = characteristics.find(
        (c) => c.properties.write || c.properties.writeWithoutResponse
      );
      if (writable) return writable;
    } catch {
      // Service not present on this printer — try the next known UUID.
    }
  }
  return null;
}

export const BluetoothPrinterService = {
  isSupported(): boolean {
    return typeof navigator !== "undefined" && "bluetooth" in navigator;
  },

  isConnected(): boolean {
    return !!device?.gatt?.connected && !!characteristic;
  },

  getDeviceName(): string {
    return device?.name ?? "";
  },

  /**
   * Opens the browser device chooser, connects and locates the writable
   * characteristic. Returns the printer name.
   */
  async connect(onDisconnected: () => void): Promise<string> {
    if (!this.isSupported()) {
      throw new Error("Este navegador no soporta Bluetooth");
    }
    const selected = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: BLE_PRINTER_SERVICES,
    });
    const server = await selected.gatt?.connect();
    if (!server) throw new Error("No se pudo conectar a la impresora");

    const writable = await findWritableCharacteristic(server);
    if (!writable) {
      selected.gatt?.disconnect();
      throw new Error("El dispositivo seleccionado no es una impresora compatible");
    }

    selected.addEventListener("gattserverdisconnected", () => {
      characteristic = null;
      if (!intentionalDisconnect) onDisconnected();
      intentionalDisconnect = false;
    });

    intentionalDisconnect = false;
    device = selected;
    characteristic = writable;
    return selected.name ?? "Impresora";
  },

  disconnect(): void {
    intentionalDisconnect = true;
    device?.gatt?.disconnect();
    device = null;
    characteristic = null;
  },

  /** Sends raw ESC/POS bytes in MTU-safe chunks. */
  async write(bytes: Uint8Array): Promise<void> {
    if (!this.isConnected() || !characteristic) {
      throw new Error("La impresora no está conectada");
    }
    const useNoResponse = characteristic.properties.writeWithoutResponse;
    for (let offset = 0; offset < bytes.length; offset += BLE_CHUNK_SIZE) {
      const chunk = bytes.slice(offset, offset + BLE_CHUNK_SIZE);
      if (useNoResponse) {
        await characteristic.writeValueWithoutResponse(chunk);
      } else {
        await characteristic.writeValue(chunk);
      }
      await sleep(BLE_CHUNK_DELAY_MS);
    }
  },
};
