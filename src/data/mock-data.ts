// ========== TYPES — baseados no projeto Pode Mais Clone / Vendizap ==========

export interface CategoryImage {
  id: string;
  title: string;
  image?: string;
  produtosAtivos: number;
  ordem: number;
  status: boolean;
}

export interface ProductVariationOption {
  id: string;
  label: string;
  preco: number;
  available: boolean;
  quantidade: number;
}

export interface ProductVariation {
  id: string;
  nome: string;
  obrigatoria: boolean;
  multipla_selecao: boolean;
  adicional: boolean;
  options: ProductVariationOption[];
}

export interface ProductPromotion {
  existe: boolean;
  percentual?: number;
  precoPromocional?: number;
  dataHoraInicio?: string;
  dataHoraFim?: string;
}

export interface Product {
  id: string;
  descricao: string;
  preco: number;
  categorias: string[]; // category IDs
  categorias_nomes: string[]; // category names for display
  exibir: boolean;
  destaque: boolean;
  detalhes: string;
  imagens: string[];
  videoYoutube: string;
  unidadeVenda: string;
  codigo: string;
  promocao: ProductPromotion | null;
  variacoes: ProductVariation[];
}

export interface OrderItem {
  nome: string;
  qtd: number;
  preco: number;
  variacao?: string;
}

export interface Order {
  id: string;
  cliente: string;
  telefone: string;
  endereco: string;
  produtos: OrderItem[];
  subtotal: number;
  taxaEntrega: number;
  total: number;
  pagamento: "pix" | "debito" | "credito" | "dinheiro";
  status: "pendente" | "preparo" | "entrega" | "finalizado" | "cancelado";
  data: string;
}

export interface Coupon {
  id: string;
  codigo: string;
  tipo: "percentual" | "fixo";
  valor: number;
  status: boolean;
}

export interface DeliveryRange {
  id: string;
  distancia: number;
  valor: number;
}

export interface Installment {
  id: string;
  parcelas: number;
  juros: number;
}

export interface CashEntry {
  id: string;
  tipo: "entrada" | "saida";
  descricao: string;
  valor: number;
  data: string;
}

export interface BusinessHour {
  dia: string;
  ativo: boolean;
  abertura: string;
  fechamento: string;
}

export interface Settings {
  logo: string;
  banner: string;
  whatsapp: string;
  instagram: string;
  endereco: string;
  ocultarEndereco: boolean;
  lojaAberta: boolean;
  lojaSuspensa: boolean;
  horarios: BusinessHour[];
  pixKey: string;
  enderecoOrigem: string;
}

// ========== MOCK DATA — baseados em dados reais do Pode Mais ==========

