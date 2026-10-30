"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ArrowLeft, Loader2, AlertTriangle, CheckCircle } from "lucide-react";

export default function NewEventPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [type, setType] = useState<"HOSTED" | "ATTENDED" | "BUSY">("HOSTED");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState("");
  const [department, setDepartment] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastWarning, setToastWarning] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setToastWarning(null);

    if (!title.trim() || !startAt || !endAt) {
      setError("Please fill in title, start time, and end time.");
      return;
    }

    if (new Date(endAt) < new Date(startAt)) {
      setError("End time cannot be earlier than start time.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        type,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        allDay,
        location: location.trim() || undefined,
        department: department.trim() || undefined,
        organizer: organizer.trim() || undefined,
        role: role.trim() || undefined,
        description: description.trim() || undefined,
      };

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || "Failed to create event.");
        setSubmitting(false);
        return;
      }

      // Handle the overlap warning from the API response and display as toast notification
      if (data.warning) {
        setToastWarning(data.warning);
        setSuccessToast("Event created successfully with a scheduling overlap warning.");
        setTimeout(() => {
          router.push("/dashboard");
        }, 3500);
      } else {
        setSuccessToast("Event created successfully!");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1200);
      }
    } catch {
      setError("Network error occurred while saving the event.");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Toast Notification Container */}
      {(toastWarning || successToast) && (
        <div className="fixed top-5 right-5 z-50 max-w-md animate-in slide-in-from-top-4 space-y-2">
          {successToast && (
            <div className="flex items-center gap-3 rounded-lg bg-emerald-600 p-4 text-white shadow-lg">
              <CheckCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">{successToast}</p>
            </div>
          )}
          {toastWarning && (
            <div className="flex items-center gap-3 rounded-lg bg-amber-500 p-4 text-white shadow-lg">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-bold">Scheduling Overlap Warning</p>
                <p className="text-xs">{toastWarning}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-1 text-slate-500">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Button>
        </Link>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-900">Record New Event</CardTitle>
          <CardDescription className="text-slate-500">
            Add an academic event, workshop, conference, or busy slot to your calendar
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Workshop on Cloud Architecture & AI"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="type">Event Type *</Label>
                <Select
                  value={type}
                  onValueChange={(val: "HOSTED" | "ATTENDED" | "BUSY") => setType(val)}
                  disabled={submitting}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOSTED">HOSTED (Organized by you)</SelectItem>
                    <SelectItem value="ATTENDED">ATTENDED (Participant / Guest)</SelectItem>
                    <SelectItem value="BUSY">BUSY (Unavailable / Blocked)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  placeholder="e.g. Computer Science"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="startAt">Start Date & Time *</Label>
                <Input
                  id="startAt"
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="endAt">End Date & Time *</Label>
                <Input
                  id="endAt"
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="allDay"
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                disabled={submitting}
              />
              <Label htmlFor="allDay" className="cursor-pointer text-sm font-normal">
                All-day event (covers full day span)
              </Label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="location">Location / Venue</Label>
                <Input
                  id="location"
                  placeholder="e.g. Main Seminar Hall A"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="organizer">Organizer</Label>
                <Input
                  id="organizer"
                  placeholder="e.g. IEEE Student Chapter"
                  value={organizer}
                  onChange={(e) => setOrganizer(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role">Your Role</Label>
              <Input
                id="role"
                placeholder="e.g. Keynote Speaker / Session Chair"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description & Notes</Label>
              <textarea
                id="description"
                rows={3}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                placeholder="Additional notes, syllabus covered, or session summary..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Link href="/dashboard">
              <Button type="button" variant="outline" disabled={submitting}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={submitting} className="min-w-[120px]">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Event"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
