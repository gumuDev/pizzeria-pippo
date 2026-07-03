"use client";

import { Modal, Button } from "antd";
import type { Branch, Cashier } from "../types/branch.types";

interface Props {
  data: { branch: Branch; cashiers: Cashier[] } | null;
  onClose: () => void;
}

export function BranchBlockedModal({ data, onClose }: Props) {
  return (
    <Modal
      title="No se puede desactivar la sucursal"
      open={!!data}
      onCancel={onClose}
      footer={<Button onClick={onClose}>Entendido</Button>}
    >
      <p className="mb-3">
        Hay {data?.cashiers.length} cajero(s) asignado(s) a <strong>{data?.branch.name}</strong>.
        Desactívalos o reasígnalos antes de continuar.
      </p>
      <ul className="list-disc pl-5">
        {data?.cashiers.map((c) => (
          <li key={c.id}>{c.full_name}</li>
        ))}
      </ul>
    </Modal>
  );
}
