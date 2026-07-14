"use client";

import { Select, DatePicker, Row, Col } from "antd";
import type { Dayjs } from "dayjs";

const { RangePicker } = DatePicker;

interface Props {
  filterOrigin: string | undefined;
  onFilterOriginChange: (value: string | undefined) => void;
  filterType: string | undefined;
  onFilterTypeChange: (value: string | undefined) => void;
  filterIngredient: string | undefined;
  onFilterIngredientChange: (value: string | undefined) => void;
  ingredients: { id: string; name: string }[];
  filterBranch: string | undefined;
  onFilterBranchChange: (value: string | undefined) => void;
  branches: { id: string; name: string }[];
  filterDates: [Dayjs | null, Dayjs | null] | null;
  onFilterDatesChange: (dates: [Dayjs | null, Dayjs | null] | null) => void;
}

export function WarehouseMovementsFilters({
  filterOrigin, onFilterOriginChange,
  filterType, onFilterTypeChange,
  filterIngredient, onFilterIngredientChange, ingredients,
  filterBranch, onFilterBranchChange, branches,
  filterDates, onFilterDatesChange,
}: Props) {
  return (
    <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
      <Col xs={24} sm={12} md={4}>
        <Select allowClear placeholder="Origen" style={{ width: "100%" }} value={filterOrigin} onChange={onFilterOriginChange}
          options={[{ value: "ingredient", label: "🧂 Insumo" }, { value: "product", label: "📦 Reventa" }]}
        />
      </Col>
      <Col xs={24} sm={12} md={4}>
        <Select allowClear placeholder="Tipo" style={{ width: "100%" }} value={filterType} onChange={onFilterTypeChange}
          options={[{ value: "compra", label: "Compra" }, { value: "transferencia", label: "Transferencia" }, { value: "ajuste", label: "Ajuste" }]}
        />
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Select allowClear showSearch placeholder="Insumo / Producto" style={{ width: "100%" }}
          value={filterIngredient} onChange={onFilterIngredientChange} disabled={filterOrigin === "product"}
          options={ingredients.map((i) => ({ value: i.id, label: i.name }))}
          filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
        />
      </Col>
      <Col xs={24} sm={12} md={4}>
        <Select allowClear placeholder="Sucursal destino" style={{ width: "100%" }}
          value={filterBranch} onChange={onFilterBranchChange}
          options={branches.map((b) => ({ value: b.id, label: b.name }))}
        />
      </Col>
      <Col xs={24} sm={24} md={6}>
        <RangePicker style={{ width: "100%" }} value={filterDates}
          onChange={(dates) => onFilterDatesChange(dates as [Dayjs | null, Dayjs | null] | null)}
          format="DD/MM/YYYY"
        />
      </Col>
    </Row>
  );
}
