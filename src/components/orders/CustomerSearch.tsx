import { useState, useEffect } from "react";
import { Search, Loader2, MapPin, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCustomers } from "@/hooks/useCustomers";
import { customersService, type Customer, type CustomerAddress } from "@/services/customers.service";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SimpleAddressForm } from "@/components/orders/SimpleAddressForm";
import { useToast } from "@/components/ui/use-toast";
import { formatPhone } from "@/utils/formatters";

interface CustomerSearchProps {
  onSelectCustomer: (customer: Customer | null) => void;
  onSelectAddress: (address: CustomerAddress | null) => void;
  initialCustomer?: Customer | null;
  initialAddressId?: string | null;
  mode?: "create" | "edit";
}

export function CustomerSearch({ onSelectCustomer, onSelectAddress, initialCustomer, initialAddressId, mode = "create" }: CustomerSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(initialCustomer?.id || null);
  const [selectedCustomerData, setSelectedCustomerData] = useState<Customer | null>(initialCustomer || null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(initialAddressId || null);
  const { toast } = useToast();
  
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  // States for inline editing customer data for this order
  const [isEditingCustomerData, setIsEditingCustomerData] = useState(false);
  const [tempCustomerName, setTempCustomerName] = useState("");
  const [tempCustomerPhone, setTempCustomerPhone] = useState("");
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);

  // States for inline editing address data for this order
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [tempAddress, setTempAddress] = useState<Partial<CustomerAddress>>({});
  const [isSavingAddress, setIsSavingAddress] = useState(false);


  useEffect(() => {
    if (initialCustomer) {
      setSelectedCustomerId(initialCustomer.id);
      setSelectedCustomerData(initialCustomer);
      setSearchTerm(initialCustomer.phone ? formatPhone(initialCustomer.phone) : initialCustomer.name);
      
      const defaultAddress = initialCustomer.addresses?.find(a => a.isDefault) || initialCustomer.addresses?.[0];
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      }
    }
  }, [initialCustomer]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading } = useCustomers(debouncedTerm ? debouncedTerm : undefined, 1, 5);
  const customers = data?.data || [];

  useEffect(() => {
    if (customers.length === 0 && debouncedTerm) {
      if (/^[\d\s\(\)\-]+$/.test(debouncedTerm)) {
        setNewCustomerPhone(formatPhone(debouncedTerm));
        setNewCustomerName("");
      } else {
        setNewCustomerName(debouncedTerm);
        setNewCustomerPhone("");
      }
    }
  }, [customers.length, debouncedTerm]);
  
  const selectedCustomer = selectedCustomerData;

  // Mask function for phone
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Se o valor contiver apenas números e pontuações comuns de telefone
    if (/^[\d\s\(\)\-]+$/.test(value)) {
      value = formatPhone(value);
    }
    
    setSearchTerm(value);
    // Reset selection when searching again
    if (selectedCustomerId) {
      setSelectedCustomerId(null);
      setSelectedCustomerData(null);
      setSelectedAddressId(null);
      onSelectCustomer(null);
      onSelectAddress(null);
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setSelectedCustomerData(customer);
    onSelectCustomer(customer);
    
    // Auto-select default address if available
    const defaultAddress = customer.addresses?.find(a => a.isDefault) || customer.addresses?.[0];
    if (defaultAddress) {
      setSelectedAddressId(defaultAddress.id);
      onSelectAddress(defaultAddress);
    } else {
      setSelectedAddressId(null);
      onSelectAddress(null);
    }
    
    setSearchTerm(customer.phone ? formatPhone(customer.phone) : customer.name);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Buscar cliente por telefone ou nome..." 
          className="pl-9 h-11"
          value={searchTerm}
          onChange={handleSearchChange}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          </div>
        )}
      </div>

      {!selectedCustomerId && debouncedTerm && customers.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {customers.map(customer => (
            <div 
              key={customer.id}
              className="flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
              onClick={() => handleSelectCustomer(customer)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-bold">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-slate-800">{customer.name}</div>
                  <div className="text-sm text-slate-500">{formatPhone(customer.phone)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!selectedCustomerId && debouncedTerm && !isLoading && customers.length === 0 && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
          <div className="text-sm text-slate-500 text-center mb-2">
            Nenhum cliente encontrado. Cadastre agora:
          </div>
          <Input 
            placeholder="Nome do cliente" 
            value={newCustomerName}
            onChange={(e) => setNewCustomerName(e.target.value)}
          />
          <Input 
            placeholder="Telefone do cliente ex: (99) 99999-9999" 
            value={newCustomerPhone}
            maxLength={15}
            onChange={(e) => setNewCustomerPhone(formatPhone(e.target.value))}
          />
          <Button 
            className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            disabled={!newCustomerName.trim() || !newCustomerPhone.trim() || isCreating}
            onClick={async () => {
              setIsCreating(true);
              try {
                let newCustomer: Customer;
                if (mode === "edit") {
                  try {
                    newCustomer = await customersService.createCustomer({
                      name: newCustomerName.trim(),
                      phone: newCustomerPhone.trim()
                    });
                  } catch {
                    newCustomer = {
                      id: "temp_" + Date.now().toString(),
                      name: newCustomerName.trim(),
                      phone: newCustomerPhone.trim(),
                      addresses: [],
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    } as Customer;
                  }
                } else {
                  newCustomer = {
                    id: "temp_" + Date.now().toString(),
                    name: newCustomerName.trim(),
                    phone: newCustomerPhone.trim(),
                    addresses: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  } as Customer;
                }
                handleSelectCustomer(newCustomer);
                setNewCustomerName("");
                setNewCustomerPhone("");
              } catch (e: any) {
                const msg = e?.message || "Erro ao cadastrar cliente.";
                toast({ title: msg, variant: "destructive" });
                console.error(e);
              } finally {
                setIsCreating(false);
              }
            }}
          >
            {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Selecionar para Pedido"}
          </Button>
        </div>
      )}

      {selectedCustomer && (
        <div className="mt-4 p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            {isEditingCustomerData ? (
              <div className="w-full space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Nome no Pedido</Label>
                    <Input 
                      value={tempCustomerName} 
                      onChange={(e) => setTempCustomerName(e.target.value)} 
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Telefone</Label>
                    <Input 
                      value={tempCustomerPhone} 
                      onChange={(e) => setTempCustomerPhone(formatPhone(e.target.value))} 
                      maxLength={15}
                      className="h-8"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" className="h-7" onClick={() => setIsEditingCustomerData(false)} disabled={isSavingCustomer}>Cancelar</Button>
                  <Button variant="default" size="sm" className="h-7" disabled={isSavingCustomer} onClick={async () => {
                    if (selectedCustomerData) {
                      setIsSavingCustomer(true);
                      const updatedName = tempCustomerName.trim();
                      const updatedPhone = tempCustomerPhone.trim();
                      const isTempCustomer = !selectedCustomerData.id || selectedCustomerData.id.startsWith("temp_");

                      let updated: Customer = {
                        ...selectedCustomerData,
                        name: updatedName,
                        phone: updatedPhone,
                      };

                      if (!isTempCustomer) {
                        try {
                          const serverUpdated = await customersService.updateCustomer(selectedCustomerData.id, { 
                            name: updatedName, 
                            phone: updatedPhone 
                          });
                          if (serverUpdated && serverUpdated.id) {
                            updated = serverUpdated;
                          }
                        } catch (error: any) {
                          const msg = error?.message || error?.response?.data?.message || "Erro ao atualizar cliente.";
                          toast({ title: msg, variant: "destructive" });
                          console.warn("Server update customer failed:", error);
                        }
                      }

                      setSelectedCustomerData(updated);
                      onSelectCustomer(updated);
                      setIsEditingCustomerData(false);
                      toast({ title: "Cliente atualizado com sucesso." });
                      setIsSavingCustomer(false);
                    }
                  }}>
                    {isSavingCustomer ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-lg">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{selectedCustomer.name}</div>
                    <div className="text-sm text-slate-500 flex items-center gap-1">
                      {formatPhone(selectedCustomer.phone)}
                    </div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setTempCustomerName(selectedCustomer.name);
                    setTempCustomerPhone(formatPhone(selectedCustomer.phone));
                    setIsEditingCustomerData(true);
                  }}
                >
                  Editar
                </Button>
              </>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Endereço de Entrega
              </h3>
              {!isAddingAddress && (
                <Button variant="outline" size="sm" className="h-8" onClick={() => setIsAddingAddress(true)}>
                  Nova Busca (Google)
                </Button>
              )}
            </div>
            
            {isAddingAddress && (
              <SimpleAddressForm 
                onCancel={() => setIsAddingAddress(false)}
                onSave={async (newAddr) => {
                  if (selectedCustomerData) {
                    const isTempCustomer = !selectedCustomerData.id || selectedCustomerData.id.startsWith("temp_");
                    let updatedCustomer: Customer = {
                      ...selectedCustomerData,
                      addresses: [...(selectedCustomerData.addresses || []), newAddr]
                    };

                    if (mode === "edit" && !isTempCustomer) {
                      try {
                        const serverUpdated = await customersService.addAddress(selectedCustomerData.id, {
                          street: newAddr.street,
                          number: newAddr.number,
                          neighborhood: newAddr.neighborhood,
                          city: newAddr.city,
                          state: newAddr.state,
                          cep: newAddr.cep,
                          complement: newAddr.complement
                        });
                        if (serverUpdated && serverUpdated.id) {
                          updatedCustomer = serverUpdated;
                          const matched = serverUpdated.addresses?.find(a => a.street === newAddr.street && a.number === newAddr.number);
                          if (matched) {
                            newAddr = matched;
                          }
                        }
                      } catch (err) {
                        console.warn("Could not add address to server, saving locally for order:", err);
                      }
                    }

                    setSelectedCustomerData(updatedCustomer);
                    onSelectCustomer(updatedCustomer);
                    setSelectedAddressId(newAddr.id);
                    onSelectAddress(newAddr);
                  } else {
                    setSelectedAddressId(newAddr.id);
                    onSelectAddress(newAddr);
                  }
                  setIsAddingAddress(false);
                }}
              />
            )}
            
            {!isAddingAddress && selectedCustomer.addresses && selectedCustomer.addresses.length > 0 ? (
              <RadioGroup 
                value={selectedAddressId || ""} 
                onValueChange={(val) => {
                  setSelectedAddressId(val);
                  const selected = selectedCustomer.addresses?.find(a => a.id === val) || null;
                  if (selectedCustomerData) {
                    const updatedAddresses = (selectedCustomerData.addresses || []).map(a => ({
                      ...a,
                      isDefault: a.id === val
                    }));
                    const updatedCustomer = { ...selectedCustomerData, addresses: updatedAddresses };
                    setSelectedCustomerData(updatedCustomer);
                    onSelectCustomer(updatedCustomer);
                  }
                  onSelectAddress(selected ? { ...selected, isDefault: true } : null);
                }}
                className="space-y-2"
              >
                {selectedCustomer.addresses.map((address) => (
                  <div key={address.id} className="flex items-start space-x-3 bg-white p-3 rounded-lg border border-slate-200 relative">
                    <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                    {editingAddressId === address.id ? (
                      <div className="flex-1 space-y-3 pr-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Rua</Label>
                            <Input value={tempAddress.street || ""} onChange={e => setTempAddress({...tempAddress, street: e.target.value})} className="h-8"/>
                          </div>
                          <div>
                            <Label className="text-xs">Número</Label>
                            <Input value={tempAddress.number || ""} onChange={e => setTempAddress({...tempAddress, number: e.target.value})} className="h-8"/>
                          </div>
                          <div>
                            <Label className="text-xs">Bairro</Label>
                            <Input value={tempAddress.neighborhood || ""} onChange={e => setTempAddress({...tempAddress, neighborhood: e.target.value})} className="h-8"/>
                          </div>
                          <div>
                            <Label className="text-xs">Complemento</Label>
                            <Input value={tempAddress.complement || ""} onChange={e => setTempAddress({...tempAddress, complement: e.target.value})} className="h-8"/>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" className="h-7" onClick={() => setEditingAddressId(null)} disabled={isSavingAddress}>Cancelar</Button>
                          <Button variant="default" size="sm" className="h-7" disabled={isSavingAddress} onClick={async () => {
                             if (selectedCustomerData) {
                               setIsSavingAddress(true);
                               const { street, number, neighborhood, city, state, cep, complement } = tempAddress;
                               const payload = { 
                                 street: street || "", 
                                 number: number || "", 
                                 neighborhood: neighborhood || "", 
                                 city: city || "Campo Grande", 
                                 state: state || "MS", 
                                 cep: cep || "00000-000", 
                                 complement: complement || "" 
                               };

                               const isTempCustomer = !selectedCustomerData.id || selectedCustomerData.id.startsWith("temp_");
                               const isTempAddress = !address.id || address.id.startsWith("temp_") || address.id === "endereco-pedido" || address.id.startsWith("addr_");

                               const updatedAddresses = (selectedCustomerData.addresses || []).map(a => 
                                 a.id === address.id ? { ...a, ...payload } as CustomerAddress : a
                               );

                               let updatedCustomer: Customer = {
                                 ...selectedCustomerData,
                                 addresses: updatedAddresses
                               };

                               if (!isTempCustomer && !isTempAddress) {
                                 try {
                                   const serverUpdated = await customersService.updateAddress(selectedCustomerData.id, address.id, payload);
                                   if (serverUpdated && serverUpdated.id) {
                                     updatedCustomer = serverUpdated;
                                   }
                                 } catch (error) {
                                   console.warn("Could not update address on server, saving locally for order:", error);
                                 }
                               } else if (!isTempCustomer && isTempAddress) {
                                 try {
                                   const serverUpdated = await customersService.addAddress(selectedCustomerData.id, payload);
                                   if (serverUpdated && serverUpdated.id) {
                                     updatedCustomer = serverUpdated;
                                   }
                                 } catch (error) {
                                   console.warn("Could not add address to server, saving locally for order:", error);
                                 }
                               }

                               setSelectedCustomerData(updatedCustomer);
                               onSelectCustomer(updatedCustomer);

                               const updatedAddrObj = updatedCustomer.addresses?.find(a => a.id === address.id || (a.street === payload.street && a.number === payload.number)) || ({
                                 id: address.id,
                                 ...payload,
                                 isDefault: false
                               } as CustomerAddress);

                               setSelectedAddressId(updatedAddrObj.id);
                               onSelectAddress(updatedAddrObj);
                               setEditingAddressId(null);
                               toast({ title: "Endereço atualizado com sucesso." });
                               setIsSavingAddress(false);
                             }
                          }}>
                            {isSavingAddress ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Label htmlFor={address.id} className="cursor-pointer flex-1">
                          <div className="font-medium text-slate-800">
                            {address.street}, {address.number}
                          </div>
                          <div className="text-sm text-slate-500">
                            {address.neighborhood} - {address.city}/{address.state}
                          </div>
                          <div className="text-sm text-slate-500">
                            CEP: {address.cep} {address.complement && ` | ${address.complement}`}
                          </div>
                        </Label>
                        {!editingAddressId && selectedAddressId === address.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-2 h-7 text-slate-500"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setTempAddress(address);
                              setEditingAddressId(address.id);
                            }}
                          >
                            Editar
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                Este cliente não possui endereços cadastrados.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
