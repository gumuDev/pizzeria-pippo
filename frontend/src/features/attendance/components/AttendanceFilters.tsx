"use client";

import { Select, DatePicker, Typography, Space } from "antd";
import type { Dayjs } from "dayjs";
import type { Branch } from "@/features/branches/types/branch.types";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface Props {
  branches: Branch[];
  selectedBranch: string;
  dateRange: [Dayjs, Dayjs];
  expectedStartTime: string | null;
  onBranchChange: (val: string) => void;
  onDateRangeChange: (range: [Dayjs, Dayjs]) => void;
}

export function AttendanceFilters({ branches, selectedBranch, dateRange, expectedStartTime, onBranchChange, onDateRangeChange }: Props) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12 }}>
      <div>
        <Title level={4} style={{ margin: 0 }}>Asistencia</Title>
        {expectedStartTime && (
          <Text type="secondary" style={{ fontSize: 12 }}>Horario de entrada: {expectedStartTime}</Text>
        )}
      </div>

      <Space wrap>
        <RangePicker
          value={dateRange}
          onChange={(dates) => {
            if (dates?.[0] && dates?.[1]) onDateRangeChange([dates[0], dates[1]]);
          }}
          format="DD/MM/YYYY"
          size="small"
        />
        <Select
          value={selectedBranch}
          onChange={onBranchChange}
          style={{ width: 180 }}
          size="small"
          options={[{ value: "all", label: "Todas las sucursales" }, ...branches.map((b) => ({ value: b.id, label: b.name }))]}
        />
      </Space>
    </div>
  );
}
