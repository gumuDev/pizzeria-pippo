"use client";

import { Modal, Form, Input, Select, Switch, DatePicker, Row, Col, Checkbox } from "antd";
import type { FormInstance } from "antd";
import { PromotionRules } from "./PromotionRules";
import { TYPE_OPTIONS, DAYS } from "../constants/promotion.constants";

const ALL_DAYS = DAYS.map((d) => d.value);
import type { Promotion, Branch, Variant, Rule } from "../types/promotion.types";

interface Props {
  open: boolean;
  editing: Promotion | null;
  branches: Branch[];
  variants: Variant[];
  promoType: string;
  rules: Rule[];
  form: FormInstance;
  onClose: () => void;
  onSave: () => void;
  onTypeChange: (type: string) => void;
  onAddRule: () => void;
  onUpdateRule: (index: number, field: keyof Rule, value: unknown) => void;
  onRemoveRule: (index: number) => void;
}

export function PromotionModal({ open, editing, branches, variants, promoType, rules, form, onClose, onSave, onTypeChange, onAddRule, onUpdateRule, onRemoveRule }: Props) {
  const selectedDays: number[] = Form.useWatch("days_of_week", form) ?? [];
  const allDaysSelected = ALL_DAYS.every((d) => selectedDays.includes(d));

  const handleAllDaysToggle = (checked: boolean) => {
    form.setFieldValue("days_of_week", checked ? ALL_DAYS : []);
  };

  return (
    <Modal
      title={editing ? "Editar promoción" : "Nueva promoción"}
      open={open}
      onCancel={onClose}
      onOk={onSave}
      okText={editing ? "Guardar cambios" : "Crear promoción"}
      cancelText="Cancelar"
      width={680}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Row gutter={16}>
          <Col span={16}>
            <Form.Item label="Nombre" name="name" rules={[{ required: true, message: "Requerido" }]}>
              <Input placeholder="Ej: 2x1 los miércoles" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Activa" name="active" valuePropName="checked" initialValue={true}>
              <Switch />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Tipo" name="type" rules={[{ required: true, message: "Requerido" }]}>
              <Select options={TYPE_OPTIONS} placeholder="Seleccionar tipo" onChange={onTypeChange} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Sucursal" name="branch_id" initialValue="all">
              <Select options={[{ value: "all", label: "Todas las sucursales" }, ...branches.map((b) => ({ value: b.id, label: b.name }))]} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          label={
            <span className="flex items-center gap-3">
              Días de la semana
              <Checkbox checked={allDaysSelected} onChange={(e) => handleAllDaysToggle(e.target.checked)}>
                Toda la semana
              </Checkbox>
            </span>
          }
          name="days_of_week"
        >
          <Select mode="multiple" options={DAYS.map((d) => ({ value: d.value, label: d.label }))} placeholder="Todos los días si se deja vacío" />
        </Form.Item>
        <Form.Item label="Vigencia" name="dates" rules={[{ required: true, message: "Requerido" }]}>
          <DatePicker.RangePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
        </Form.Item>
        {promoType && (
          <PromotionRules
            promoType={promoType}
            rules={rules}
            variants={variants}
            onAdd={onAddRule}
            onUpdate={onUpdateRule}
            onRemove={onRemoveRule}
          />
        )}
      </Form>
    </Modal>
  );
}
