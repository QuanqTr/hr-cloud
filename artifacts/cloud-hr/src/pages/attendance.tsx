import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/use-auth";
import { useListAttendance, useGetTodayAttendance, useCheckIn, useCheckOut, useListEmployees } from "@workspace/api-client-react";
import { Fingerprint, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function Attendance() {
  const { user, isEmployee } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Admin/Manager Filters
  const [filterDate, setFilterDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [filterEmp, setFilterEmp] = useState<string>("all");

  const { data: todayRecord, isLoading: isTodayLoading } = useGetTodayAttendance();
  const { data: allRecords, isLoading: isAllLoading } = useListAttendance(
    !isEmployee ? { date: filterDate, employeeId: filterEmp !== "all" ? parseInt(filterEmp) : undefined } : { employeeId: user?.id }
  );
  const { data: employees } = useListEmployees();

  const checkInMutation = useCheckIn({ onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/attendance"] }) });
  const checkOutMutation = useCheckOut({ onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/attendance"] }) });

  const [isScanning, setIsScanning] = useState(false);

  const handleScan = async (type: 'in' | 'out') => {
    setIsScanning(true);
    // Simulate fingerprint scan delay
    setTimeout(async () => {
      try {
        const payload = { fingerprintId: "simulated-fingerprint" };
        if (type === 'in') {
          await checkInMutation.mutateAsync({ data: payload });
          toast({ title: "Checked In Successfully" });
        } else {
          await checkOutMutation.mutateAsync({ data: payload });
          toast({ title: "Checked Out Successfully" });
        }
      } catch (err: any) {
        toast({ variant: "destructive", title: "Scan Failed", description: err.message });
      } finally {
        setIsScanning(false);
      }
    }, 2000);
  };

  return (
    <AppLayout>
      <div className="space-y-8 animate-in fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Attendance</h1>
          <p className="text-muted-foreground mt-1">Manage and track daily time records.</p>
        </div>

        {isEmployee && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-border/50 shadow-lg overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-6">
                <div className="relative w-32 h-32 flex items-center justify-center rounded-full bg-primary/10 border-4 border-primary/20 shadow-inner">
                  <Fingerprint className={`w-16 h-16 text-primary ${isScanning ? 'opacity-50' : ''}`} />
                  {isScanning && (
                    <div className="absolute inset-0 overflow-hidden rounded-full rounded-full">
                      <div className="w-full h-full scanner-line" />
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-display font-bold">Simulate Fingerprint</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">Place your finger on the scanner to record your attendance for today.</p>
                </div>

                <div className="flex gap-4 w-full justify-center">
                  <Button 
                    size="lg" 
                    className="w-32 shadow-lg shadow-primary/20"
                    onClick={() => handleScan('in')}
                    disabled={isScanning || !!todayRecord?.checkIn}
                  >
                    Check In
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="w-32 border-2"
                    onClick={() => handleScan('out')}
                    disabled={isScanning || !todayRecord?.checkIn || !!todayRecord?.checkOut}
                  >
                    Check Out
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-md">
              <CardContent className="p-8 space-y-6">
                <h3 className="text-xl font-display font-semibold border-b pb-4">Today's Record</h3>
                {isTodayLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : todayRecord ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center bg-muted/50 p-4 rounded-xl">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground font-medium">Check In</p>
                        <p className="text-2xl font-mono font-bold">{todayRecord.checkIn ?? '--:--'}</p>
                      </div>
                      <div className="space-y-1 text-right">
                        <p className="text-sm text-muted-foreground font-medium">Check Out</p>
                        <p className="text-2xl font-mono font-bold">{todayRecord.checkOut ?? '--:--'}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Current Status</span>
                        <StatusBadge status={todayRecord.status} />
                      </div>
                      {todayRecord.lateMinutes > 0 && (
                        <div className="flex justify-between items-center text-amber-600 text-sm font-medium">
                          <span>Late By</span>
                          <span>{todayRecord.lateMinutes} mins</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                    No attendance recorded yet today.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="border-border/50 shadow-sm">
          <div className="p-6 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-display font-semibold">{isEmployee ? "My History" : "Company Attendance"}</h3>
            {!isEmployee && (
              <div className="flex gap-3 w-full sm:w-auto">
                <Input 
                  type="date" 
                  value={filterDate} 
                  onChange={(e) => setFilterDate(e.target.value)} 
                  className="w-full sm:w-auto"
                />
                <Select value={filterEmp} onValueChange={setFilterEmp}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="All Employees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    {employees?.map(e => <SelectItem key={e.id} value={e.id.toString()}>{e.fullName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/30 text-muted-foreground font-semibold">
                <tr>
                  {!isEmployee && <th className="px-6 py-4">Employee</th>}
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Check In</th>
                  <th className="px-6 py-4">Check Out</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Work Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isAllLoading ? (
                  <tr><td colSpan={6} className="text-center py-8">Loading...</td></tr>
                ) : allRecords?.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No records found.</td></tr>
                ) : (
                  allRecords?.map((record) => (
                    <tr key={record.id} className="hover:bg-muted/10 transition-colors">
                      {!isEmployee && (
                        <td className="px-6 py-4 font-medium text-foreground">
                          {record.fullName}
                          <div className="text-xs font-normal text-muted-foreground">{record.departmentName}</div>
                        </td>
                      )}
                      <td className="px-6 py-4 text-muted-foreground">{format(new Date(record.date), 'MMM d, yyyy')}</td>
                      <td className="px-6 py-4 font-mono">{record.checkIn ?? '--:--'}</td>
                      <td className="px-6 py-4 font-mono">{record.checkOut ?? '--:--'}</td>
                      <td className="px-6 py-4"><StatusBadge status={record.status} /></td>
                      <td className="px-6 py-4 font-medium">{record.workHours ? `${record.workHours.toFixed(1)}h` : '-'}</td>
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
