"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  CalendarDays,
  PlusCircle,
  Search,
  Copy,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface FacultyEvent {
  id: string;
  title: string;
  type: "HOSTED" | "ATTENDED" | "BUSY";
  startAt: string;
  endAt: string;
  allDay: boolean;
  location?: string | null;
  department?: string | null;
  organizer?: string | null;
}

export default function EventsListPage() {
  const [events, setEvents] = useState<FacultyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 15;

  const [notification, setNotification] = useState<{
    type: "success" | "warning" | "error";
    message: string;
  } | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", pageSize.toString());
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      if (searchQuery.trim()) params.set("q", searchQuery.trim());

      const res = await fetch(`/api/events?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.items || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error("Failed to load events:", err);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, searchQuery]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/events/${id}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.warning) {
          setNotification({
            type: "warning",
            message: `Event duplicated! Warning: ${data.warning}`,
          });
        } else {
          setNotification({
            type: "success",
            message: "Event duplicated successfully (+7 days forward).",
          });
        }
        fetchEvents();
      } else {
        setNotification({
          type: "error",
          message: data.error?.message || "Failed to duplicate event.",
        });
      }
    } catch {
      setNotification({
        type: "error",
        message: "Network error occurred while duplicating.",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotification({
          type: "success",
          message: "Event deleted successfully.",
        });
        fetchEvents();
      } else {
        setNotification({
          type: "error",
          message: "Failed to delete event.",
        });
      }
    } catch {
      setNotification({
        type: "error",
        message: "Network error while deleting event.",
      });
    }
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 rounded-lg p-4 text-white shadow-lg animate-in slide-in-from-top-4 max-w-md ${
            notification.type === "success"
              ? "bg-emerald-600"
              : notification.type === "warning"
              ? "bg-amber-600"
              : "bg-red-600"
          }`}
        >
          {notification.type === "success" && <CheckCircle2 className="h-5 w-5 shrink-0" />}
          {notification.type === "warning" && <AlertTriangle className="h-5 w-5 shrink-0" />}
          <p className="text-sm font-medium">{notification.message}</p>
          <button
            onClick={() => setNotification(null)}
            className="ml-auto text-white/80 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Events Management</h1>
          <p className="text-slate-500">
            Browse, search, duplicate, and manage all your academic records ({total} total)
          </p>
        </div>
        <Link href="/events/new">
          <Button className="gap-2 shadow-sm">
            <PlusCircle className="h-4 w-4" />
            <span>New Event</span>
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {["ALL", "HOSTED", "ATTENDED", "BUSY"].map((t) => (
              <Button
                key={t}
                variant={typeFilter === t ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setTypeFilter(t);
                  setPage(1);
                }}
              >
                {t}
              </Button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by title, location..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CalendarDays className="h-10 w-10 text-slate-400 mb-2" />
              <p className="font-semibold text-slate-700">No events found</p>
              <p className="text-sm text-slate-500 max-w-sm">
                Try adjusting your search query or type filters.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((ev) => {
                  const typeBadge =
                    ev.type === "HOSTED"
                      ? "bg-blue-100 text-blue-800 border-blue-200"
                      : ev.type === "ATTENDED"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                      : "bg-amber-100 text-amber-800 border-amber-200";

                  return (
                    <TableRow key={ev.id}>
                      <TableCell className="font-semibold text-slate-900">
                        {ev.title}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${typeBadge}`}
                        >
                          {ev.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-600 whitespace-nowrap">
                        {format(new Date(ev.startAt), "MMM d, yyyy h:mm a")}
                      </TableCell>
                      <TableCell className="text-slate-600">{ev.department || "—"}</TableCell>
                      <TableCell className="text-slate-600">{ev.location || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Duplicate event (+7 days)"
                            onClick={() => handleDuplicate(ev.id)}
                            className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Delete event"
                            onClick={() => handleDelete(ev.id)}
                            className="h-8 w-8 p-0 text-slate-600 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {/* Pagination Footer */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                Page {page} of {totalPages} ({total} events)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
