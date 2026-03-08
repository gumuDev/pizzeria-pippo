"use client";

import { useState, useEffect } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { ReportsService } from "../services/reports.service";
import type { Branch } from "../types/reports.types";

export const PRESET_RANGES: { label: string; range: [Dayjs, Dayjs] }[] = [
  { label: "Hoy", range: [dayjs(), dayjs()] },
  { label: "Esta semana", range: [dayjs().startOf("week"), dayjs()] },
  { label: "Este mes", range: [dayjs().startOf("month"), dayjs()] },
];

export function useReportFilters() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([dayjs().startOf("month"), dayjs()]);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    ReportsService.getBranches().then(setBranches);
  }, []);

  const buildParams = () =>
    ReportsService.buildParams(
      selectedBranch,
      dateRange[0].format("YYYY-MM-DD"),
      dateRange[1].format("YYYY-MM-DD")
    );

  return {
    branches,
    selectedBranch, setSelectedBranch,
    dateRange, setDateRange,
    activeTab, setActiveTab,
    buildParams,
  };
}
