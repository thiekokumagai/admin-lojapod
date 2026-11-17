import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { SecretInput } from "./secret-input";

function Harness({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <SecretInput aria-label="Token" toggleName="token" value={value} onChange={(e) => setValue(e.target.value)} />
  );
}

describe("SecretInput", () => {
  it("começa oculto e o olho alterna entre password e text sem perder o que foi digitado", () => {
    render(<Harness />);
    const input = screen.getByLabelText("Token") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "APP_USR-segredo" } });
    expect(input.type).toBe("password");

    fireEvent.click(screen.getByRole("button", { name: "Mostrar token" }));
    expect(input.type).toBe("text");
    expect(input.value).toBe("APP_USR-segredo");
    expect(screen.getByRole("button", { name: "Ocultar token" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "Ocultar token" }));
    expect(input.type).toBe("password");
    expect(input.value).toBe("APP_USR-segredo");
  });

  it("o olho não envia formulário (type=button) e o campo não oferece autocompletar", () => {
    render(<Harness />);
    expect(screen.getByRole("button", { name: /Mostrar/ })).toHaveAttribute("type", "button");
    expect(screen.getByLabelText("Token")).toHaveAttribute("autocomplete", "off");
  });

  it("campo vazio continua vazio ao mostrar: o olho não revela nada que o usuário não digitou", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: /Mostrar/ }));
    expect((screen.getByLabelText("Token") as HTMLInputElement).value).toBe("");
  });
});
