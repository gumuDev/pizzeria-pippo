"use client";

import { Select, DatePicker, Button, Space, Typography } from "antd";
import type { Dayjs } from "dayjs";
import { PRESET_RANGES } from "../hooks/useReportFilters";
import type { Branch } from "../types/reports.types";

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface Props {
  branches: Branch[];
  selectedBranch: string;
  dateRange: [Dayjs, Dayjs];
  onBranchChange: (val: string) => void;
  onDateRangeChange: (range: [Dayjs, Dayjs]) => void;
}

export function ReportFilters({ branches, selectedBranch, dateRange, onBranchChange, onDateRangeChange }: Props) {
  return (
    <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
      <Title level={4} className="!mb-0">Reportes</Title>
      <Space wrap>
        {PRESET_RANGES.map((p) => (
          <Button key={p.label} size="small" onClick={() => onDateRangeChange(p.range)}>
            {p.label}
          </Button>
        ))}
        <RangePicker
          value={dateRange}
          onChange={(v) => { if (v?.[0] && v?.[1]) onDateRangeChange([v[0], v[1]]); }}
          format="DD/MM/YYYY"
          size="small"
        />
        <Select
          value={selectedBranch}
          onChange={onBranchChange}
          style={{ width: 180 }}
          size="small"
          options={[
            { value: "all", label: "Todas las sucursales" },
            ...branches.map((b) => ({ value: b.id, label: b.name })),
          ]}
        />
      </Space>
    </div>
  );
}
