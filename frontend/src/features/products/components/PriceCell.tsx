"use client";

import { useState } from "react";
import { Button, InputNumber, Space, Typography } from "antd";
import { EditOutlined, PlusOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface Props {
  variantId: string;
  branchId: string;
  price: number | undefined;
  saving: boolean;
  onSave: (variantId: string, branchId: string, price: number) => Promise<void>;
}

export function PriceCell({ variantId, branchId, price, saving, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<number>(price ?? 0);

  const handleSave = async () => {
    await onSave(variantId, branchId, value);
    setEditing(false);
  };

  const handleCancel = () => {
    setValue(price ?? 0);
    setEditing(false);
  };

  if (editing) {
    return (
      <Space>
        <InputNumber
          prefix="Bs"
          value={value}
          onChange={(v) => setValue(v ?? 0)}
          min={0}
          style={{ width: 110 }}
          autoFocus
          onPressEnter={handleSave}
        />
        <Button size="small" type="primary" icon={<CheckOutlined />} loading={saving} onClick={handleSave} />
        <Button size="small" icon={<CloseOutlined />} onClick={handleCancel} />
      </Space>
    );
  }

  if (price !== undefined) {
    return (
      <Space>
        <Text strong>Bs {Number(price).toFixed(2)}</Text>
        <Button size="small" icon={<EditOutlined />} onClick={() => { setValue(price); setEditing(true); }} />
      </Space>
    );
  }

  return (
    <Button size="small" icon={<PlusOutlined />} onClick={() => { setValue(0); setEditing(true); }}>
      Asignar
    </Button>
  );
}
