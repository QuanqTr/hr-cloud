import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee, useListDepartments } from "@workspace/api-client-react";
import { Plus, Edit2, Trash2, Search, Users as UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";

export default function Employees() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState<string>("all");
  
  const { data: employees, isLoading } = useListEmployees({ 
    search: searchTerm || undefined,
    departmentId: filterDept !== "all" ? parseInt(filterDept) : undefined
  });
  const { data: departments } = useListDepartments();
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const createMutation = useCreateEmployee({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/employees"] }) } });
  const updateMutation = useUpdateEmployee({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/employees"] }) } });
  const deleteMutation = useDeleteEmployee({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/employees"] }) } });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const defaultForm = {
    employeeCode: "", fullName: "", position: "", departmentId: "none", 
    email: "", phone: "", username: "", password: "", role: "employee", fingerprintId: ""
  };
  const [formData, setFormData] = useState(defaultForm);

  const handleOpenDialog = (emp?: any) => {
    if (emp) {
      setEditingId(emp.id);
      setFormData({
        ...defaultForm,
        ...emp,
        departmentId: emp.departmentId?.toString() || "none",
        password: "" // Don't prefill password on edit
      });
    } else {
      setEditingId(null);
      setFormData(defaultForm);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        ...formData,
        departmentId: formData.departmentId === "none" ? undefined : parseInt(formData.departmentId)
      };

      if (editingId) {
        delete payload.password; // Ignore password on edit for simplicity in this UI
        delete payload.employeeCode;
        delete payload.username;
        await updateMutation.mutateAsync({ id: editingId, data: payload });
        toast({ title: "Employee updated successfully" });
      } else {
        await createMutation.mutateAsync({ data: payload });
        toast({ title: "Employee created successfully" });
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this employee? This action cannot be undone.")) {
      try {
        await deleteMutation.mutateAsync({ id });
        toast({ title: "Employee deleted" });
      } catch (err: any) {
        toast({ variant: "destructive", title: "Error", description: err.message });
      }
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-in fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Employees</h1>
            <p className="text-muted-foreground mt-1">Manage your workforce and access rights.</p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" /> Add Employee
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search employees..." 
              className="pl-10 max-w-md bg-card"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="w-full sm:w-[200px] bg-card">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments?.map(d => (
                <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground font-semibold">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Role & Dept</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr>
                ) : employees?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-muted-foreground">
                      <UsersIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      No employees found.
                    </td>
                  </tr>
                ) : (
                  employees?.map((emp) => (
                    <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">
                            {emp.fullName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">{emp.fullName}</div>
                            <div className="text-xs text-muted-foreground">{emp.position}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{emp.employeeCode}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{emp.role}</span>
                          <span className="text-xs text-muted-foreground">{emp.departmentName || 'No Dept'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        <div>{emp.email || '--'}</div>
                        <div>{emp.phone || '--'}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(emp)}>
                            <Edit2 className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(emp.id)}>
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Employee" : "Add Employee"}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                {!editingId && (
                  <div className="space-y-2">
                    <Label>Employee Code *</Label>
                    <Input value={formData.employeeCode} onChange={e => setFormData({...formData, employeeCode: e.target.value})} required />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Position *</Label>
                  <Input value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={formData.departmentId} onValueChange={(val) => setFormData({...formData, departmentId: val})}>
                    <SelectTrigger><SelectValue placeholder="Select Dept" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {departments?.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>System Role *</Label>
                  <Select value={formData.role} onValueChange={(val) => setFormData({...formData, role: val as any})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fingerprint ID (Optional)</Label>
                  <Input value={formData.fingerprintId} onChange={e => setFormData({...formData, fingerprintId: e.target.value})} placeholder="For attendance simulation" />
                </div>
                {!editingId && (
                  <>
                    <div className="space-y-2">
                      <Label>Username *</Label>
                      <Input value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Password *</Label>
                      <Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? "Save Changes" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
