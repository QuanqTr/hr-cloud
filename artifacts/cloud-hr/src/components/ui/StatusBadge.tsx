import { cn } from "@/lib/utils";
import { AttendanceRecordStatus, LeaveRequestStatus } from "@workspace/api-client-react";

type StatusType = AttendanceRecordStatus | LeaveRequestStatus | string;

export function StatusBadge({ status, className }: { status: StatusType; className?: string }) {
  const getStatusConfig = () => {
    switch (status) {
      case "on_time":
      case "approved":
        return { label: status === "on_time" ? "On Time" : "Approved", classes: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400" };
      case "late":
        return { label: "Late", classes: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400" };
      case "early_leave":
        return { label: "Early Leave", classes: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400" };
      case "absent":
      case "rejected":
        return { label: status === "absent" ? "Absent" : "Rejected", classes: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400" };
      case "on_leave":
        return { label: "On Leave", classes: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400" };
      case "pending":
        return { label: "Pending", classes: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-400" };
      default:
        return { label: status, classes: "bg-gray-100 text-gray-800 border-gray-200" };
    }
  };

  const config = getStatusConfig();

  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold border inline-flex items-center shadow-sm whitespace-nowrap", config.classes, className)}>
      {config.label}
    </span>
  );
}
