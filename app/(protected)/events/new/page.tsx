"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EventCategory, EventType } from "@prisma/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ACADEMIC_CATEGORIES } from "@/config/academic";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  CheckCircle,
  ShieldCheck,
  Award,
  Sparkles,
} from "lucide-react";

export default function NewEventPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<EventCategory>("CONFERENCE");
  const [type, setType] = useState<EventType>("ATTENDED");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState("");
  const [department, setDepartment] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [role, setRole] = useState("Conference Attended By");
  const [description, setDescription] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastWarning, setToastWarning] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleCategoryChange = (newCat: EventCategory) => {
    setCategory(newCat);
    const catConfig = ACADEMIC_CATEGORIES[newCat];
    if (catConfig && catConfig.roles.length > 0) {
      const defaultRole = catConfig.roles[0];
      setRole(defaultRole.value);
      setType(defaultRole.defaultType);
    }
  };

  const handlePresetRoleClick = (roleVal: string, defaultType: EventType) => {
    setRole(roleVal);
    setType(defaultType);
  };

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
        category,
        type,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        allDay,
        location: location.trim() || undefined,
        department: department.trim() || undefined,
        organizer: organizer.trim() || undefined,
        role: role.trim() || undefined,
        description: description.trim() || undefined,
        attachmentUrl: attachmentUrl.trim() || undefined,
        isVerified,
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

      if (data.warning) {
        setToastWarning(data.warning);
        setSuccessToast(
          isVerified
            ? "Event created and verified successfully with a scheduling overlap warning."
            : "Event created successfully with a scheduling overlap warning."
        );
        setTimeout(() => {
          router.push("/events");
        }, 3500);
      } else {
        setSuccessToast(
          isVerified
            ? "Event created and verified successfully! Record is now locked."
            : "Event created successfully!"
        );
        setTimeout(() => {
          router.push("/events");
        }, 1200);
      }
    } catch {
      setError("Network error occurred while saving the event.");
      setSubmitting(false);
    }
  };

  const activeCategoryConfig = ACADEMIC_CATEGORIES[category] || ACADEMIC_CATEGORIES.CONFERENCE;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Toast Notification Container */}
      {(toastWarning || successToast) && (
        <div className="space-y-2">
          {successToast && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 shadow-md text-emerald-900 transition-all">
              <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
              <div className="text-sm font-semibold">{successToast}</div>
            </div>
          )}
          {toastWarning && (
            <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/90 p-4 shadow-md text-amber-900 transition-all">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <div className="text-sm font-medium">{toastWarning}</div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <Link href="/events">
          <Button variant="ghost" size="sm" className="gap-1.5 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Events</span>
          </Button>
        </Link>
        <span className="text-xs text-slate-500 font-medium">
          Dayananda Sagar University • Faculty Portfolio
        </span>
      </div>

      <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
        <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-blue-50/30 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <Award className="h-4 w-4" />
            <span>Academic Activity Record</span>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            Record Academic Engagement
          </CardTitle>
          <CardDescription className="text-slate-500 text-sm">
            Add conferences, seminars, workshops, journal chair roles, and guest lectures to your institutional dossier.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 pt-6">
            {error && (
              <div className="rounded-xl bg-red-50 p-3.5 text-sm text-red-700 border border-red-200 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Academic Category & Preset Roles Section */}
            <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between">
                <Label htmlFor="category" className="text-sm font-semibold text-slate-900">
                  Academic Category *
                </Label>
                <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  Select to view specialized roles
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.keys(ACADEMIC_CATEGORIES) as EventCategory[]).map((catKey) => {
                  const cat = ACADEMIC_CATEGORIES[catKey];
                  const isSelected = category === catKey;
                  return (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => handleCategoryChange(catKey)}
                      className={`text-xs font-medium py-2 px-3 rounded-lg border text-center transition-all ${
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/40"
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Role Presets */}
              <div className="pt-2">
                <span className="text-xs font-medium text-slate-600 block mb-2">
                  Specialized {activeCategoryConfig.label} Activities:
                </span>
                <div className="flex flex-wrap gap-2">
                  {activeCategoryConfig.roles.map((r) => {
                    const isSelected = role === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => handlePresetRoleClick(r.value, r.defaultType)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <span>{r.label}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                            isSelected
                              ? "bg-slate-800 text-slate-200"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {r.defaultType}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Title & Core Details */}
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-sm font-semibold text-slate-900">
                Event / Activity Title *
              </Label>
              <Input
                id="title"
                placeholder="e.g. IEEE International Conference on Smart Computing 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={submitting}
                className="h-10 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="role" className="text-sm font-semibold text-slate-900">
                  Role Description
                </Label>
                <Input
                  id="role"
                  placeholder="e.g. Conference Jury / Session Chair"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={submitting}
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="type" className="text-sm font-semibold text-slate-900">
                  Calendar Schedule Type *
                </Label>
                <Select
                  value={type}
                  onValueChange={(val: EventType) => setType(val)}
                  disabled={submitting}
                >
                  <SelectTrigger id="type" className="h-10">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOSTED">HOSTED (Organized, Chaired, or Delivered by you)</SelectItem>
                    <SelectItem value="ATTENDED">ATTENDED (Participant, Delegate, or Jury Member)</SelectItem>
                    <SelectItem value="BUSY">BUSY (Unavailable / Blocked Slot)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Timing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="startAt" className="text-sm font-semibold text-slate-900">
                  Start Date & Time *
                </Label>
                <Input
                  id="startAt"
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  required
                  disabled={submitting}
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="endAt" className="text-sm font-semibold text-slate-900">
                  End Date & Time *
                </Label>
                <Input
                  id="endAt"
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  required
                  disabled={submitting}
                  className="h-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="allDay"
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                disabled={submitting}
              />
              <Label htmlFor="allDay" className="cursor-pointer text-sm font-normal text-slate-700">
                All-day engagement (covers full schedule date)
              </Label>
            </div>

            {/* Department & Organizer */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="department" className="text-sm font-medium text-slate-800">
                  Department
                </Label>
                <Input
                  id="department"
                  placeholder="e.g. Computer Science"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  disabled={submitting}
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-sm font-medium text-slate-800">
                  Location / Venue
                </Label>
                <Input
                  id="location"
                  placeholder="e.g. Auditorium 2 / Virtual"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={submitting}
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="organizer" className="text-sm font-medium text-slate-800">
                  Organizer / Body
                </Label>
                <Input
                  id="organizer"
                  placeholder="e.g. IEEE / ACM / UGC"
                  value={organizer}
                  onChange={(e) => setOrganizer(e.target.value)}
                  disabled={submitting}
                  className="h-10"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm font-medium text-slate-800">
                Description & Academic Summary
              </Label>
              <textarea
                id="description"
                rows={3}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                placeholder="Include track names, paper title, key outcomes, or audience reach..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
              />
            </div>

            {/* Attachment URL */}
            <div className="space-y-1.5">
              <Label htmlFor="attachmentUrl" className="text-sm font-medium text-slate-800">
                Document / Certificate / Proceedings URL
              </Label>
              <Input
                id="attachmentUrl"
                placeholder="e.g. https://doi.org/... or Drive/Supabase certificate link"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                disabled={submitting}
                className="h-10"
              />
            </div>

            {/* Faculty Verification & Approval Toggle */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
              <div className="flex items-start gap-3">
                <input
                  id="isVerified"
                  type="checkbox"
                  checked={isVerified}
                  onChange={(e) => setIsVerified(e.target.checked)}
                  className="h-4 w-4 mt-1 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                  disabled={submitting}
                />
                <div className="space-y-1">
                  <Label htmlFor="isVerified" className="cursor-pointer text-sm font-semibold text-emerald-950 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>Faculty Verify & Approve on Submission</span>
                  </Label>
                  <p className="text-xs text-emerald-800/80 leading-relaxed">
                    Check this to classify this record under the <strong>Verified Category</strong>. Once verified, the record is locked and the edit option is disabled to guarantee official dossier integrity.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-3 border-t border-slate-100 p-6 bg-slate-50/50">
            <Link href="/events">
              <Button type="button" variant="outline" disabled={submitting}>
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={submitting}
              className="min-w-[140px] bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isVerified ? (
                "Save & Verify"
              ) : (
                "Save Record"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
