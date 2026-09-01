"use client";

import { useEffect, useState } from "react";
import HousekeepingService, { HousekeepingTask } from "@/services/housekeeping.service";
import { formatDateTime } from "@/utils/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Sparkles, ClipboardList, CheckCircle2, Wrench, Eye, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusColors: Record<HousekeepingTask["status"], string> = {
  cleaning: "bg-amber-100 text-amber-700 border-amber-300",
  inspection: "bg-purple-100 text-purple-700 border-purple-300",
  ready: "bg-green-100 text-green-700 border-green-300",
  maintenance: "bg-red-100 text-red-700 border-red-300",
};

export default function HousekeepingPage() {
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await HousekeepingService().getHousekeepingTasks();
      setTasks(data);
    } catch (err) {
      console.error("Failed to fetch housekeeping tasks:", err);
      setError("Could not load housekeeping tasks. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleStatusChange = async (task: HousekeepingTask, newStatus: HousekeepingTask["status"]) => {
    setUpdatingId(task.id);
    try {
      await HousekeepingService().updateHousekeeping({
        roomId: task.roomId,
        status: newStatus,
        note: task.note || undefined,
      });
      toast.success(`Task status updated to ${newStatus}`);
      await fetchTasks();
    } catch (err) {
      console.error("Failed to update housekeeping task:", err);
      toast.error("Failed to update task status");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      task.roomId.toLowerCase().includes(q) ||
      (task.note || "").toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
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

  const counts = {
    cleaning: tasks.filter((t) => t.status === "cleaning").length,
    inspection: tasks.filter((t) => t.status === "inspection").length,
    ready: tasks.filter((t) => t.status === "ready").length,
    maintenance: tasks.filter((t) => t.status === "maintenance").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Housekeeping</h1>
        <p className="text-sm text-muted-foreground">
          Manage cleaning, inspection, and maintenance tasks.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Cleaning", value: counts.cleaning, icon: Sparkles, color: "text-amber-600" },
          { label: "Inspection", value: counts.inspection, icon: Eye, color: "text-purple-600" },
          { label: "Ready", value: counts.ready, icon: CheckCircle2, color: "text-green-600" },
          { label: "Maintenance", value: counts.maintenance, icon: Wrench, color: "text-red-600" },
        ].map((item) => (
          <Card key={item.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.label}
              </CardTitle>
              <item.icon className={cn("h-4 w-4", item.color)} />
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", item.color)}>{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by room or note..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-40">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="cleaning">Cleaning</SelectItem>
              <SelectItem value="inspection">Inspection</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tasks table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            All Tasks ({filteredTasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No housekeeping tasks found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Update Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">
                      Room {task.roomId.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[task.status]}>
                        {task.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {task.note || "—"}
                    </TableCell>
                    <TableCell>
                      {task.dueAt ? formatDateTime(task.dueAt) : "—"}
                    </TableCell>
                    <TableCell className="w-40">
                      <Select
                        value={task.status}
                        onValueChange={(value) =>
                          handleStatusChange(task, value as HousekeepingTask["status"])
                        }
                        disabled={updatingId === task.id}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Change" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cleaning">Cleaning</SelectItem>
                          <SelectItem value="inspection">Inspection</SelectItem>
                          <SelectItem value="ready">Ready</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
