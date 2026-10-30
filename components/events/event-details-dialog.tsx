"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  MapPin,
  Building2,
  Users,
  Award,
  FileText,
  Copy,
  Trash2,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Briefcase
} from "lucide-react";

export interface EventDetailItem {
  id: string;
  title: string;
  type: "HOSTED" | "ATTENDED" | "BUSY";
  startAt: string | Date;
  endAt: string | Date;
  allDay: boolean;
  location?: string | null;
  department?: string | null;
  organizer?: string | null;
  role?: string | null;
  description?: string | null;
  attachmentUrl?: string | null;
}

interface EventDetailsDialogProps {
  event: EventDetailItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventUpdated?: () => void;
}

export function EventDetailsDialog({
  event,
  open,
  onOpenChange,
  onEventUpdated,
}: EventDetailsDialogProps) {
  const [duplicating, setDuplicating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "warning" | "error";
    message: string;
  } | null>(null);

  if (!event) return null;

  const startDate = new Date(event.startAt);
  const endDate = new Date(event.endAt);

  const typeConfig = {
    HOSTED: {
      label: "HOSTED (Organized)",
      badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
      dotClass: "bg-blue-600",
    },
    ATTENDED: {
      label: "ATTENDED (Participant)",
      badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
      dotClass: "bg-emerald-600",
    },
    BUSY: {
      label: "BUSY (Slot Blocked)",
      badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
      dotClass: "bg-amber-600",
    },
  }[event.type] || {
    label: event.type,
    badgeClass: "bg-slate-100 text-slate-800 border-slate-200",
    dotClass: "bg-slate-600",
  };

  const handleDuplicate = async () => {
    if (!event.id || duplicating) return;
    setDuplicating(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/events/${event.id}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.warning) {
          setFeedback({
            type: "warning",
            message: `Duplicated +7 days with overlap warning: ${data.warning}`,
          });
        } else {
          setFeedback({
            type: "success",
            message: "Event successfully duplicated +7 days forward!",
          });
        }
        if (onEventUpdated) onEventUpdated();
      } else {
        setFeedback({
          type: "error",
          message: data.error?.message || "Failed to duplicate event.",
        });
      }
    } catch {
      setFeedback({ type: "error", message: "Network error occurred." });
    } finally {
      setDuplicating(false);
    }
  };

  const handleDelete = async () => {
    if (!event.id || deleting) return;
    if (!confirm("Are you sure you want to delete this recorded event?")) return;

    setDeleting(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (onEventUpdated) onEventUpdated();
        onOpenChange(false);
      } else {
        const data = await res.json().catch(() => ({}));
        setFeedback({
          type: "error",
          message: data.error?.message || "Failed to delete event.",
        });
      }
    } catch {
      setFeedback({ type: "error", message: "Network error deleting event." });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-xl border border-slate-200 shadow-2xl">
        {/* Header Bar */}
        <div className="bg-slate-900 px-6 py-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${typeConfig.badgeClass}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${typeConfig.dotClass}`} />
              {typeConfig.label}
            </span>
            {event.allDay && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                All Day
              </span>
            )}
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-white leading-snug">
            {event.title}
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs mt-1">
            Recorded event reference #{event.id}
          </DialogDescription>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mx-6 mt-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : feedback.type === "warning"
                ? "bg-amber-50 text-amber-800 border border-amber-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="px-6 py-4 space-y-5 max-h-[65vh] overflow-y-auto">
          {/* Timing Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Calendar className="h-3.5 w-3.5 text-blue-600" />
              <span>Schedule & Duration</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-800">
              <div>
                <span className="text-xs text-slate-500 block">Starts:</span>
                <span className="font-medium">
                  {format(startDate, "EEE, MMM d, yyyy")}
                  {!event.allDay && ` • ${format(startDate, "h:mm a")}`}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Ends:</span>
                <span className="font-medium">
                  {format(endDate, "EEE, MMM d, yyyy")}
                  {!event.allDay && ` • ${format(endDate, "h:mm a")}`}
                </span>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm">
            {event.department && (
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-100 bg-white">
                <Building2 className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 font-medium">Department</p>
                  <p className="font-semibold text-slate-900">{event.department}</p>
                </div>
              </div>
            )}

            {event.location && (
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-100 bg-white">
                <MapPin className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 font-medium">Location / Venue</p>
                  <p className="font-semibold text-slate-900">{event.location}</p>
                </div>
              </div>
            )}

            {event.organizer && (
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-100 bg-white">
                <Users className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 font-medium">Organizer</p>
                  <p className="font-semibold text-slate-900">{event.organizer}</p>
                </div>
              </div>
            )}

            {event.role && (
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-100 bg-white">
                <Briefcase className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 font-medium">Faculty Role</p>
                  <p className="font-semibold text-slate-900">{event.role}</p>
                </div>
              </div>
            )}
          </div>

          {/* Description / Notes */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-slate-400" /> Description & Academic Notes
            </span>
            <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 border border-slate-200 min-h-[60px] whitespace-pre-wrap">
              {event.description || (
                <span className="text-slate-400 italic">No additional notes filed for this event.</span>
              )}
            </div>
          </div>

          {/* Attached Files / Document */}
          {event.attachmentUrl && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <ExternalLink className="h-3.5 w-3.5 text-blue-600" /> Attached Document / File
              </span>
              <div className="flex items-center justify-between p-3 rounded-lg border border-blue-200 bg-blue-50/50">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="text-xs font-medium text-slate-800 truncate">
                    {event.attachmentUrl}
                  </span>
                </div>
                <a
                  href={event.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 ml-2"
                >
                  <Button size="sm" variant="outline" className="gap-1 text-xs h-7">
                    <span>View File</span>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-2 sm:justify-between items-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs gap-1.5"
          >
            {deleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            <span>Delete Event</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDuplicate}
              disabled={duplicating}
              className="text-xs gap-1.5"
            >
              {duplicating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span>Duplicate (+7d)</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
