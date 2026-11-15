import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import CustomerDetailsPage from "./CustomerDetailsPage";
import { useCustomerDetails } from "@/hooks/useCustomers";

// Nada de API: hooks e drawer são mocks. O foco é COMO a tela do cliente abre o pedido.
vi.mock("react-router-dom", () => ({
  useParams: () => ({ id: "cust-1" }),
  useNavigate: () => vi.fn(),
}));
vi.mock("@/hooks/useCustomers", () => ({
  useCustomerDetails: vi.fn(),
  useUpdateCustomer: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useToggleBlockCustomer: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("@/components/ui/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));

const drawerProps = vi.fn();
vi.mock("@/components/OrderDetailDrawer", () => ({
  default: (props: Record<string, unknown>) => {
    drawerProps(props);
    return props.isOpen ? <div data-testid="drawer">pedido {String(props.orderId)}</div> : null;
  },
}));

const order = (id: string, orderNumber: number, paymentStatus: string, status = "CONFIRMED") => ({
  id,
  orderNumber,
  status,
  paymentStatus,
  totalOrder: 60,
  createdAt: new Date().toISOString(),
});

describe("CustomerDetailsPage: abrir pedido não pago a partir dos detalhes do cliente", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCustomerDetails).mockReturnValue({
      data: {
        id: "cust-1",
        name: "Maria",
        phone: "67999990000",
        isBlocked: false,
        createdAt: new Date().toISOString(),
        addresses: [],
        orders: [order("o-unpaid", 101, "PENDING"), order("o-paid", 102, "PAID", "COMPLETED")],
      },
      isLoading: false,
    } as never);
  });

  const openOrdersTab = () => fireEvent.mouseDown(screen.getByRole("tab", { name: /Histórico de Pedidos/ }), { button: 0 });

  it("lista os pedidos do cliente (não pago e pago)", () => {
    render(<CustomerDetailsPage />);
    openOrdersTab();
    expect(screen.getByText("Pedido #101")).toBeInTheDocument();
    expect(screen.getByText("Pedido #102")).toBeInTheDocument();
  });

  it("o drawer abre em leitura MAS com allowReceive: dá para receber (era readOnly puro)", () => {
    render(<CustomerDetailsPage />);
    openOrdersTab();

    fireEvent.click(screen.getByText("Pedido #101"));

    expect(screen.getByTestId("drawer")).toHaveTextContent("pedido o-unpaid");
    const last = drawerProps.mock.calls.at(-1)![0];
    expect(last).toMatchObject({ orderId: "o-unpaid", isOpen: true, readOnly: true, allowReceive: true });
  });

  it("fechar o drawer limpa o pedido selecionado", () => {
    render(<CustomerDetailsPage />);
    openOrdersTab();
    fireEvent.click(screen.getByText("Pedido #101"));
    expect(screen.getByTestId("drawer")).toBeInTheDocument();

    const open = drawerProps.mock.calls.at(-1)![0] as { onClose: () => void };
    act(() => open.onClose());

    expect(screen.queryByTestId("drawer")).not.toBeInTheDocument();
  });
});
