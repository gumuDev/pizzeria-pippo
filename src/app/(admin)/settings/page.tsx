"use client";

import { Tabs } from "antd";
import { BellOutlined, RobotOutlined } from "@ant-design/icons";
import { TelegramSettingsForm } from "@/features/settings/components/TelegramSettingsForm";
import { BotSettingsForm } from "@/features/telegram-bot/components/BotSettingsForm";
import { AuthorizedChatsTable } from "@/features/telegram-bot/components/AuthorizedChatsTable";
import { ChatModal } from "@/features/telegram-bot/components/ChatModal";
import { useTelegramChats } from "@/features/telegram-bot/hooks/useTelegramChats";

function BotTab() {
  const { chats, loading, modalOpen, editing, openCreate, openEdit, closeModal, handleSave, handleToggleActive, handleDelete } = useTelegramChats();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <BotSettingsForm />
      <AuthorizedChatsTable
        chats={chats}
        loading={loading}
        onCreate={openCreate}
        onEdit={openEdit}
        onToggleActive={handleToggleActive}
        onDelete={handleDelete}
      />
      <ChatModal open={modalOpen} editing={editing} onClose={closeModal} onSave={handleSave} />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="p-6">
      <Tabs
        items={[
          {
            key: "notifications",
            label: <span><BellOutlined /> Notificaciones</span>,
            children: <TelegramSettingsForm />,
          },
          {
            key: "bot",
            label: <span><RobotOutlined /> Bot de IA</span>,
            children: <BotTab />,
          },
        ]}
      />
    </div>
  );
}
