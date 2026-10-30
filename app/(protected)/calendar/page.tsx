"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths
} from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Loader2,
  Clock,
  MapPin
} from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  type: "HOSTED" | "ATTENDED" | "BUSY";
  startAt: string;
  endAt: string;
  location?: string | null;
  department?: string | null;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [groupedEvents, setGroupedEvents] = useState<Record<string, CalendarEvent[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDayEvents, setSelectedDayEvents] = useState<{
    dateStr: string;
    events: CalendarEvent[];
  } | null>(null);

  useEffect(() => {
    async function loadMonthEvents() {
      setLoading(true);
      try {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);

        const params = new URLSearchParams({
          from: monthStart.toISOString(),
          to: monthEnd.toISOString(),
        });

        const res = await fetch(`/api/calendar?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setGroupedEvents(data.groupedByDate || {});
        }
      } catch (err) {
        console.error("Error loading calendar:", err);
      } finally {
        setLoading(false);
      }
    }

    loadMonthEvents();
  }, [currentDate]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Starting blank days to align day of week (0 = Sunday)
  const startDayOfWeek = monthStart.getDay();
  const leadingBlanks = Array.from({ length: startDayOfWeek });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CalendarDays className="h-7 w-7 text-blue-600" />
            <span>Academic Calendar</span>
          </h1>
          <p className="text-slate-500">
            Monthly schedule of hosted sessions, conference attendances, and busy slots
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[130px] text-center text-sm font-semibold text-slate-800">
              {format(currentDate, "MMMM yyyy")}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Link href="/events/new">
            <Button className="gap-2 shadow-sm">
              <PlusCircle className="h-4 w-4" />
              <span>Record Event</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider py-3">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {loading ? (
            <div className="flex h-96 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 min-h-[500px]">
              {leadingBlanks.map((_, i) => (
                <div key={`blank-${i}`} className="bg-slate-50/40 p-2 min-h-[90px]" />
              ))}

              {daysInMonth.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dayEvents = groupedEvents[dateKey] || [];
                const isCurrent = isToday(day);

                return (
                  <div
                    key={dateKey}
                    onClick={() => {
                      if (dayEvents.length > 0) {
                        setSelectedDayEvents({ dateStr: format(day, "MMMM d, yyyy"), events: dayEvents });
                      }
                    }}
                    className={`p-2 transition-colors flex flex-col justify-between min-h-[100px] cursor-pointer hover:bg-blue-50/40 ${
                      isCurrent ? "bg-blue-50/20" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold h-6 w-6 flex items-center justify-center rounded-full ${
                          isCurrent
                            ? "bg-blue-600 text-white"
                            : "text-slate-700"
                        }`}
                      >
                        {format(day, "d")}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[10px] font-medium text-slate-400">
                          {dayEvents.length} event{dayEvents.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    <div className="mt-1 space-y-1 overflow-hidden">
                      {dayEvents.slice(0, 3).map((ev) => {
                        const typeBg =
                          ev.type === "HOSTED"
                            ? "bg-blue-100 text-blue-800"
                            : ev.type === "ATTENDED"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800";
                        return (
                          <div
                            key={ev.id}
                            className={`truncate rounded px-1.5 py-0.5 text-[10px] font-medium ${typeBg}`}
                            title={ev.title}
                          >
                            {ev.title}
                          </div>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <p className="text-[10px] text-slate-500 font-medium pl-1">
                          +{dayEvents.length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Day Event Details Modal / Box */}
      {selectedDayEvents && (
        <Card className="border-blue-200 bg-blue-50/30 shadow-sm animate-in fade-in-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-bold text-slate-900">
              Events for {selectedDayEvents.dateStr}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDayEvents(null)}
              className="text-slate-500"
            >
              Close
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {selectedDayEvents.events.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200"
              >
                <div>
                  <h4 className="font-semibold text-sm text-slate-900">{ev.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {format(new Date(ev.startAt), "h:mm a")} - {format(new Date(ev.endAt), "h:mm a")}
                    </span>
                    {ev.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {ev.location}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    ev.type === "HOSTED"
                      ? "bg-blue-100 text-blue-800"
                      : ev.type === "ATTENDED"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {ev.type}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
