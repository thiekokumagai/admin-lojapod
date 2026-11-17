import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SecretInput } from "@/components/ui/secret-input";
import { toast } from "sonner";
import { clearSession, updatePassword } from "@/services/auth.service";

export const MIN_PASSWORD_LENGTH = 8;
// O servidor usa bcrypt, que só considera os primeiros 72 caracteres
const MAX_PASSWORD_LENGTH = 72;

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      toast.error(`A nova senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }

    if (newPassword.length > MAX_PASSWORD_LENGTH) {
      toast.error(`A nova senha deve ter no máximo ${MAX_PASSWORD_LENGTH} caracteres.`);
      return;
    }

    if (newPassword === currentPassword) {
      toast.error("A nova senha deve ser diferente da senha atual.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("A nova senha e a confirmação não coincidem.");
      return;
    }

    try {
      setIsLoading(true);
      await updatePassword({ currentPassword, newPassword, confirmPassword });
      handleClose();
      // O servidor encerrou as sessões abertas: entra de novo com a senha nova
      queryClient.clear();
      clearSession();
      toast.success("Senha alterada! Entre novamente com a nova senha.");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "Não foi possível alterar a senha. Verifique sua senha atual.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleClose();
      else onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              Insira sua senha atual e a nova senha desejada. Por segurança, você entrará de novo depois da troca.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="current-password">Senha Atual</Label>
              <SecretInput
                id="current-password"
                toggleName="senha atual"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <SecretInput
                id="new-password"
                toggleName="nova senha"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={MIN_PASSWORD_LENGTH}
                maxLength={MAX_PASSWORD_LENGTH}
                required
              />
              <p className="text-xs text-muted-foreground">Mínimo de {MIN_PASSWORD_LENGTH} caracteres.</p>
              {newPassword.length > 0 && newPassword.length < MIN_PASSWORD_LENGTH && (
                <p className="text-sm font-medium text-destructive">
                  A nova senha precisa de pelo menos {MIN_PASSWORD_LENGTH} caracteres.
                </p>
              )}
              {newPassword.length > 0 && newPassword === currentPassword && (
                <p className="text-sm font-medium text-destructive">
                  A nova senha deve ser diferente da atual.
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <SecretInput
                id="confirm-password"
                toggleName="confirmação da nova senha"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                maxLength={MAX_PASSWORD_LENGTH}
                required
              />
              {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                <p className="text-sm font-medium text-destructive">
                  As senhas não coincidem.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
