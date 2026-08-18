import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { isAuthenticated, isSuperAdmin } from "@/lib/auth";
import { login, type LoginPayload } from "@/services/auth.service";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

type LoginFormValues = z.infer<typeof loginSchema>;

const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe a senha."),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  if (isAuthenticated()) {
    const defaultHome = isSuperAdmin() ? "/super-admin/dashboard" : "/";
    return <Navigate to={defaultHome} replace />;
  }

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);

    try {
      await login(values as LoginPayload);

      const isSuper = isSuperAdmin();
      const defaultHome = isSuper ? "/super-admin/dashboard" : "/";
      let redirectTo = defaultHome;

      if (typeof location.state === "object" && location.state && "from" in location.state) {
        const from = String((location.state as { from?: string }).from || "");
        if (from && from !== "/login") {
          if (isSuper && from.startsWith("/super-admin")) {
            redirectTo = from;
          } else if (!isSuper && !from.startsWith("/super-admin")) {
            redirectTo = from;
          }
        }
      }

      navigate(redirectTo, { replace: true });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao entrar",
        description: error instanceof Error ? error.message : "Não foi possível fazer login.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="space-y-1">
            <CardTitle>Entrar no painel</CardTitle>
            <CardDescription>Use suas credenciais para acessar o administrativo.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="admin@admin.com" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Digite sua senha" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Entrar
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
