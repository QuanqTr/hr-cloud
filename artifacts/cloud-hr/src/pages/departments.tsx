import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment, useListEmployees } from "@workspace/api-client-react";
import { Plus, Edit2, Trash2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";

export default function Departments() {
  const { data: departments, isLoading } = useListDepartments();
  const { data: employees } = useListEmployees();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const createMutation = useCreateDepartment({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/departments"] }) } });
  const updateMutation = useUpdateDepartment({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/departments"] }) } });
  const deleteMutation = useDeleteDepartment({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/departments"] }) } });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({ name: "", description: "", managerId: "" });

  const handleOpenDialog = (dept?: any) => {
    if (dept) {
      setEditingId(dept.id);
      setFormData({ name: dept.name, description: dept.description || "", managerId: dept.managerId?.toString() || "" });
    } else {
      setEditingId(null);
      setFormData({ name: "", description: "", managerId: "" });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        managerId: formData.managerId ? parseInt(formData.managerId) : undefined
      };

      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
        toast({ title: "Department updated successfully" });
      } else {
        await createMutation.mutateAsync({ data: payload });
        toast({ title: "Department created successfully" });
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this department?")) {
      try {
        await deleteMutation.mutateAsync({ id });
        toast({ title: "Department deleted" });
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
            <h1 className="text-3xl font-display font-bold text-foreground">Departments</h1>
            <p className="text-muted-foreground mt-1">Manage company organizational structure.</p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" /> Add Department
          </Button>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground font-semibold">
                <tr>
                  <th className="px-6 py-4">Department Name</th>
                  <th className="px-6 py-4">Manager</th>
                  <th className="px-6 py-4">Employees</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr>
                ) : departments?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-muted-foreground">
                      <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      No departments found.
                    </td>
                  </tr>
                ) : (
                  departments?.map((dept) => (
                    <tr key={dept.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">
                        <div>{dept.name}</div>
                        {dept.description && <div className="text-xs text-muted-foreground font-normal mt-1">{dept.description}</div>}
                      </td>
                      <td className="px-6 py-4">{dept.managerName || <span className="text-muted-foreground italic">Not assigned</span>}</td>
                      <td className="px-6 py-4">
                        <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium">
                          {dept.employeeCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{format(new Date(dept.createdAt), 'MMM d, yyyy')}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(dept)}>
                            <Edit2 className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(dept.id)}>
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
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Department" : "Add Department"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input 
                    id="description" 
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Manager</Label>
                  <Select value={formData.managerId} onValueChange={(val) => setFormData({...formData, managerId: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {employees?.map(emp => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>{emp.fullName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
