import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, ShieldCheck, Trash2, UserCog } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usersService, type StoreUser } from "@/services/users.service";
import { SCREEN_PERMISSIONS, SCREEN_PERMISSION_GROUPS } from "@/lib/permissions";

type FormState = {
  name: string;
  email: string;
  password: string;
  permissions: string[];
};

const emptyForm: FormState = { name: "", email: "", password: "", permissions: [] };

const permissionLabel = (key: string) => SCREEN_PERMISSIONS.find((p) => p.key === key)?.label ?? key;

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StoreUser | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [toDelete, setToDelete] = useState<StoreUser | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["store-users"],
    queryFn: usersService.list,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        return usersService.update(editing.id, {
          name: form.name,
          email: form.email,
          permissions: form.permissions,
          ...(form.password ? { password: form.password } : {}),
        });
      }
      return usersService.create({ ...form });
    },
    onSuccess: () => {
      toast.success(editing ? "Usuário atualizado" : "Usuário criado");
      queryClient.invalidateQueries({ queryKey: ["store-users"] });
      setDialogOpen(false);
    },
    onError: (error: Error) => toast.error(error.message || "Erro ao salvar usuário"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersService.remove(id),
    onSuccess: () => {
      toast.success("Usuário removido");
      queryClient.invalidateQueries({ queryKey: ["store-users"] });
      setToDelete(null);
    },
    onError: (error: Error) => toast.error(error.message || "Erro ao remover usuário"),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (user: StoreUser) => {
    setEditing(user);
    setForm({ name: user.name, email: user.email, password: "", permissions: user.permissions ?? [] });
    setDialogOpen(true);
  };

  const togglePermission = (key: string, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      permissions: checked
        ? Array.from(new Set([...prev.permissions, key]))
        : prev.permissions.filter((p) => p !== key),
    }));
  };

  const toggleGroup = (keys: string[], checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      permissions: checked
        ? Array.from(new Set([...prev.permissions, ...keys]))
        : prev.permissions.filter((p) => !keys.includes(p)),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Preencha nome e e-mail");
      return;
    }
    if (!editing && form.password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }
    if (editing && form.password && form.password.length < 6) {
      toast.error("A nova senha deve ter no mínimo 6 caracteres");
      return;
    }
    saveMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Usuários</h1>
          <p className="text-sm font-medium text-slate-500">
            Crie acessos para sua equipe e escolha quais telas do painel cada pessoa pode usar.
          </p>
        </div>
        <Button onClick={openCreate} className="bg-indigo-600 font-bold hover:bg-indigo-700">
          <Plus className="mr-2 h-4 w-4" /> Novo usuário
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => {
            const isAdmin = user.role !== "USER";
            return (
              <Card key={user.id}>
                <CardContent className="p-6">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-bold text-slate-800">{user.name}</h3>
                      <p className="truncate text-sm text-slate-500">{user.email}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded px-2 py-1 text-[10px] font-bold uppercase ${
                        isAdmin ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {isAdmin ? "Administrador" : "Funcionário"}
                    </span>
                  </div>

                  {isAdmin ? (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" /> Acesso total à loja
                    </p>
                  ) : user.permissions.length === 0 ? (
                    <p className="text-xs font-medium text-amber-600">Nenhuma tela liberada</p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {user.permissions.map((key) => (
                        <span key={key} className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          {permissionLabel(key)}
                        </span>
                      ))}
                    </div>
                  )}

                  {!isAdmin && (
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" className="h-9 flex-1 text-xs font-bold" onClick={() => openEdit(user)}>
                        <Pencil className="mr-1.5 h-3.5 w-3.5" /> Editar
                      </Button>
                      <Button
                        variant="outline"
                        className="h-9 px-3 text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => setToDelete(user)}
                        title="Remover usuário"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {users.filter((u) => u.role === "USER").length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <UserCog className="mx-auto mb-2 h-6 w-6 text-slate-400" />
              <p className="font-medium text-slate-500">Nenhum funcionário cadastrado ainda.</p>
            </div>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar usuário" : "Novo usuário"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="user-name">Nome</Label>
                <Input
                  id="user-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex.: Maria"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="user-email">E-mail de acesso</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="maria@email.com"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="user-password">{editing ? "Nova senha (opcional)" : "Senha"}</Label>
                <Input
                  id="user-password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editing ? "Deixe em branco para manter a atual" : "Mínimo 6 caracteres"}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Telas liberadas</h3>
                <p className="text-xs text-slate-500">
                  O usuário só verá no menu, e só conseguirá usar, as telas marcadas abaixo.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {SCREEN_PERMISSION_GROUPS.map(({ group, items }) => {
                  const keys = items.map((i) => i.key as string);
                  const allChecked = keys.every((k) => form.permissions.includes(k));
                  return (
                    <div key={group} className="rounded-lg border border-slate-200 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{group}</span>
                        <button
                          type="button"
                          className="text-[11px] font-semibold text-indigo-600 hover:underline"
                          onClick={() => toggleGroup(keys, !allChecked)}
                        >
                          {allChecked ? "Desmarcar todas" : "Marcar todas"}
                        </button>
                      </div>
                      <div className="space-y-2">
                        {items.map((item) => (
                          <label key={item.key} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                            <Checkbox
                              checked={form.permissions.includes(item.key)}
                              onCheckedChange={(checked) => togglePermission(item.key, checked === true)}
                            />
                            {item.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400">
                Assinatura e gestão de usuários são sempre exclusivas do administrador.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending} className="bg-indigo-600 font-bold hover:bg-indigo-700">
                {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Salvar alterações" : "Criar usuário"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {toDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              O acesso deste usuário ao painel será encerrado. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={(e) => {
                e.preventDefault();
                if (toDelete) deleteMutation.mutate(toDelete.id);
              }}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
