"use client";

import { useEffect, useState } from "react";
import ServicesService, { Service } from "@/services/services.service";
import StaysService from "@/services/stays.service";
import { formatCurrency, formatDateTime } from "@/utils/utils";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [serviceCharges, setServiceCharges] = useState<any[]>([]);
  const [stays, setStays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [chargeDialogOpen, setChargeDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [savingService, setSavingService] = useState(false);
  const [addingCharge, setAddingCharge] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    fetchData();
  }, []);

  useEffect(() => {
    if (chargeDialogOpen) {
      fetchStays();
    }
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
      <div className="flex items-center justify-between">
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
                    <TableCell>{formatCurrency(service.price)}</TableCell>
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
                {serviceCharges.map((charge: any) => (
                  <TableRow key={charge.id}>
                    <TableCell>
                      {charge.stayId?.slice(0, 8)}...
                    </TableCell>
                    <TableCell>{charge.serviceName || charge.serviceId}</TableCell>
                    <TableCell>{charge.quantity}</TableCell>
                    <TableCell>{formatCurrency(charge.amount || charge.price)}</TableCell>
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingService ? "Edit Service" : "Add Service"}
            </DialogTitle>
            <DialogDescription>
              {editingService
                ? "Update the service details."
                : "Enter details for the new service."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={serviceForm.name}
                onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Input
                value={serviceForm.category}
                onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Price *</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={serviceForm.price}
                onChange={(e) => setServiceForm({ ...serviceForm, price: Number(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={serviceForm.description}
                onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={serviceForm.isActive}
                onChange={(e) => setServiceForm({ ...serviceForm, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setServiceDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveService} disabled={savingService}>
              {savingService ? "Saving..." : editingService ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add service charge dialog */}
      <Dialog open={chargeDialogOpen} onOpenChange={setChargeDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Service Charge</DialogTitle>
            <DialogDescription>
              Attach a service to a stay.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Stay *</Label>
              <Select
                value={chargeForm.stayId}
                onValueChange={(value) => setChargeForm({ ...chargeForm, stayId: value || "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select stay" />
                </SelectTrigger>
                <SelectContent>
                  {stays.map((stay: any) => (
                    <SelectItem key={stay.id} value={stay.id}>
                      {stay.guestName || stay.reference} - Room {stay.roomNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Service *</Label>
              <Select
                value={chargeForm.serviceId}
                onValueChange={(value) => setChargeForm({ ...chargeForm, serviceId: value || "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {services
                    .filter((s) => s.isActive)
                    .map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - {formatCurrency(service.price)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantity *</Label>
              <Input
                type="number"
                min={1}
                value={chargeForm.quantity}
                onChange={(e) => setChargeForm({ ...chargeForm, quantity: Number(e.target.value) })}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChargeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCharge} disabled={addingCharge}>
              {addingCharge ? "Adding..." : "Add Charge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
