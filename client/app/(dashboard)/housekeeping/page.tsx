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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Sparkles, ClipboardList, CheckCircle2, Wrench, Eye, Search, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusColors: Record<HousekeepingTask["status"], { bg: string, text: string, border: string }> = {
  cleaning: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-500", border: "border-amber-500/20" },
  inspection: { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", border: "border-purple-500/20" },
  ready: { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/20" },
  maintenance: { bg: "bg-destructive/10", text: "text-destructive", border: "border-destructive/20" },
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
      <div className="space-y-8 p-2 md:p-6 max-w-7xl mx-auto animate-pulse">
        <div className="space-y-3">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-10 w-96 rounded-xl" />
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-3xl" />
          ))}
        </div>
        <Skeleton className="h-14 w-full max-w-md rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Alert variant="destructive" className="rounded-2xl border-destructive/30 bg-destructive/10">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="font-semibold">System Notice</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const counts = {
    cleaning: tasks.filter((t) => t.status === "cleaning").length,
    inspection: tasks.filter((t) => t.status === "inspection").length,
    ready: tasks.filter((t) => t.status === "ready").length,
    maintenance: tasks.filter((t) => t.status === "maintenance").length,
  };

  return (
    <div className="space-y-10 p-2 sm:p-4 md:p-6 max-w-7xl mx-auto">
      
      {/* ─── HERO HEADER ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-6">
        <div className="space-y-2">
          <Badge
            variant="outline"
            className="rounded-full px-3 py-1 font-medium text-xs bg-muted/60 text-muted-foreground border-border/60"
          >
            Property Maintenance
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Housekeeping
          </h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed md:text-right">
          Manage room cleaning workflows, inspections, and maintenance requests.
        </p>
      </div>

      {/* ─── SUMMARY CARDS ────────────────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-4">
        {[
          { label: "Cleaning", value: counts.cleaning, icon: Sparkles, color: "text-amber-600 dark:text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" },
          { label: "Inspection", value: counts.inspection, icon: Eye, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
          { label: "Ready", value: counts.ready, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-500/20" },
          { label: "Maintenance", value: counts.maintenance, icon: Wrench, color: "text-destructive", bg: "bg-destructive/10 border-destructive/20" },
        ].map((item) => (
          <div key={item.label} className={cn("relative flex flex-col justify-between rounded-3xl p-6 transition-all hover:shadow-lg border", item.bg)}>
            <div>
              <div className={cn("flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-4", item.color)}>
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </div>
              <div className="bg-background/80 backdrop-blur-md border border-border/60 rounded-2xl p-5 shadow-sm">
                <p className={cn("text-4xl font-extrabold tracking-tight", item.color)}>{item.value}</p>
                <p className="text-xs text-muted-foreground mt-1">Current Tasks</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── ACTION BAR ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by room or note..."
            className="pl-10 h-12 rounded-full bg-muted/40 border-border/50 focus-visible:ring-primary/20 shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value || "all")}>
            <SelectTrigger className="h-12 rounded-full bg-muted/40 border-border/50">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="cleaning">Cleaning</SelectItem>
              <SelectItem value="inspection">Inspection</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ─── TASKS TABLE ────────────────────────────────────────────── */}
      {filteredTasks.length === 0 ? (
        <Card className="rounded-3xl border border-border/50 bg-muted/20 shadow-sm flex flex-col items-center justify-center p-12 min-h-[300px]">
          <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center mb-4 text-muted-foreground">
            <Info className="h-6 w-6" />
          </div>
          <p className="text-lg font-medium text-foreground">No tasks found</p>
          <p className="text-sm text-muted-foreground mt-1">Adjust your filters or take a well-deserved break.</p>
        </Card>
      ) : (
        <Card className="rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden">
          <CardHeader className="border-b border-border/40 pb-4 bg-muted/10">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Active Assignments ({filteredTasks.length})
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Room</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Note</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Due</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Update Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => {
                  const style = statusColors[task.status] || { bg: "bg-muted", text: "text-muted-foreground", border: "border-border" };
                  
                  return (
                    <TableRow key={task.id} className="hover:bg-muted/20 transition-colors group">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">Room {task.roomId.slice(0, 8)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("capitalize px-2.5 py-0.5 border font-semibold", style.bg, style.text, style.border)}>
                          {task.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground text-sm">
                        {task.note || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {task.dueAt ? formatDateTime(task.dueAt) : "—"}
                      </TableCell>
                      <TableCell className="w-48">
                        <Select
                          value={task.status}
                          onValueChange={(value) =>
                            handleStatusChange(task, value as HousekeepingTask["status"])
                          }
                          disabled={updatingId === task.id}
                        >
                          <SelectTrigger className="h-9 rounded-lg bg-background border-border/60">
                            <SelectValue placeholder="Change" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="cleaning">Cleaning</SelectItem>
                            <SelectItem value="inspection">Inspection</SelectItem>
                            <SelectItem value="ready">Ready</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
