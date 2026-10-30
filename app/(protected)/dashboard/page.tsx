"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SparklesText } from "@/components/ui/sparkles-text";
import { EventDetailsDialog } from "@/components/events/event-details-dialog";
import {
  CalendarDays,
  Award,
  Users,
  Building2,
  PlusCircle,
  Clock,
  MapPin,
  Loader2,
  CalendarCheck,
  ArrowRight
} from "lucide-react";

interface EventItem {
  id: string;
  title: string;
  type: "HOSTED" | "ATTENDED" | "BUSY";
  startAt: string;
  endAt: string;
  allDay: boolean;
  location?: string | null;
  department?: string | null;
  organizer?: string | null;
  role?: string | null;
  description?: string | null;
  attachmentUrl?: string | null;
}

interface AchievementsData {
  metrics: {
    totalHosted: number;
    totalAttended: number;
    totalBusyDays: number;
    totalEvents: number;
    departmentsEngaged: number;
    activeMonthsStreak: number;
  };
  badges: Array<{
    id: string;
    title: string;
    earned: boolean;
  }>;
}

export default function DashboardPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [achievements, setAchievements] = useState<AchievementsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  const loadDashboardData = async () => {
    try {
      const [eventsRes, achievementsRes] = await Promise.all([
        fetch("/api/events?preset=this_week"),
        fetch("/api/achievements"),
      ]);

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData.items || []);
      }

      if (achievementsRes.ok) {
        const achData = await achievementsRes.json();
        setAchievements(achData);
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const metrics = achievements?.metrics;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500">
            Overview of your academic activities, metrics, and schedule for this week
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/events/new">
            <Button className="gap-2 shadow-sm">
              <PlusCircle className="h-4 w-4" />
              <span>Record Event</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Top-Line Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Hosted</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{metrics?.totalHosted ?? 0}</div>
            <p className="text-xs text-slate-500 mt-1">Workshops, seminars & classes organized</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Attended</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{metrics?.totalAttended ?? 0}</div>
            <p className="text-xs text-slate-500 mt-1">Conferences, meetings & events attended</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Departments</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <Building2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {metrics?.departmentsEngaged ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Cross-disciplinary academic collaborations</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active Streak</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Award className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <SparklesText
                text={String(metrics?.activeMonthsStreak ?? 0)}
                className="text-3xl font-bold text-slate-900 inline-block"
                sparklesCount={6}
                colors={{ first: "#f59e0b", second: "#3b82f6" }}
              />
              <span className="text-base font-normal text-slate-500">months</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Consecutive active months recorded</p>
          </CardContent>
        </Card>
      </div>

      {/* Events This Week */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-slate-900">This Week&apos;s Events</CardTitle>
            <CardDescription className="text-slate-500">
              Scheduled events and academic commitments for the current week
            </CardDescription>
          </div>
          <Link href="/events">
            <Button variant="ghost" size="sm" className="gap-1 text-blue-600 hover:text-blue-700">
              <span>View All Events</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
                <CalendarDays className="h-6 w-6" />
              </div>
              <p className="font-medium text-slate-700">No events scheduled this week</p>
              <p className="text-sm text-slate-500 max-w-sm mt-1">
                You have no upcoming events recorded for this week. Use the button below to add your first event.
              </p>
              <Link href="/events/new" className="mt-4">
                <Button size="sm" className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  <span>Record an Event</span>
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {events.map((ev) => {
                const startDate = new Date(ev.startAt);
                const endDate = new Date(ev.endAt);
                const typeColor =
                  ev.type === "HOSTED"
                    ? "bg-blue-100 text-blue-800 border-blue-200"
                    : ev.type === "ATTENDED"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                    : "bg-amber-100 text-amber-800 border-amber-200";

                return (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-3 hover:bg-blue-50/60 rounded-lg px-3 transition-colors cursor-pointer group border border-transparent hover:border-blue-100"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 text-base group-hover:text-blue-700 transition-colors">
                          {ev.title}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${typeColor}`}
                        >
                          {ev.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {ev.allDay
                            ? `${format(startDate, "MMM d, yyyy")} (All Day)`
                            : `${format(startDate, "MMM d, yyyy h:mm a")} - ${format(
                                endDate,
                                "h:mm a"
                              )}`}
                        </span>
                        {ev.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {ev.location}
                          </span>
                        )}
                        {ev.department && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5" />
                            {ev.department}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs shrink-0 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all self-start sm:self-center"
                    >
                      View Details
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reusable Event Details Dialog */}
      <EventDetailsDialog
        event={selectedEvent}
        open={Boolean(selectedEvent)}
        onOpenChange={(open) => {
          if (!open) setSelectedEvent(null);
        }}
        onEventUpdated={loadDashboardData}
      />
    </div>
  );
}
