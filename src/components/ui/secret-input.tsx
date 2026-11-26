import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SecretInputProps extends Omit<React.ComponentProps<"input">, "type"> {
  /** Nome do campo no botão do olho (leitor de tela e testes): "Mostrar <nome>". */
  toggleName?: string;
  /**
   * Credencial que NÃO é login (token, chave de API). O gerenciador de senhas do Chrome age em
   * qualquer `type="password"` (ignora autocomplete) e ainda cola o e-mail salvo no campo de
   * texto anterior. Com esta opção o campo é `type="text"` mascarado por CSS
   * (-webkit-text-security), então o navegador não vê formulário de login.
   * Navegador sem suporte ao CSS: volta para `type="password"` para não expor o segredo.
   */
  notLogin?: boolean;
}

const supportsTextMask = () =>
  typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("-webkit-text-security", "disc");

/**
 * Campo de segredo (senha, token, chave) com olho para mostrar/ocultar o que foi DIGITADO.
 * O olho só troca a máscara do campo; ele não busca nada no servidor, então não mostra segredo salvo.
 */
const SecretInput = React.forwardRef<HTMLInputElement, SecretInputProps>(
  ({ className, toggleName = "senha", notLogin = false, style, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);
    const Icon = visible ? EyeOff : Eye;
    const cssMask = notLogin && supportsTextMask();

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible || cssMask ? "text" : "password"}
          className={cn("pr-10", className)}
          style={style}
          // Regra em index.css: input[data-secret-mask="true"] { -webkit-text-security: disc }
          data-secret-mask={cssMask && !visible ? "true" : undefined}
          autoComplete="off"
          spellCheck={false}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={`${visible ? "Ocultar" : "Mostrar"} ${toggleName}`}
          aria-pressed={visible}
          tabIndex={0}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    );
  },
);
SecretInput.displayName = "SecretInput";

export { SecretInput };
