"use client";

import { useState } from "react";
import { format, subMonths, startOfYear } from "date-fns";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { FileText, Download, Calendar, Filter, FileSpreadsheet, CheckCircle2 } from "lucide-react";

export default function ReportsPage() {
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

  const buildExportUrl = (formatType: "csv" | "xlsx") => {
    const params = new URLSearchParams();
    if (from) params.set("from", new Date(from).toISOString());
    if (to) {
      // Set end of day for the "to" date
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      params.set("to", toDate.toISOString());
    }
    if (type && type !== "ALL") params.set("type", type);
    if (department.trim()) params.set("department", department.trim());
    params.set("format", formatType);

    return `/api/reports/export?${params.toString()}`;
  };

  const handleDownload = (formatType: "csv" | "xlsx") => {
    const url = buildExportUrl(formatType);
    window.open(url, "_blank");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <FileText className="h-7 w-7 text-blue-600" />
          <span>Academic Reports & Exports</span>
        </h1>
        <p className="text-slate-500">
          Generate accredited activity reports, workload metrics, and export to CSV or Excel (XLSX)
        </p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-900">Report Parameters</CardTitle>
          <CardDescription className="text-slate-500">
            Select the date range and filters for your export
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
              <p className="font-semibold text-blue-900">What is included in this report?</p>
              <p className="text-blue-700 text-xs mt-0.5">
                The exported file contains your institution header, faculty ID, executive workload metrics
                (Total Hosted, Total Attended, Total Busy Days), followed by an itemized chronological event schedule.
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <span className="text-xs text-slate-500">
            Selected range: <span className="font-medium text-slate-800">{from || "Start"}</span> to{" "}
            <span className="font-medium text-slate-800">{to || "End"}</span>
          </span>

          {/* Download CSV and Download XLSX Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              className="flex-1 sm:flex-none gap-2 border-slate-300"
              onClick={() => handleDownload("csv")}
            >
              <Download className="h-4 w-4 text-slate-600" />
              <span>Download CSV</span>
            </Button>

            <Button
              type="button"
              className="flex-1 sm:flex-none gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              onClick={() => handleDownload("xlsx")}
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Download XLSX</span>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
