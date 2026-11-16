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
  ChevronRight,
  Eye,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Tag,
  Filter,
} from "lucide-react";
import { EventDetailsDialog } from "@/components/events/event-details-dialog";
import { ACADEMIC_CATEGORIES } from "@/config/academic";
import { EventCategory } from "@prisma/client";

interface FacultyEvent {
  id: string;
  title: string;
  type: "HOSTED" | "ATTENDED" | "BUSY";
  category?: EventCategory | string | null;
  startAt: string;
  endAt: string;
  allDay: boolean;
  location?: string | null;
  department?: string | null;
  organizer?: string | null;
  role?: string | null;
  description?: string | null;
  attachmentUrl?: string | null;
  isVerified?: boolean | null;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
}

export default function EventsListPage() {
  const [events, setEvents] = useState<FacultyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<FacultyEvent | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [verificationFilter, setVerificationFilter] = useState<"ALL" | "VERIFIED" | "UNVERIFIED">("ALL");
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
      if (categoryFilter !== "ALL") params.set("category", categoryFilter);
      if (verificationFilter !== "ALL") params.set("verificationStatus", verificationFilter);
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
  }, [page, typeFilter, categoryFilter, verificationFilter, searchQuery]);

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

  const handleQuickVerify = async (ev: FacultyEvent, verify: boolean) => {
    try {
      const res = await fetch(`/api/events/${ev.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verify }),
      });

      const data = await res.json();
      if (res.ok) {
        setNotification({
          type: "success",
          message: verify
            ? `"${ev.title}" verified and approved! Record is now locked against edits.`
            : `Verification revoked for "${ev.title}".`,
        });
        fetchEvents();
      } else {
        setNotification({
          type: "error",
          message: data.error?.message || "Verification failed.",
        });
      }
    } catch {
      setNotification({
        type: "error",
        message: "Network error during verification.",
      });
    }
  };

  const handleDelete = async (ev: FacultyEvent) => {
    if (ev.isVerified) {
      setNotification({
        type: "error",
        message: "Verified events are locked under official policy and cannot be deleted.",
      });
      return;
    }

    if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/events/${ev.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setNotification({
          type: "success",
          message: "Event deleted successfully.",
        });
        fetchEvents();
      } else {
        const data = await res.json().catch(() => ({}));
        setNotification({
          type: "error",
          message: data.error?.message || "Failed to delete event.",
        });
      }
    } catch {
      setNotification({
        type: "error",
        message: "Network error occurred while deleting.",
      });
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 rounded-xl p-4 text-white shadow-xl animate-in slide-in-from-top-4 max-w-md ${
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
            className="ml-auto text-white/80 hover:text-white font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Academic Records & Events</h1>
          <p className="text-slate-500 text-sm mt-1">
            Browse conferences, seminars, workshops, and verified institutional activities ({total} total)
          </p>
        </div>
        <Link href="/events/new">
          <Button className="gap-2 shadow-sm bg-blue-600 hover:bg-blue-700 text-white font-medium">
            <PlusCircle className="h-4 w-4" />
            <span>Record New Activity</span>
          </Button>
        </Link>
      </div>

      {/* Verification Category Tabs & Quick Counters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">
            Verification Category:
          </span>
          <button
            onClick={() => {
              setVerificationFilter("ALL");
              setPage(1);
            }}
            className={`text-xs font-medium px-3.5 py-1.5 rounded-xl transition-all ${
              verificationFilter === "ALL"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All Categories
          </button>
          <button
            onClick={() => {
              setVerificationFilter("VERIFIED");
              setPage(1);
            }}
            className={`text-xs font-semibold px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              verificationFilter === "VERIFIED"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Verified & Approved (Locked)</span>
          </button>
          <button
            onClick={() => {
              setVerificationFilter("UNVERIFIED");
              setPage(1);
            }}
            className={`text-xs font-semibold px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              verificationFilter === "UNVERIFIED"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-amber-800 bg-amber-50 hover:bg-amber-100/70 border border-amber-200"
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Non-Verified (Pending)</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium px-2">
          Showing <strong>{events.length}</strong> of <strong>{total}</strong> records
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200 shadow-sm rounded-2xl">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Academic Category Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 pl-1 pr-1 shrink-0">
              <Filter className="h-3.5 w-3.5" /> Category:
            </span>
            <button
              onClick={() => {
                setCategoryFilter("ALL");
                setPage(1);
              }}
              className={`text-xs font-medium px-2.5 py-1 rounded-lg border shrink-0 transition-all ${
                categoryFilter === "ALL"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              All
            </button>
            {(["CONFERENCE", "SEMINAR", "WORKSHOP", "JOURNAL", "MEETING", "GUEST_LECTURE", "OTHER"] as EventCategory[]).map(
              (catKey) => {
                const isSelected = categoryFilter === catKey;
                const catLabel = ACADEMIC_CATEGORIES[catKey]?.label || catKey;
                return (
                  <button
                    key={catKey}
                    onClick={() => {
                      setCategoryFilter(catKey);
                      setPage(1);
                    }}
                    className={`text-xs font-medium px-2.5 py-1 rounded-lg border shrink-0 transition-all ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {catLabel}
                  </button>
                );
              }
            )}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search title, venue, role..."
              className="pl-9 h-9 text-xs"
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
      <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
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
                Try adjusting your search query, academic category, or verification filter.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="font-semibold text-slate-700">Activity Title & Role</TableHead>
                  <TableHead className="font-semibold text-slate-700">Category</TableHead>
                  <TableHead className="font-semibold text-slate-700">Type</TableHead>
                  <TableHead className="font-semibold text-slate-700">Verification Status</TableHead>
                  <TableHead className="font-semibold text-slate-700">Start Date</TableHead>
                  <TableHead className="font-semibold text-slate-700">Location / Dept</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((ev) => {
                  const typeBadge =
                    ev.type === "HOSTED"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : ev.type === "ATTENDED"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200";

                  const catConfig =
                    ev.category && (ev.category as EventCategory) in ACADEMIC_CATEGORIES
                      ? ACADEMIC_CATEGORIES[ev.category as EventCategory]
                      : null;

                  return (
                    <TableRow
                      key={ev.id}
                      className="cursor-pointer hover:bg-blue-50/40 transition-colors"
                      onClick={() => setSelectedEvent(ev)}
                    >
                      {/* Title & Role */}
                      <TableCell className="font-medium text-slate-900 max-w-[280px]">
                        <div className="font-semibold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1">
                          {ev.title}
                        </div>
                        {ev.role && (
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-normal">
                            <span>{ev.role}</span>
                          </div>
                        )}
                      </TableCell>

                      {/* Category Badge */}
                      <TableCell>
                        {catConfig ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${catConfig.badgeClass}`}
                          >
                            <Tag className="h-3 w-3" />
                            {catConfig.label}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </TableCell>

                      {/* Type Badge */}
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${typeBadge}`}
                        >
                          {ev.type}
                        </span>
                      </TableCell>

                      {/* Verification Status Badge */}
                      <TableCell>
                        {ev.isVerified ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Verified (Locked)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                            <span>Non-Verified</span>
                          </span>
                        )}
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-slate-600 whitespace-nowrap text-xs">
                        {format(new Date(ev.startAt), "MMM d, yyyy")}
                        {!ev.allDay && (
                          <span className="block text-slate-400 text-[11px]">
                            {format(new Date(ev.startAt), "h:mm a")}
                          </span>
                        )}
                      </TableCell>

                      {/* Location / Dept */}
                      <TableCell className="text-slate-600 text-xs">
                        <div>{ev.location || "—"}</div>
                        {ev.department && (
                          <div className="text-[11px] text-slate-400">{ev.department}</div>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="View event details"
                            onClick={() => setSelectedEvent(ev)}
                            className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {/* Quick Verify Button */}
                          {!ev.isVerified ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Verify and Approve event"
                              onClick={() => handleQuickVerify(ev, true)}
                              className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50"
                            >
                              <ShieldCheck className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled
                              title="Record is verified and locked from editing or deletion"
                              className="h-8 w-8 p-0 text-emerald-500 cursor-not-allowed opacity-70"
                            >
                              <Lock className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            title="Duplicate event (+7 days)"
                            onClick={() => handleDuplicate(ev.id)}
                            className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>

                          {/* Delete Action (Disabled if Verified) */}
                          {ev.isVerified ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled
                              title="Verified events cannot be deleted (No Edit Option)"
                              className="h-8 w-8 p-0 text-slate-300 cursor-not-allowed"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Delete event"
                              onClick={() => handleDelete(ev)}
                              className="h-8 w-8 p-0 text-slate-600 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
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

      {/* Event Details Dialog */}
      <EventDetailsDialog
        event={selectedEvent}
        open={Boolean(selectedEvent)}
        onOpenChange={(open) => {
          if (!open) setSelectedEvent(null);
        }}
        onEventUpdated={fetchEvents}
      />
    </div>
  );
}
