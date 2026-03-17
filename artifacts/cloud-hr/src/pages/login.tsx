import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      setIsSubmitting(true);
      await login(data);
      window.location.href = "/";
    } catch (error: any) {
      toast({
        title: "Đăng nhập thất bại",
        description: error?.data?.message || error.message || "Sai tên đăng nhập hoặc mật khẩu",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/10 via-background to-background -z-10" />
        
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-6">
              <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="w-16 h-16 shadow-xl rounded-2xl" />
            </div>
            <h1 className="text-4xl font-display font-bold tracking-tight text-foreground">Welcome Back</h1>
            <p className="text-muted-foreground">Sign in to Cloud HR Management System</p>
          </div>

          <div className="glass-panel p-8 rounded-3xl">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input 
                      {...form.register("username")} 
                      className="pl-10 h-12 bg-white/50 focus:bg-white transition-colors border-border/50 focus:border-primary"
                      placeholder="Enter your username"
                    />
                  </div>
                  {form.formState.errors.username && (
                    <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input 
                      {...form.register("password")} 
                      type="password" 
                      className="pl-10 h-12 bg-white/50 focus:bg-white transition-colors border-border/50 focus:border-primary"
                      placeholder="••••••••"
                    />
                  </div>
                  {form.formState.errors.password && (
                    <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                  )}
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.98]" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : "Sign In"}
              </Button>
            </form>
          </div>
          
          <p className="text-center text-sm text-muted-foreground">
            Secure enterprise access. Protected by Cloud HR.
          </p>
        </div>
      </div>
      
      <div className="hidden lg:block lg:flex-1 relative">
        <img 
          src={`${import.meta.env.BASE_URL}images/login-bg.png`} 
          alt="Office Background" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-sidebar/20 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-sidebar/80 via-transparent to-transparent" />
        
        <div className="absolute bottom-12 left-12 right-12 text-white p-8 glass-panel !bg-white/10 !border-white/20 rounded-3xl">
          <h2 className="text-3xl font-display font-bold mb-2">Empower Your Workforce</h2>
          <p className="text-white/80 text-lg">Streamline HR processes, manage attendance beautifully, and give your team the tools they need to succeed.</p>
        </div>
      </div>
    </div>
  );
}
