import { AppLayout } from "@/components/layout/AppLayout";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Clock, AlertTriangle, CalendarDays } from "lucide-react";

export default function Settings() {
  const { data: settings, isLoading } = useGetSettings();
  const updateMutation = useUpdateSettings();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    workStartTime: "09:00",
    workEndTime: "18:00",
    lateThresholdMinutes: 15,
    earlyLeaveThresholdMinutes: 15,
    standardWorkHours: 8,
    annualLeaveEntitlement: 20
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        workStartTime: settings.workStartTime,
        workEndTime: settings.workEndTime,
        lateThresholdMinutes: settings.lateThresholdMinutes,
        earlyLeaveThresholdMinutes: settings.earlyLeaveThresholdMinutes,
        standardWorkHours: settings.standardWorkHours,
        annualLeaveEntitlement: settings.annualLeaveEntitlement
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync({ 
        data: {
          ...formData,
          weeklyOffDays: ["0", "6"] // Hardcoded for demo simplicity
        } 
      });
      toast({ title: "Settings updated successfully" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  if (isLoading) return <AppLayout><div className="p-8">Loading settings...</div></AppLayout>;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">System Settings</h1>
          <p className="text-muted-foreground mt-1">Configure company-wide HR policies and thresholds.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="bg-muted/20 border-b">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <CardTitle>Working Hours</CardTitle>
              </div>
              <CardDescription>Define standard operating hours for the company.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Work Start Time</Label>
                <Input type="time" value={formData.workStartTime} onChange={e => setFormData({...formData, workStartTime: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Work End Time</Label>
                <Input type="time" value={formData.workEndTime} onChange={e => setFormData({...formData, workEndTime: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Standard Daily Hours</Label>
                <Input type="number" step="0.5" value={formData.standardWorkHours} onChange={e => setFormData({...formData, standardWorkHours: parseFloat(e.target.value)})} required />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="bg-muted/20 border-b">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <CardTitle>Attendance Thresholds</CardTitle>
              </div>
              <CardDescription>Grace periods before marking an employee as late or leaving early.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Late Threshold (Minutes)</Label>
                <Input type="number" value={formData.lateThresholdMinutes} onChange={e => setFormData({...formData, lateThresholdMinutes: parseInt(e.target.value)})} required />
              </div>
              <div className="space-y-2">
                <Label>Early Leave Threshold (Minutes)</Label>
                <Input type="number" value={formData.earlyLeaveThresholdMinutes} onChange={e => setFormData({...formData, earlyLeaveThresholdMinutes: parseInt(e.target.value)})} required />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="bg-muted/20 border-b">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-green-600" />
                <CardTitle>Leave Policies</CardTitle>
              </div>
              <CardDescription>Configure annual leave entitlements.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2 max-w-md">
                <Label>Annual Leave Entitlement (Days)</Label>
                <Input type="number" value={formData.annualLeaveEntitlement} onChange={e => setFormData({...formData, annualLeaveEntitlement: parseInt(e.target.value)})} required />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-4">
            <Button type="submit" size="lg" className="w-full sm:w-auto shadow-lg shadow-primary/20" disabled={updateMutation.isPending}>
              Save Settings
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
