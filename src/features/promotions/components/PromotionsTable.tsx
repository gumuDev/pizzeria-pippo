"use client";

import { Table, Button, Space, Tag, Typography, Switch, Tooltip } from "antd";
import { PlusOutlined, EditOutlined, StopOutlined, CheckCircleOutlined, EyeOutlined } from "@ant-design/icons";
import { TYPE_OPTIONS, TYPE_COLORS, DAYS } from "../constants/promotion.constants";
import type { Promotion, Branch } from "../types/promotion.types";

const { Title, Text } = Typography;

interface Props {
  promotions: Promotion[];
  branches: Branch[];
  loading: boolean;
  showInactive: boolean;
  onToggleInactive: (val: boolean) => void;
  onCreate: () => void;
  onEdit: (promo: Promotion) => void;
  onToggleActive: (id: string, active: boolean) => void;
  onToggleIsActive: (promo: Promotion) => void;
}

export function PromotionsTable({ promotions, branches, loading, showInactive, onToggleInactive, onCreate, onEdit, onToggleActive, onToggleIsActive }: Props) {
  const columns = [
    { title: "Nombre", dataIndex: "name", key: "name" },
    {
      title: "Tipo",
      dataIndex: "type",
      key: "type",
      render: (t: string) => <Tag color={TYPE_COLORS[t]}>{TYPE_OPTIONS.find((o) => o.value === t)?.label ?? t}</Tag>,
    },
    {
      title: "Días",
      dataIndex: "days_of_week",
      key: "days_of_week",
      render: (days: number[]) => (
        <Space size={2}>
          {DAYS.map((d) => (
            <Tag key={d.value} color={days.includes(d.value) ? "blue" : "default"}>{d.label}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "Vigencia",
      key: "dates",
      render: (_: unknown, r: Promotion) => (
        <Text className="text-xs">{r.start_date} → {r.end_date}</Text>
      ),
    },
    {
      title: "Sucursal",
      key: "branch",
      render: (_: unknown, r: Promotion) =>
        r.branch_id
          ? <Tag>{branches.find((b) => b.id === r.branch_id)?.name ?? r.branch_id}</Tag>
          : <Tag color="purple">Todas</Tag>,
    },
    {
      title: "Activa",
      key: "active",
      render: (_: unknown, r: Promotion) => (
        <Switch checked={r.active} size="small" onChange={(val) => onToggleActive(r.id, val)} />
      ),
    },
    {
      title: "Acciones",
      key: "actions",
      width: 100,
      render: (_: unknown, r: Promotion) => (
        <Space>
          <Tooltip title="Editar">
            <Button icon={<EditOutlined />} size="small" onClick={() => onEdit(r)} />
          </Tooltip>
          <Tooltip title={r.is_active ? "Desactivar" : "Reactivar"}>
            <Button
              icon={r.is_active ? <StopOutlined /> : <CheckCircleOutlined />}
              size="small"
              danger={r.is_active}
              onClick={() => onToggleIsActive(r)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <Title level={4} className="!mb-0">Promociones</Title>
        <Space>
          <Space>
            <EyeOutlined style={{ color: "#6b7280" }} />
            <Text type="secondary">Ver inactivas</Text>
            <Switch size="small" checked={showInactive} onChange={onToggleInactive} />
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
            Nueva promoción
          </Button>
        </Space>
      </div>
      <Table dataSource={promotions} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 20 }} />
    </>
  );
}
