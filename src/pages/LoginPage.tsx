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
import { Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";

type LoginFormValues = z.infer<typeof loginSchema>;

const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe a senha."),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <main className="login-scene relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 text-white">
      <div className="login-grid absolute inset-0" aria-hidden="true" />
      <div className="login-orb login-orb-primary absolute -left-24 top-[8%] h-72 w-72 rounded-full" aria-hidden="true" />
      <div className="login-orb login-orb-secondary absolute -right-24 bottom-[4%] h-80 w-80 rounded-full" aria-hidden="true" />
      <div className="login-orb login-orb-small absolute right-[20%] top-[12%] h-32 w-32 rounded-full" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-md">
        <div className="login-brand mb-7 flex items-center justify-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/30 bg-emerald-400/10 shadow-[0_0_32px_rgba(52,211,153,0.2)] backdrop-blur-md">
            <LockKeyhole className="h-5 w-5 text-emerald-300" aria-hidden="true" />
          </span>
          <div className="text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">Área segura</p>
            <p className="text-sm text-slate-400">Painel administrativo</p>
          </div>
        </div>

        <Card className="login-card overflow-hidden border-white/10 bg-slate-900/70 text-white shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-300/80 to-transparent" />
          <CardHeader className="space-y-3 px-6 pb-5 pt-8 text-center sm:px-8">
            <CardTitle className="text-2xl font-semibold tracking-tight sm:text-3xl">Bem-vindo de volta</CardTitle>
            <CardDescription className="text-sm leading-relaxed text-slate-400">
              Entre com suas credenciais para continuar.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-8 sm:px-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">E-mail</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        autoComplete="email"
                        className="h-12 border-white/10 bg-white/[0.06] text-white placeholder:text-slate-500 focus-visible:border-emerald-400/60 focus-visible:ring-emerald-400/20"
                        {...field}
                      />
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
                    <FormLabel className="text-slate-200">Senha</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Digite sua senha"
                          autoComplete="current-password"
                          className="h-12 border-white/10 bg-white/[0.06] pr-11 text-white placeholder:text-slate-500 focus-visible:border-emerald-400/60 focus-visible:ring-emerald-400/20"
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowPassword((visible) => !visible)}
                        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition-colors hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-400"
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                        aria-pressed={showPassword}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="h-12 w-full bg-emerald-500 font-semibold text-slate-950 shadow-lg shadow-emerald-950/30 transition-all hover:-translate-y-0.5 hover:bg-emerald-400 hover:shadow-emerald-500/20 disabled:hover:translate-y-0"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? "Entrando..." : "Entrar no painel"}
              </Button>
            </form>
          </Form>
          </CardContent>
        </Card>

        <p className="login-footer mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-emerald-400/70" aria-hidden="true" />
          Acesso protegido e restrito a usuários autorizados
        </p>
      </div>
    </main>
  );
}
