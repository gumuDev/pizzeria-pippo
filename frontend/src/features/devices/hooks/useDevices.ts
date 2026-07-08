"use client";

import { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import { DevicesService } from "../services/devices.service";
import { BranchesService } from "@/features/branches/services/branches.service";
import type { Branch } from "@/features/branches/types/branch.types";
import type { Device } from "../types/device.types";

export function useDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Device | null>(null);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [deviceList, branchList] = await Promise.all([DevicesService.getDevices(), BranchesService.getBranches()]);
    setDevices(deviceList);
    setBranches(branchList);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (device: Device) => { setEditing(device); setModalOpen(true); };
  const closeModal = () => setModalOpen(false);
  const closeApiKeyModal = () => setNewApiKey(null);

  const handleSubmit = async (values: { branch_id: string; name: string }) => {
    setSaving(true);
    if (editing) {
      const result = await DevicesService.updateDevice(editing.id, { name: values.name });
      if (result.ok) {
        message.success("Dispositivo actualizado");
        setModalOpen(false);
        load();
      } else {
        message.error(result.error ?? "Error al guardar");
      }
    } else {
      const result = await DevicesService.createDevice(values);
      if (result.ok && result.result) {
        setModalOpen(false);
        setNewApiKey(result.result.apiKey);
        load();
      } else {
        message.error(result.error ?? "Error al crear el dispositivo");
      }
    }
    setSaving(false);
  };

  const handleToggleActive = async (device: Device) => {
    const result = await DevicesService.updateDevice(device.id, { is_active: !device.is_active });
    if (result.ok) {
      message.success(device.is_active ? "Dispositivo desactivado" : "Dispositivo reactivado");
      load();
    } else {
      message.error(result.error ?? "Error al actualizar");
    }
  };

  const handleDelete = async (device: Device) => {
    const result = await DevicesService.updateDevice(device.id, { is_active: false });
    if (result.ok) {
      message.success("Dispositivo eliminado");
      load();
    } else {
      message.error(result.error ?? "Error al eliminar");
    }
  };

  return {
    devices, branches, loading, saving,
    modalOpen, editing, newApiKey,
    openCreate, openEdit, closeModal, closeApiKeyModal,
    handleSubmit, handleToggleActive, handleDelete,
  };
}