export const mockCategories: CategoryImage[] = [
  { id: "cat1", title: "Pods Descartáveis", image: "https://images.unsplash.com/photo-1560913210-7d891e89ae67?w=200&h=200&fit=crop", produtosAtivos: 18, ordem: 1, status: true },
  { id: "cat2", title: "Pods Recarregáveis", image: "https://images.unsplash.com/photo-1567922045116-2a00fae2ed03?w=200&h=200&fit=crop", produtosAtivos: 12, ordem: 2, status: true },
  { id: "cat3", title: "Essências", image: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=200&h=200&fit=crop", produtosAtivos: 24, ordem: 3, status: true },
  { id: "cat4", title: "Acessórios", image: "https://images.unsplash.com/photo-1586953208270-767889fa9b0e?w=200&h=200&fit=crop", produtosAtivos: 8, ordem: 4, status: true },
  { id: "cat5", title: "Combos", image: "", produtosAtivos: 5, ordem: 5, status: false },
];

export const mockProducts: Product[] = [
  {
    id: "prod1", descricao: "Ignite V80 10000 Puffs", preco: 89.90, categorias: ["cat1"], categorias_nomes: ["Pods Descartáveis"],
    exibir: true, destaque: true, detalhes: "Pod descartável Ignite V80 com 10000 puffs. Bateria recarregável via USB-C.", imagens: ["https://images.unsplash.com/photo-1560913210-7d891e89ae67?w=400"], videoYoutube: "",
    unidadeVenda: "Unidade", codigo: "IGN-V80", promocao: { existe: true, percentual: 15, precoPromocional: 76.41 },
    variacoes: [{ id: "var1", nome: "Sabor", obrigatoria: true, multipla_selecao: false, adicional: false, options: [
      { id: "o1", label: "Grape Ice", preco: 0, available: true, quantidade: 15 },
      { id: "o2", label: "Watermelon Ice", preco: 0, available: true, quantidade: 8 },
      { id: "o3", label: "Mango Ice", preco: 0, available: false, quantidade: 0 },
      { id: "o4", label: "Blueberry Mint", preco: 0, available: true, quantidade: 5 },
    ]}],
  },
  {
    id: "prod2", descricao: "Oxbar G8000 Puffs", preco: 69.90, categorias: ["cat1"], categorias_nomes: ["Pods Descartáveis"],
    exibir: true, destaque: false, detalhes: "Pod descartável Oxbar com 8000 puffs e mesh coil para melhor sabor.", imagens: [], videoYoutube: "",
    unidadeVenda: "Unidade", codigo: "OXB-G8K", promocao: null,
    variacoes: [{ id: "var2", nome: "Sabor", obrigatoria: true, multipla_selecao: false, adicional: false, options: [
      { id: "o5", label: "Strawberry Banana", preco: 0, available: true, quantidade: 20 },
      { id: "o6", label: "Peach Ice", preco: 0, available: true, quantidade: 12 },
    ]}],
  },
  {
    id: "prod3", descricao: "SMOK Nord 5 Kit", preco: 189.90, categorias: ["cat2"], categorias_nomes: ["Pods Recarregáveis"],
    exibir: true, destaque: true, detalhes: "Kit completo SMOK Nord 5 com bateria 2000mAh e cartucho 5ml.", imagens: [], videoYoutube: "https://youtube.com/watch?v=example",
    unidadeVenda: "Unidade", codigo: "SMK-N5", promocao: null,
    variacoes: [{ id: "var3", nome: "Cor", obrigatoria: true, multipla_selecao: false, adicional: false, options: [
      { id: "o7", label: "Preto", preco: 0, available: true, quantidade: 7 },
      { id: "o8", label: "Prata", preco: 0, available: true, quantidade: 3 },
    ]}],
  },
  {
    id: "prod4", descricao: "Essência Naked 100 - Really Berry 60ml", preco: 49.90, categorias: ["cat3"], categorias_nomes: ["Essências"],
    exibir: true, destaque: false, detalhes: "Essência premium Naked 100. Sabor frutas vermelhas com blueberry.", imagens: [], videoYoutube: "",
    unidadeVenda: "Unidade", codigo: "NK-RB60", promocao: { existe: true, percentual: 10, precoPromocional: 44.91 },
    variacoes: [{ id: "var4", nome: "Nicotina", obrigatoria: true, multipla_selecao: false, adicional: false, options: [
      { id: "o9", label: "3mg", preco: 0, available: true, quantidade: 25 },
      { id: "o10", label: "6mg", preco: 0, available: true, quantidade: 18 },
      { id: "o11", label: "12mg", preco: 5, available: true, quantidade: 10 },
    ]}],
  },
  {
    id: "prod5", descricao: "Carregador USB-C Magnético", preco: 29.90, categorias: ["cat4"], categorias_nomes: ["Acessórios"],
    exibir: true, destaque: false, detalhes: "Carregador USB-C magnético compatível com diversos pods.", imagens: [], videoYoutube: "",
    unidadeVenda: "Unidade", codigo: "ACC-USBC", promocao: null, variacoes: [],
  },
  {
    id: "prod6", descricao: "Combo Pod + Essência", preco: 119.90, categorias: ["cat5"], categorias_nomes: ["Combos"],
    exibir: false, destaque: false, detalhes: "Combo especial: 1 pod descartável + 1 essência 30ml", imagens: [], videoYoutube: "",
    unidadeVenda: "Unidade", codigo: "CMB-01", promocao: null, variacoes: [],
  },
];

export const mockOrders: Order[] = [
  {
    id: "PED-1001", cliente: "João Silva", telefone: "(67) 99999-1234", endereco: "Rua 14 de Julho, 2345 - Centro, Campo Grande - MS",
    produtos: [
      { nome: "Ignite V80 10000 Puffs", qtd: 2, preco: 76.41, variacao: "Grape Ice" },
      { nome: "Carregador USB-C Magnético", qtd: 1, preco: 29.90 },
    ],
    subtotal: 182.72, taxaEntrega: 8.0, total: 190.72, pagamento: "pix", status: "pendente", data: "2026-03-25 14:30",
  },
  {
    id: "PED-1002", cliente: "Maria Santos", telefone: "(67) 99888-5678", endereco: "Av. Afonso Pena, 1234 - Centro, Campo Grande - MS",
    produtos: [{ nome: "Essência Naked 100 - Really Berry 60ml", qtd: 1, preco: 44.91, variacao: "3mg" }],
    subtotal: 44.91, taxaEntrega: 5.0, total: 49.91, pagamento: "credito", status: "preparo", data: "2026-03-25 14:15",
  },
  {
    id: "PED-1003", cliente: "Carlos Oliveira", telefone: "(67) 99777-9012", endereco: "Rua Barão do Rio Branco, 567 - Centro, Campo Grande - MS",
    produtos: [
      { nome: "SMOK Nord 5 Kit", qtd: 1, preco: 189.90, variacao: "Preto" },
      { nome: "Oxbar G8000 Puffs", qtd: 2, preco: 69.90, variacao: "Strawberry Banana" },
    ],
    subtotal: 329.70, taxaEntrega: 12.0, total: 341.70, pagamento: "dinheiro", status: "entrega", data: "2026-03-25 13:45",
  },
  {
    id: "PED-1004", cliente: "Ana Lima", telefone: "(67) 99666-3456", endereco: "Rua José Antônio, 890 - Jardim dos Estados, Campo Grande - MS",
    produtos: [{ nome: "Ignite V80 10000 Puffs", qtd: 1, preco: 76.41, variacao: "Watermelon Ice" }],
    subtotal: 76.41, taxaEntrega: 8.0, total: 84.41, pagamento: "pix", status: "finalizado", data: "2026-03-25 12:00",
  },
  {
    id: "PED-1005", cliente: "Pedro Costa", telefone: "(67) 99555-7890", endereco: "Av. Mato Grosso, 456 - Centro, Campo Grande - MS",
    produtos: [{ nome: "Oxbar G8000 Puffs", qtd: 1, preco: 69.90, variacao: "Peach Ice" }, { nome: "Carregador USB-C Magnético", qtd: 2, preco: 29.90 }],
    subtotal: 129.70, taxaEntrega: 5.0, total: 134.70, pagamento: "debito", status: "cancelado", data: "2026-03-25 11:30",
  },
];

export const mockCoupons: Coupon[] = [
  { id: "1", codigo: "PROMO10", tipo: "percentual", valor: 10, status: true },
  { id: "2", codigo: "FRETE5", tipo: "fixo", valor: 5, status: true },
  { id: "3", codigo: "WELCOME20", tipo: "percentual", valor: 20, status: false },
];

export const mockDeliveryRanges: DeliveryRange[] = [
  { id: "1", distancia: 3, valor: 5.0 },
  { id: "2", distancia: 6, valor: 8.0 },
  { id: "3", distancia: 10, valor: 12.0 },
  { id: "4", distancia: 15, valor: 18.0 },
];

export const mockInstallments: Installment[] = [
  { id: "1", parcelas: 1, juros: 0 },
  { id: "2", parcelas: 2, juros: 0 },
  { id: "3", parcelas: 3, juros: 2.5 },
  { id: "4", parcelas: 6, juros: 4.9 },
  { id: "5", parcelas: 12, juros: 9.9 },
];

export const mockCashEntries: CashEntry[] = [
  { id: "1", tipo: "entrada", descricao: "Pedido #PED-1001", valor: 190.72, data: "2026-03-25 14:30" },
  { id: "2", tipo: "entrada", descricao: "Pedido #PED-1004", valor: 84.41, data: "2026-03-25 12:00" },
  { id: "3", tipo: "saida", descricao: "Pagamento fornecedor", valor: 350.0, data: "2026-03-25 11:00" },
  { id: "4", tipo: "entrada", descricao: "Pedido #PED-1002", valor: 49.91, data: "2026-03-25 14:15" },
];

export const mockSettings: Settings = {
  logo: "",
  banner: "",
  whatsapp: "(67) 99999-9999",
  instagram: "@podemais.cg",
  endereco: "Campo Grande - MS",
  ocultarEndereco: false,
  lojaAberta: true,
  lojaSuspensa: false,
  horarios: [
    { dia: "Segunda", ativo: false, abertura: "08:00", fechamento: "20:00" },
    { dia: "Terça", ativo: false, abertura: "08:00", fechamento: "20:00" },
    { dia: "Quarta", ativo: false, abertura: "08:00", fechamento: "20:00" },
    { dia: "Quinta", ativo: false, abertura: "08:00", fechamento: "20:00" },
    { dia: "Sexta", ativo: true, abertura: "08:00", fechamento: "20:00" },
    { dia: "Sábado", ativo: false, abertura: "10:00", fechamento: "18:00" },
    { dia: "Domingo", ativo: false, abertura: "10:00", fechamento: "16:00" },
  ],
  pixKey: "podemais@email.com",
  enderecoOrigem: "Campo Grande - MS",
};

// ========== DASHBOARD STATS ==========
export const dashboardStats = {
  totalVendas: 801.44,
  pedidosDia: 5,
  pedidosMes: 142,
  ticketMedio: 160.29,
  chartData: [
    { name: "Seg", vendas: 450 },
    { name: "Ter", vendas: 680 },
    { name: "Qua", vendas: 520 },
    { name: "Qui", vendas: 890 },
    { name: "Sex", vendas: 1450 },
    { name: "Sáb", vendas: 320 },
    { name: "Dom", vendas: 0 },
  ],
};
