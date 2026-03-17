import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle, Mail, Phone, MapPin, Briefcase, Building } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();

  return (
    <AppLayout>
      <div className="space-y-8 animate-in fade-in max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground mt-1">View your personal information and account details.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="col-span-1 border-border/50 shadow-md">
            <CardContent className="p-8 flex flex-col items-center text-center">
              <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center text-5xl font-display font-bold text-primary mb-6 shadow-inner">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <h2 className="text-2xl font-bold text-foreground">{user?.fullName}</h2>
              <p className="text-primary font-medium mt-1 uppercase tracking-wider text-sm">{user?.role}</p>
              
              <div className="mt-8 w-full space-y-4">
                <div className="flex items-center gap-3 text-muted-foreground justify-center">
                  <Briefcase className="w-5 h-5 text-primary/60" />
                  <span>Employee ID: {user?.employeeId || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground justify-center">
                  <Building className="w-5 h-5 text-primary/60" />
                  <span>{user?.departmentName || 'No Department'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1 md:col-span-2 border-border/50 shadow-md">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="font-display">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                    <UserCircle className="w-4 h-4" /> System Username
                  </label>
                  <p className="font-medium text-lg">{user?.username}</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" /> Email Address
                  </label>
                  <p className="font-medium text-lg">contact@company.com</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" /> Phone Number
                  </label>
                  <p className="font-medium text-lg">+1 (555) 123-4567</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" /> Address
                  </label>
                  <p className="font-medium text-lg">123 Corporate Blvd, Suite 100</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
