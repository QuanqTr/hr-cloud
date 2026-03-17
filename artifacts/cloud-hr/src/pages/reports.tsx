import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetMonthlyReport, useListDepartments } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Reports() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [departmentId, setDepartmentId] = useState<string>("all");

  const { data: departments } = useListDepartments();
  const { data: report, isLoading } = useGetMonthlyReport({
    month,
    departmentId: departmentId !== "all" ? parseInt(departmentId) : undefined
  });

  return (
    <AppLayout>
      <div className="space-y-6 animate-in fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Monthly Reports</h1>
            <p className="text-muted-foreground mt-1">Detailed attendance metrics for payroll and review.</p>
          </div>
          <Button variant="outline" className="shadow-sm">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>

        <Card className="p-4 flex flex-wrap gap-4 items-end bg-card border-border/50 shadow-sm">
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <label className="text-sm font-medium">Select Month</label>
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <label className="text-sm font-medium">Department</label>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger><SelectValue placeholder="All Departments" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments?.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card className="border-border/50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-muted/50 text-muted-foreground font-semibold">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-4 py-4 text-center">Work Days</th>
                  <th className="px-4 py-4 text-center text-green-600">Present</th>
                  <th className="px-4 py-4 text-center text-red-600">Absent</th>
                  <th className="px-4 py-4 text-center text-amber-600">Late</th>
                  <th className="px-4 py-4 text-center text-blue-600">Leave</th>
                  <th className="px-6 py-4 text-right">Total Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  <tr><td colSpan={7} className="text-center py-8">Generating report...</td></tr>
                ) : !report?.stats || report.stats.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      No data available for this month.
                    </td>
                  </tr>
                ) : (
                  report.stats.map((stat) => (
                    <tr key={stat.employeeId} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">
                        {stat.fullName}
                        <div className="text-xs font-normal text-muted-foreground">{stat.departmentName}</div>
                      </td>
                      <td className="px-4 py-4 text-center font-medium">{stat.totalWorkDays}</td>
                      <td className="px-4 py-4 text-center font-bold text-green-700">{stat.presentDays}</td>
                      <td className="px-4 py-4 text-center font-bold text-red-700">{stat.absentDays}</td>
                      <td className="px-4 py-4 text-center font-bold text-amber-700">{stat.lateDays}</td>
                      <td className="px-4 py-4 text-center font-bold text-blue-700">{stat.leaveDays}</td>
                      <td className="px-6 py-4 text-right font-mono font-medium">{stat.totalWorkHours.toFixed(1)}h</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
