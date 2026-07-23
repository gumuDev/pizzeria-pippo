"use client";

import { Table, Tag, Typography } from "antd";
import type { AttendanceRecord } from "../types/attendance.types";

const { Text } = Typography;

interface Props {
  records: AttendanceRecord[];
  loading: boolean;
}

export function AttendanceHistoryTable({ records, loading }: Props) {
  return (
    <Table
      dataSource={records}
      loading={loading}
      rowKey="id"
      size="small"
      columns={[
        { title: "Empleado", dataIndex: "employee_name" },
        { title: "Puesto", dataIndex: "position" },
        { title: "Sucursal", dataIndex: "branch_name" },
        {
          title: "Tipo",
          dataIndex: "type",
          render: (type: string) => (
            <Tag color={type === "entrada" ? "green" : "orange"}>{type === "entrada" ? "Entrada" : "Salida"}</Tag>
          ),
        },
        {
          title: "Fecha y hora",
          dataIndex: "created_at",
          render: (createdAt: string) => <Text>{new Date(createdAt).toLocaleString("es-BO")}</Text>,
        },
      ]}
    />
  );
}
