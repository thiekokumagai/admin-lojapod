import { fireEvent, render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { ProductDetailsForm, type ProductDetailsFormValues } from "./ProductDetailsForm";

vi.mock("@/components/ui/richtexteditor", () => ({ RichTextEditor: () => <div /> }));

let lastValues: ProductDetailsFormValues | null = null;

function Harness({ soldByWeight }: { soldByWeight: boolean }) {
  const form = useForm<ProductDetailsFormValues>({ defaultValues: { title: "", categoryId: "", tareWeightGrams: null } });
  lastValues = form.watch();
  return <ProductDetailsForm form={form} categories={[]} showServesCount soldByWeight={soldByWeight} />;
}

describe("ProductDetailsForm — vendido por peso", () => {
  it("preços viram por kg, aparece a tara e some o 'serve quantas pessoas'", () => {
    render(<Harness soldByWeight />);
    expect(screen.getByText("Preço (Venda) por kg")).toBeInTheDocument();
    expect(screen.getByText("Preço de Custo por kg")).toBeInTheDocument();
    expect(screen.queryByText(/Serve quantas pessoas/)).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Ex: 50"), { target: { value: "5a0" } });
    expect(lastValues?.tareWeightGrams).toBe(50);
  });

  it("produto comum continua igual", () => {
    render(<Harness soldByWeight={false} />);
    expect(screen.getByText("Preço (Venda)")).toBeInTheDocument();
    expect(screen.queryByText(/Tara do recipiente/)).not.toBeInTheDocument();
    expect(screen.getByText(/Serve quantas pessoas/)).toBeInTheDocument();
  });
});
