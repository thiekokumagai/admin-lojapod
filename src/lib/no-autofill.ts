/**
 * Props para campos de credencial de integração (InfinitePay, Mercado Pago...) que NÃO são login.
 *
 * `autoComplete="off"` não basta: o Chrome ignora "off" em campos de senha e preenche a senha
 * salva do painel, e ainda trata o campo de texto anterior como "usuário" (cola o e-mail).
 * "one-time-code" é respeitado: o navegador não oferece senha salva nem sugere senha forte.
 * Os data-* fazem 1Password, LastPass e Bitwarden ignorarem o campo.
 */
export const noAutofillProps = {
  autoComplete: "one-time-code",
  autoCorrect: "off",
  autoCapitalize: "off",
  spellCheck: false,
  "data-1p-ignore": "true",
  "data-lpignore": "true",
  "data-bwignore": "true",
  "data-form-type": "other",
} as const;
