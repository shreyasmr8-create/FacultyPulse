"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, subMonths, startOfYear } from "date-fns";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { FileText, Download, Calendar, Filter, FileSpreadsheet, CheckCircle2, Printer, FileDown, ExternalLink } from "lucide-react";

export default function ReportsPage() {
  const router = useRouter();
  const today = new Date();
  const defaultFrom = format(subMonths(today, 3), "yyyy-MM-dd");
  const defaultTo = format(today, "yyyy-MM-dd");

  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [type, setType] = useState<string>("ALL");
  const [department, setDepartment] = useState("");

  const handlePreset = (preset: "this_month" | "last_3_months" | "academic_year") => {
    const now = new Date();
    if (preset === "this_month") {
      setFrom(format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd"));
      setTo(format(now, "yyyy-MM-dd"));
    } else if (preset === "last_3_months") {
      setFrom(format(subMonths(now, 3), "yyyy-MM-dd"));
      setTo(format(now, "yyyy-MM-dd"));
    } else if (preset === "academic_year") {
      setFrom(format(startOfYear(now), "yyyy-MM-dd"));
      setTo(format(now, "yyyy-MM-dd"));
    }
  };

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (from) params.set("from", new Date(from).toISOString());
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      params.set("to", toDate.toISOString());
    }
    if (type && type !== "ALL") params.set("type", type);
    if (department.trim()) params.set("department", department.trim());
    return params.toString();
  };

  const handleDownload = (formatType: "csv" | "xlsx" | "docx") => {
    const qs = buildQueryString();
    const url = `/api/reports/export?${qs}&format=${formatType}`;
    window.open(url, "_blank");
  };

  const handleOpenDossier = () => {
    const qs = buildQueryString();
    window.open(`/reports/dossier?${qs}`, "_blank");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <FileText className="h-7 w-7 text-blue-600" />
          <span>Academic Reports & Dossier Exports</span>
        </h1>
        <p className="text-slate-500">
          Generate accredited semester dossiers, individual event portfolios with full notes, or export to Word (.docx), PDF, Excel (XLSX), and CSV.
        </p>
      </div>

      {/* Featured End-of-Semester One-Click Dossier Card */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50/70 via-white to-sky-50/40 shadow-sm overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                <span>Accreditation & NAAC / NBA Ready</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                End-of-Semester Comprehensive Dossier
              </h2>
              <p className="text-sm text-slate-600 max-w-xl leading-relaxed">
                Extract all your semester events into a structured, itemized document. Includes your exact notes, event descriptions, proof links, summary statistics, and institutional signature blocks.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
              <Button
                type="button"
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                onClick={handleOpenDossier}
              >
                <Printer className="h-4 w-4" />
                <span>Print / Save as PDF</span>
                <ExternalLink className="h-3 w-3 opacity-70" />
              </Button>
              <Button
                type="button"
                variant="outline"
                className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                onClick={() => handleDownload("docx")}
              >
                <FileDown className="h-4 w-4 text-blue-600" />
                <span>Download Word (.docx)</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-900">Report Filters & Date Range</CardTitle>
          <CardDescription className="text-slate-500">
            Customize the date range and filters applied to all exported documents and files
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Quick Preset Buttons */}
          <div>
            <Label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block font-semibold">
              Quick Presets
            </Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePreset("this_month")}
              >
                This Month
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePreset("last_3_months")}
              >
                Last 3 Months
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePreset("academic_year")}
              >
                Current Academic Year
              </Button>
            </div>
          </div>

          {/* Date Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="from">From Date *</Label>
              <div className="relative">
                <Input
                  id="from"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="to">To Date *</Label>
              <div className="relative">
                <Input
                  id="to"
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="typeFilter">Event Type</Label>
              <Select value={type} onValueChange={(val) => setType(val)}>
                <SelectTrigger id="typeFilter">
                  <SelectValue placeholder="All Event Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Event Types</SelectItem>
                  <SelectItem value="HOSTED">HOSTED Only</SelectItem>
                  <SelectItem value="ATTENDED">ATTENDED Only</SelectItem>
                  <SelectItem value="BUSY">BUSY Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="department">Filter by Department (optional)</Label>
              <Input
                id="department"
                placeholder="e.g. Computer Science"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
          </div>

          {/* Export Summary Box */}
          <div className="rounded-lg bg-blue-50/60 p-4 border border-blue-100 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-900">What is included in each export?</p>
              <p className="text-blue-700 text-xs mt-0.5 leading-relaxed">
                <strong>Word (.docx) & PDF Dossier:</strong> Official university letterhead, executive metrics summary, followed by an itemized event dossier detailing each event individually with your full typed notes and proof links, ending with HOD/Dean signature blocks.
                <br />
                <strong>Excel (XLSX) & CSV:</strong> Clean multi-column tabular spreadsheets suitable for data analysis and department audits.
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <span className="text-xs text-slate-500">
            Selected range: <span className="font-medium text-slate-800">{from || "Start"}</span> to{" "}
            <span className="font-medium text-slate-800">{to || "End"}</span>
          </span>

          {/* All Download Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 border-slate-300"
              onClick={() => handleDownload("csv")}
            >
              <Download className="h-3.5 w-3.5 text-slate-600" />
              <span>CSV</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              onClick={() => handleDownload("xlsx")}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Excel (.xlsx)</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50"
              onClick={() => handleDownload("docx")}
            >
              <FileDown className="h-3.5 w-3.5" />
              <span>Word (.docx)</span>
            </Button>

            <Button
              type="button"
              size="sm"
              className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              onClick={handleOpenDossier}
            >
              <Printer className="h-3.5 w-3.5" />
              <span>PDF Dossier</span>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
