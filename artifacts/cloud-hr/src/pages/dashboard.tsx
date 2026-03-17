import { AppLayout } from "@/components/layout/AppLayout";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Users, Building2, UserCheck, AlertCircle, Clock, FileWarning, CalendarDays } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: summary, isLoading } = useGetDashboardSummary();

  const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
    <Card className="hover:shadow-lg transition-all duration-300 border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-xl ${colorClass} bg-opacity-10`}>
          <Icon className={`w-5 h-5 ${colorClass.replace('bg-', 'text-').replace('-100', '-600')}`} />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-3xl font-display font-bold text-foreground">{value}</div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <AppLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of today's attendance and company metrics.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Employees" value={summary?.totalEmployees || 0} icon={Users} colorClass="bg-blue-100" />
          <StatCard title="Departments" value={summary?.totalDepartments || 0} icon={Building2} colorClass="bg-indigo-100" />
          <StatCard title="Today Present" value={summary?.todayPresent || 0} icon={UserCheck} colorClass="bg-green-100" />
          <StatCard title="Pending Leaves" value={summary?.pendingLeaves || 0} icon={FileWarning} colorClass="bg-orange-100" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="col-span-1 lg:col-span-2 border-border/50 shadow-md">
            <CardHeader>
              <CardTitle className="font-display">Recent Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => <Skeleton key={i} className="w-full h-16 rounded-xl" />)}
                </div>
              ) : summary?.recentAttendance?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
                  <Clock className="w-12 h-12 mb-3 text-muted-foreground/50" />
                  <p>No recent attendance records.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {summary?.recentAttendance?.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {record.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{record.fullName}</p>
                          <p className="text-sm text-muted-foreground">{record.departmentName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-medium">In: {record.checkIn ?? '--:--'}</p>
                          <p className="text-xs text-muted-foreground">Out: {record.checkOut ?? '--:--'}</p>
                        </div>
                        <StatusBadge status={record.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-1 border-border/50 shadow-md">
            <CardHeader>
              <CardTitle className="font-display">Today's Highlights</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="text-red-500 w-5 h-5" />
                      <span className="font-medium text-red-900 dark:text-red-400">Absent Today</span>
                    </div>
                    <span className="text-xl font-bold text-red-700 dark:text-red-500">{summary?.todayAbsent || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30">
                    <div className="flex items-center gap-3">
                      <Clock className="text-amber-500 w-5 h-5" />
                      <span className="font-medium text-amber-900 dark:text-amber-400">Late Arrivals</span>
                    </div>
                    <span className="text-xl font-bold text-amber-700 dark:text-amber-500">{summary?.todayLate || 0}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                    <div className="flex items-center gap-3">
                      <CalendarDays className="text-blue-500 w-5 h-5" />
                      <span className="font-medium text-blue-900 dark:text-blue-400">On Leave</span>
                    </div>
                    <span className="text-xl font-bold text-blue-700 dark:text-blue-500">{summary?.todayOnLeave || 0}</span>
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
