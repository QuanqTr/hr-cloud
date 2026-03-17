import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/use-auth";
import { useListLeaves, useCreateLeaveRequest, useUpdateLeaveStatus } from "@workspace/api-client-react";
import { CalendarDays, Plus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Leaves() {
  const { user, isEmployee, isAdmin, isManager } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leaves, isLoading } = useListLeaves(isEmployee ? { employeeId: user?.id } : {});
  const createMutation = useCreateLeaveRequest({ onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/leaves"] }) });
  const updateStatusMutation = useUpdateLeaveStatus({ onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/leaves"] }) });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ leaveType: "annual", startDate: "", endDate: "", reason: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({ data: formData as any });
      toast({ title: "Leave request submitted" });
      setIsDialogOpen(false);
      setFormData({ leaveType: "annual", startDate: "", endDate: "", reason: "" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  const handleStatusUpdate = async (id: number, status: "approved" | "rejected") => {
    try {
      await updateStatusMutation.mutateAsync({ id, data: { status, note: "" } });
      toast({ title: `Leave request ${status}` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-in fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Leave Requests</h1>
            <p className="text-muted-foreground mt-1">Manage time off and absences.</p>
          </div>
          {isEmployee && (
            <Button onClick={() => setIsDialogOpen(true)} className="shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" /> Request Leave
            </Button>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground font-semibold">
                <tr>
                  {!isEmployee && <th className="px-6 py-4">Employee</th>}
                  <th className="px-6 py-4">Leave Type</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Status</th>
                  {(isAdmin || isManager) && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  <tr><td colSpan={6} className="text-center py-8">Loading...</td></tr>
                ) : leaves?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      No leave requests found.
                    </td>
                  </tr>
                ) : (
                  leaves?.map((leave) => (
                    <tr key={leave.id} className="hover:bg-muted/30 transition-colors">
                      {!isEmployee && (
                        <td className="px-6 py-4 font-medium text-foreground">
                          {leave.fullName}
                          <div className="text-xs font-normal text-muted-foreground">{leave.departmentName}</div>
                        </td>
                      )}
                      <td className="px-6 py-4 capitalize font-medium">{leave.leaveType}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {format(new Date(leave.startDate), 'MMM d')} - {format(new Date(leave.endDate), 'MMM d, yyyy')}
                        <div className="text-xs font-medium text-foreground mt-0.5">{leave.totalDays} Days</div>
                      </td>
                      <td className="px-6 py-4 max-w-[200px] truncate" title={leave.reason}>{leave.reason}</td>
                      <td className="px-6 py-4"><StatusBadge status={leave.status} /></td>
                      {(isAdmin || isManager) && (
                        <td className="px-6 py-4 text-right">
                          {leave.status === "pending" ? (
                            <div className="flex items-center justify-end gap-2">
                              <Button size="sm" variant="outline" className="border-green-200 bg-green-50 hover:bg-green-100 text-green-700 hover:text-green-800" onClick={() => handleStatusUpdate(leave.id, "approved")}>
                                <Check className="w-4 h-4 mr-1" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" className="border-red-200 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800" onClick={() => handleStatusUpdate(leave.id, "rejected")}>
                                <X className="w-4 h-4 mr-1" /> Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Action taken</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Request Leave</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Leave Type</Label>
                  <Select value={formData.leaveType} onValueChange={(val) => setFormData({...formData, leaveType: val})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annual">Annual Leave</SelectItem>
                      <SelectItem value="sick">Sick Leave</SelectItem>
                      <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Input value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} required placeholder="Brief explanation..." />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>Submit Request</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
