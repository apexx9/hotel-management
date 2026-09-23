"use client";

import { useEffect, useState } from "react";
import ServicesService, { Service } from "@/services/services.service";
import StaysService from "@/services/stays.service";
import { formatCurrency, formatDateTime } from "@/utils/utils";
import type { DashboardStaySummary } from "@/actions/operations";
import { useCurrency } from "@/utils/currency";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";

interface ServiceChargeRow {
  id: string;
  stayId?: string | null;
  serviceName?: string | null;
  serviceId?: string;
  quantity?: number;
  amount?: number;
  price?: number;
  createdAt?: string | Date;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [serviceCharges, setServiceCharges] = useState<ServiceChargeRow[]>([]);
  const [stays, setStays] = useState<DashboardStaySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [chargeDialogOpen, setChargeDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [savingService, setSavingService] = useState(false);
  const [addingCharge, setAddingCharge] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const currency = useCurrency();

  // Service form
  const [serviceForm, setServiceForm] = useState({
    name: "",
    category: "",
    price: 0,
    description: "",
    isActive: true,
  });

  // Charge form
  const [chargeForm, setChargeForm] = useState({
    stayId: "",
    serviceId: "",
    quantity: 1,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [servicesData, chargesData] = await Promise.all([
        ServicesService().getServices(),
        ServicesService().getServiceCharges(),
      ]);
      setServices(servicesData);
      setServiceCharges(chargesData);
    } catch (err) {
      console.error("Failed to fetch services data:", err);
      setError("Could not load services. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStays = async () => {
    try {
      const staysData = await StaysService().getActiveStays();
      setStays(staysData);
    } catch (err) {
      console.error("Failed to fetch stays:", err);
      toast.error("Could not load stays for service charge");
    }
  };

  useEffect(() => {
    let active = true;
    const init = async () => {
      if (!active) return;
      fetchData();
    };
    init();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const init = async () => {
      if (!active || !chargeDialogOpen) return;
      fetchStays();
    };
    init();
    return () => {
      active = false;
    };
  }, [chargeDialogOpen]);

  const openCreateService = () => {
    setEditingService(null);
    setServiceForm({
      name: "",
      category: "",
      price: 0,
      description: "",
      isActive: true,
    });
    setServiceDialogOpen(true);
  };

  const openEditService = (service: Service) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      category: service.category,
      price: Number(service.price),
      description: service.description || "",
      isActive: service.isActive,
    });
    setServiceDialogOpen(true);
  };

