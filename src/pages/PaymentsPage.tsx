import { useState } from "react";
import { mockInstallments, Installment } from "@/data/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, QrCode, CreditCard } from "lucide-react";

export default function PaymentsPage() {
  const [pixKey, setPixKey] = useState("meunegocio@email.com");
  const [installments, setInstallments] = useState<Installment[]>(mockInstallments);
  const [newParcelas, setNewParcelas] = useState("");
  const [newJuros, setNewJuros] = useState("");

  const handleAdd = () => {
    const p = Number(newParcelas);
    const j = Number(newJuros);
    if (!p) return;
    setInstallments((prev) => [...prev, { id: Date.now().toString(), parcelas: p, juros: j }]);
    setNewParcelas("");
    setNewJuros("");
  };

  const handleDelete = (id: string) => {
    setInstallments((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pagamentos</h1>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-primary" />
            <Label className="font-semibold text-base">PIX</Label>
          </div>
          <div>
            <Label>Chave PIX</Label>
            <Input value={pixKey} onChange={(e) => setPixKey(e.target.value)} placeholder="E-mail, CPF, CNPJ ou chave aleatória" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <Label className="font-semibold text-base">Cartão - Parcelas</Label>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parcelas</TableHead>
                <TableHead>Juros (%)</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {installments.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>{i.parcelas}x</TableCell>
                  <TableCell>{i.juros}%</TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(i.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell>
                  <Input type="number" placeholder="Nº" value={newParcelas} onChange={(e) => setNewParcelas(e.target.value)} className="w-20" />
                </TableCell>
                <TableCell>
                  <Input type="number" step="0.1" placeholder="%" value={newJuros} onChange={(e) => setNewJuros(e.target.value)} className="w-20" />
                </TableCell>
                <TableCell>
                  <Button size="icon" variant="ghost" onClick={handleAdd}><Plus className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
