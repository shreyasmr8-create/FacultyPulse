"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ReportPayload } from "@/lib/reports/build";
import { Button } from "@/components/ui/button";
import {
  Printer,
  FileDown,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Building2,
  Users,
  Award,
  ExternalLink,
  CheckCircle2,
  Briefcase,
  Loader2,
  FileText
} from "lucide-react";

function DossierContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [report, setReport] = useState<ReportPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReport() {
      try {
        const res = await fetch(`/api/reports?${searchParams.toString()}`);
        if (!res.ok) {
          throw new Error("Failed to load report data.");
        }
        const data = await res.json();
        setReport(data.report);
      } catch (err: any) {
        setError(err.message || "Error loading report.");
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [searchParams]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadDocx = () => {
    const params = new URLSearchParams(searchParams);
    params.set("format", "docx");
    window.open(`/api/reports/export?${params.toString()}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-slate-600">Generating accredited semester dossier...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <p className="text-red-600 font-semibold">{error || "Report not found"}</p>
        <Link href="/reports">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Reports
          </Button>
        </Link>
      </div>
    );
  }

  const { header, summary, events } = report;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Action Toolbar (Hidden during print) */}
      <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-4 z-40">
        <div className="flex items-center gap-3">
          <Link href="/reports">
            <Button variant="ghost" size="sm" className="gap-1.5 text-slate-600">
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
          </Link>
          <span className="text-sm font-semibold text-slate-800">
            Dossier Preview: {header.facultyName} ({header.facultyCode})
          </span>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadDocx}
            className="gap-2 border-slate-300 text-blue-700 hover:bg-blue-50 flex-1 sm:flex-none"
          >
            <FileDown className="h-4 w-4" />
            <span>Download Word (.docx)</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handlePrint}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex-1 sm:flex-none"
          >
            <Printer className="h-4 w-4" />
            <span>Print / Save as PDF</span>
          </Button>
        </div>
      </div>

      {/* Printable Academic Dossier Sheet */}
      <div className="bg-white p-8 sm:p-12 rounded-xl border border-slate-200 shadow-md space-y-8 font-sans text-slate-900 print:border-none print:shadow-none print:p-0">
        {/* University Header */}
        <div className="text-center space-y-1.5 border-b-2 border-slate-900 pb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-blue-900 uppercase">
            {header.universityName || "Dayananda Sagar University"}
          </h1>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-wide uppercase">
            Faculty Semester Activity & Accreditation Dossier
          </h2>
          <p className="text-xs text-slate-500 italic">
            Official Self-Appraisal & Comprehensive Academic Event Portfolio
          </p>
          <p className="text-xs font-medium text-slate-600 pt-1">
            Period: <span className="font-semibold text-slate-900">{header.from}</span> to{" "}
            <span className="font-semibold text-slate-900">{header.to}</span> • Generated: {header.generatedDate}
          </p>
        </div>

        {/* Faculty Profile Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm">
          <div>
            <p className="text-xs text-slate-500 font-medium">Faculty Member</p>
            <p className="font-bold text-base text-slate-900">{header.facultyName}</p>
            <p className="text-xs text-slate-600">ID: {header.facultyCode}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Department & Institution</p>
            <p className="font-semibold text-slate-900">{header.department}</p>
            <p className="text-xs text-slate-600">{header.universityName}</p>
          </div>
        </div>

        {/* Executive Summary Metrics */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Award className="h-4 w-4 text-blue-600" />
            <span>1. Executive Summary & Workload Metrics</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg border border-slate-200 bg-white">
              <span className="text-xs text-slate-500 block">Total Events</span>
              <span className="text-2xl font-bold text-slate-900">{summary.totalEvents}</span>
            </div>
            <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/50">
              <span className="text-xs text-blue-700 block font-medium">Hosted Sessions</span>
              <span className="text-2xl font-bold text-blue-800">{summary.totalHosted}</span>
            </div>
            <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50">
              <span className="text-xs text-emerald-700 block font-medium">Attended Events</span>
              <span className="text-2xl font-bold text-emerald-800">{summary.totalAttended}</span>
            </div>
            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50">
              <span className="text-xs text-amber-700 block font-medium">Duty / Busy Days</span>
              <span className="text-2xl font-bold text-amber-800">{summary.totalBusyDays}</span>
            </div>
          </div>
        </div>

        {/* Itemized Event Dossier (One by One!) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span>2. Itemized Event Record ({events.length} Events)</span>
            </h3>
            <span className="text-xs text-slate-500 italic">Chronological listing with notes</span>
          </div>

          <div className="space-y-4">
            {events.map((ev, idx) => {
              const typeBadge =
                ev.type === "HOSTED"
                  ? "bg-blue-100 text-blue-800 border-blue-200"
                  : ev.type === "ATTENDED"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                  : "bg-amber-100 text-amber-800 border-amber-200";

              return (
                <div
                  key={ev.id}
                  className="print-avoid-break rounded-xl border border-slate-200 p-4 space-y-3 bg-white"
                >
                  {/* Event Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                      <h4 className="text-base font-bold text-slate-900">{ev.title}</h4>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${typeBadge}`}
                      >
                        {ev.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium shrink-0">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{ev.dateFormatted}</span>
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400 block font-medium">Department</span>
                      <span className="font-semibold text-slate-800">{ev.department || "—"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Venue / Location</span>
                      <span className="font-semibold text-slate-800">{ev.location || "—"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Organizer</span>
                      <span className="font-semibold text-slate-800">{ev.organizer || "—"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Faculty Role</span>
                      <span className="font-semibold text-slate-800">{ev.role || "—"}</span>
                    </div>
                  </div>

                  {/* Notes & Description as Typed by Faculty */}
                  <div className="bg-slate-50/80 rounded-lg p-3 text-xs text-slate-800 border border-slate-200/60 space-y-1">
                    <span className="font-bold text-slate-600 block uppercase tracking-wider text-[10px]">
                      Description & Academic Notes (Filing Record)
                    </span>
                    <p className="whitespace-pre-wrap leading-relaxed text-slate-700">
                      {ev.description || (
                        <span className="text-slate-400 italic">No notes recorded for this event.</span>
                      )}
                    </p>
                  </div>

                  {/* Attachment URL */}
                  {ev.attachmentUrl && (
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <span className="text-slate-500 font-medium">Attached Document / Certificate:</span>
                      <a
                        href={ev.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 font-medium truncate max-w-sm"
                      >
                        <span className="truncate">{ev.attachmentUrl}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Institutional Signatures Block */}
        <div className="print-avoid-break pt-8 border-t-2 border-slate-200 space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            3. Institutional Signatures & Verification
          </h3>
          <div className="grid grid-cols-3 gap-6 pt-12 text-center text-xs">
            <div className="border-t border-slate-400 pt-2 space-y-1">
              <p className="font-bold text-slate-900">{header.facultyName}</p>
              <p className="text-slate-500">Faculty Signature</p>
              <p className="text-[10px] text-slate-400">Date: {header.generatedDate}</p>
            </div>
            <div className="border-t border-slate-400 pt-2 space-y-1">
              <p className="font-bold text-slate-900">Head of Department (HOD)</p>
              <p className="text-slate-500">Signature & Official Seal</p>
              <p className="text-[10px] text-slate-400">Department of {header.department}</p>
            </div>
            <div className="border-t border-slate-400 pt-2 space-y-1">
              <p className="font-bold text-slate-900">Dean / Principal Approval</p>
              <p className="text-slate-500">Academic Affairs & Council</p>
              <p className="text-[10px] text-slate-400">Institutional Accreditation</p>
            </div>
          </div>
        </div>

        {/* Footer Notice */}
        <div className="text-center text-[10px] text-slate-400 pt-4 border-t border-slate-100">
          {report.footer}
        </div>
      </div>
    </div>
  );
}

export default function DossierPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <DossierContent />
    </Suspense>
  );
}
