import { useState } from "react";
import { mockDeliveryRanges, DeliveryRange } from "@/data/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, AlertTriangle, MapPin } from "lucide-react";

export default function DeliveriesPage() {
  const [ranges, setRanges] = useState<DeliveryRange[]>(mockDeliveryRanges);
  const [originAddress, setOriginAddress] = useState("Rua Exemplo, 123 - Centro");
  const [newDist, setNewDist] = useState("");
  const [newVal, setNewVal] = useState("");

  const handleAdd = () => {
    const dist = Number(newDist);
    const val = Number(newVal);
    if (!dist || !val || dist > 32) return;
    setRanges((prev) => [...prev, { id: Date.now().toString(), distancia: dist, valor: val }]);
    setNewDist("");
    setNewVal("");
  };

  const handleDelete = (id: string) => {
    setRanges((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Entregas</h1>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <Label className="font-semibold">Endereço de Origem</Label>
          </div>
          <Input value={originAddress} onChange={(e) => setOriginAddress(e.target.value)} placeholder="Endereço de saída das entregas" />
        </CardContent>
      </Card>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Limite máximo de distância: <strong>32 km</strong></AlertDescription>
      </Alert>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Distância (km)</TableHead>
                <TableHead>Valor (R$)</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranges.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>Até {r.distancia} km</TableCell>
                  <TableCell>R$ {r.valor.toFixed(2)}</TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(r.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell>
                  <Input type="number" placeholder="km" value={newDist} onChange={(e) => setNewDist(e.target.value)} className="w-24" />
                </TableCell>
                <TableCell>
                  <Input type="number" step="0.01" placeholder="R$" value={newVal} onChange={(e) => setNewVal(e.target.value)} className="w-24" />
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
