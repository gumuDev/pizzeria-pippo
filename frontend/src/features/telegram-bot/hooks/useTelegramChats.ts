"use client";

import { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import { AuthorizedChat, ChatFormValues } from "@/features/telegram-bot/types";
import {
  getAuthorizedChats,
  createAuthorizedChat,
  updateAuthorizedChat,
  deleteAuthorizedChat,
} from "@/features/telegram-bot/services/telegramBot.service";

export function useTelegramChats() {
  const [chats, setChats] = useState<AuthorizedChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AuthorizedChat | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setChats(await getAuthorizedChats());
    } catch {
      message.error("Error al cargar los chats autorizados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = useCallback(() => { setEditing(null); setModalOpen(true); }, []);
  const openEdit = useCallback((chat: AuthorizedChat) => { setEditing(chat); setModalOpen(true); }, []);
  const closeModal = useCallback(() => { setModalOpen(false); setEditing(null); }, []);

  const handleSave = useCallback(async (values: ChatFormValues) => {
    try {
      if (editing) {
        await updateAuthorizedChat(editing.id, { label: values.label, plan: values.plan });
        message.success("Chat actualizado");
      } else {
        await createAuthorizedChat(values);
        message.success("Chat autorizado");
      }
      closeModal();
      await load();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Error al guardar");
    }
  }, [editing, closeModal, load]);

  const handleToggleActive = useCallback(async (chat: AuthorizedChat) => {
    try {
      await updateAuthorizedChat(chat.id, { is_active: !chat.is_active });
      await load();
    } catch {
      message.error("Error al cambiar el estado");
    }
  }, [load]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteAuthorizedChat(id);
      message.success("Acceso revocado");
      await load();
    } catch {
      message.error("Error al revocar el acceso");
    }
  }, [load]);

  return {
    chats,
    loading,
    modalOpen,
    editing,
    openCreate,
    openEdit,
    closeModal,
    handleSave,
    handleToggleActive,
    handleDelete,
  };
}
