"use client";

import { AttendanceFilters } from "@/features/attendance/components/AttendanceFilters";
import { AttendanceHistoryTable } from "@/features/attendance/components/AttendanceHistoryTable";
import { useAttendanceHistory } from "@/features/attendance/hooks/useAttendanceHistory";

export default function AttendancePage() {
  const {
    records, branches, loading,
    selectedBranch, setSelectedBranch,
    dateRange, setDateRange,
    expectedStartTime,
  } = useAttendanceHistory();

  return (
    <div className="p-6">
      <AttendanceFilters
        branches={branches}
        selectedBranch={selectedBranch}
        dateRange={dateRange}
        expectedStartTime={expectedStartTime}
        onBranchChange={setSelectedBranch}
        onDateRangeChange={setDateRange}
      />
      <AttendanceHistoryTable records={records} loading={loading} />
    </div>
  );
}
