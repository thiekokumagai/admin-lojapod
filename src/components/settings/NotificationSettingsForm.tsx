import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Loader2 } from "lucide-react";
import { apiFetch } from "@/services/api";
import { toast } from "sonner";

export function NotificationSettingsForm() {
  const [isTesting, setIsTesting] = useState(false);

  const handleTestNotification = async () => {
    setIsTesting(true);
    try {
      await apiFetch("/users/test-push", { method: "POST" });
      toast.success("Notificação de teste enviada com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar notificação de teste.");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificações (PWA & Web)
        </CardTitle>
        <CardDescription>
          Envie uma notificação de teste para verificar se todos os seus dispositivos registrados estão recebendo os alertas corretamente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleTestNotification} disabled={isTesting}>
          {isTesting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Bell className="mr-2 h-4 w-4" />
          )}
          Disparar Notificação de Teste
        </Button>
      </CardContent>
    </Card>
  );
}