  const handleSaveService = async () => {
    setSavingService(true);
    try {
      if (editingService) {
        await ServicesService().updateService(editingService.id, {
          name: serviceForm.name,
          category: serviceForm.category,
          price: String(serviceForm.price),
          description: serviceForm.description || null,
          isActive: serviceForm.isActive ?? true,
        });
        toast.success("Service updated");
      } else {
        await ServicesService().createService({
          name: serviceForm.name,
          category: serviceForm.category,
          price: serviceForm.price,
          description: serviceForm.description || undefined,
          isActive: serviceForm.isActive,
        });
        toast.success("Service created");
      }
      setServiceDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error("Failed to save service:", err);
      toast.error("Failed to save service");
    } finally {
      setSavingService(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    setDeletingId(id);
    try {
      await ServicesService().deleteService(id);
      toast.success("Service deleted");
      fetchData();
    } catch (err) {
      console.error("Failed to delete service:", err);
      toast.error("Failed to delete service");
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddCharge = async () => {
    setAddingCharge(true);
    try {
      await ServicesService().addServiceCharge({
        stayId: chargeForm.stayId,
        serviceId: chargeForm.serviceId,
        quantity: chargeForm.quantity,
      });
      toast.success("Service charge added");
      setChargeDialogOpen(false);
      setChargeForm({ stayId: "", serviceId: "", quantity: 1 });
      fetchData();
    } catch (err) {
      console.error("Failed to add service charge:", err);
      toast.error("Failed to add service charge");
    } finally {
      setAddingCharge(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-y-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Services</h1>
          <p className="text-sm text-muted-foreground">
            Manage hotel services and charges.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setChargeDialogOpen(true)} variant="outline">
            <ClipboardList className="mr-2 h-4 w-4" />
            Add Charge
          </Button>
          <Button onClick={openCreateService}>
            <Plus className="mr-2 h-4 w-4" />
            Add Service
          </Button>
        </div>
      </div>

      {/* Services table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Available Services ({services.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No services found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>{service.category}</TableCell>
                    <TableCell>{formatCurrency(service.price, currency)}</TableCell>
                    <TableCell>
                      <Badge variant={service.isActive ? "default" : "secondary"}>
                        {service.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditService(service)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteService(service.id)}
                          disabled={deletingId === service.id}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Service charges table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Service Charges ({serviceCharges.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {serviceCharges.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No service charges recorded.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stay</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceCharges.map((charge) => (
                  <TableRow key={charge.id}>
                    <TableCell>
                      {charge.stayId?.slice(0, 8)}...
                    </TableCell>
                    <TableCell>{charge.serviceName || charge.serviceId}</TableCell>
                    <TableCell>{charge.quantity}</TableCell>
                    <TableCell>{formatCurrency(charge.amount || charge.price, currency)}</TableCell>
                    <TableCell>{formatDateTime(charge.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Service create/edit dialog */}
      <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[88vh] flex flex-col overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-xl bg-white">
          <div className="shrink-0 bg-slate-50/80 px-6 pt-6 pb-4 border-b border-slate-100">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">
                {editingService ? "Edit Service" : "Add Service"}
              </DialogTitle>
              <DialogDescription className="mt-1 text-slate-500">
                {editingService
                  ? "Update the service details."
                  : "Enter details for the new service."}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
            <div className="space-y-6 p-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Name *</Label>
                <Input
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  required
                  className="h-10 rounded-lg bg-white border-slate-200 shadow-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Category *</Label>
                <Input
                  value={serviceForm.category}
                  onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                  required
                  className="h-10 rounded-lg bg-white border-slate-200 shadow-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Price *</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={serviceForm.price}
                  onChange={(e) => setServiceForm({ ...serviceForm, price: Number(e.target.value) })}
                  required
                  className="h-10 rounded-lg bg-white border-slate-200 shadow-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Description</Label>
                <Input
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  className="h-10 rounded-lg bg-white border-slate-200 shadow-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={serviceForm.isActive}
                  onChange={(e) => setServiceForm({ ...serviceForm, isActive: e.target.checked })}
                  className="h-4 w-4 rounded accent-blue-600"
                />
                <Label htmlFor="isActive" className="text-sm font-medium text-slate-700">Active</Label>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-end gap-3 rounded-b-2xl border-t border-slate-100 bg-white p-5">
            <Button variant="outline" onClick={() => setServiceDialogOpen(false)} className="h-10 rounded-lg border-slate-200 hover:bg-slate-50">
              Cancel
            </Button>
            <Button onClick={handleSaveService} disabled={savingService} className="h-10 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-70 transition-colors">
              {savingService ? "Saving..." : editingService ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add service charge dialog */}
      <Dialog open={chargeDialogOpen} onOpenChange={setChargeDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[88vh] flex flex-col overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-xl bg-white">
          <div className="shrink-0 bg-slate-50/80 px-6 pt-6 pb-4 border-b border-slate-100">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">Add Service Charge</DialogTitle>
              <DialogDescription className="mt-1 text-slate-500">
                Attach a service to a stay.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
            <div className="space-y-6 p-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Stay *</Label>
                <Select
                  value={chargeForm.stayId}
                  onValueChange={(value) => setChargeForm({ ...chargeForm, stayId: value || "" })}
                >
                  <SelectTrigger className="h-10 rounded-lg bg-white border-slate-200 shadow-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600">
                    <SelectValue placeholder="Select stay" />
                  </SelectTrigger>
                  <SelectContent>
                    {stays.map((stay) => (
                      <SelectItem key={stay.id} value={stay.id}>
                        {stay.guestName || stay.reference} - Room {stay.roomNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Service *</Label>
                <Select
                  value={chargeForm.serviceId}
                  onValueChange={(value) => setChargeForm({ ...chargeForm, serviceId: value || "" })}
                >
                  <SelectTrigger className="h-10 rounded-lg bg-white border-slate-200 shadow-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600">
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services
                      .filter((s) => s.isActive)
                      .map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} - {formatCurrency(service.price, currency)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Quantity *</Label>
                <Input
                  type="number"
                  min={1}
                  value={chargeForm.quantity}
                  onChange={(e) => setChargeForm({ ...chargeForm, quantity: Number(e.target.value) })}
                  required
                  className="h-10 rounded-lg bg-white border-slate-200 shadow-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-end gap-3 rounded-b-2xl border-t border-slate-100 bg-white p-5">
            <Button variant="outline" onClick={() => setChargeDialogOpen(false)} className="h-10 rounded-lg border-slate-200 hover:bg-slate-50">
              Cancel
            </Button>
            <Button onClick={handleAddCharge} disabled={addingCharge} className="h-10 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-70 transition-colors">
              {addingCharge ? "Adding..." : "Add Charge"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
