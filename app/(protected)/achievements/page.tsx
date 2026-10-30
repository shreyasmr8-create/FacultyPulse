"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Award, CheckCircle2, Lock, Flame, Building2, Calendar, Loader2 } from "lucide-react";
import { SparklesText } from "@/components/ui/sparkles-text";

interface Badge {
  id: string;
  title: string;
  description: string;
  earned: boolean;
  progressPercent: number;
  currentCount: number;
  targetCount: number;
  icon?: string;
}

interface AchievementsResponse {
  metrics: {
    totalHosted: number;
    totalAttended: number;
    totalBusyDays: number;
    totalEvents: number;
    departmentsEngaged: number;
    activeMonthsStreak: number;
  };
  badges: Badge[];
}

export default function AchievementsPage() {
  const [data, setData] = useState<AchievementsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/achievements")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const metrics = data?.metrics;
  const badges = data?.badges || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Award className="h-7 w-7 text-blue-600" />
          <span>Faculty Achievements & Milestones</span>
        </h1>
        <p className="text-slate-500">
          Recognizing your academic contributions, leadership, and professional development
        </p>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Hosted</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{metrics?.totalHosted ?? 0}</div>
            <p className="text-xs text-slate-500 mt-1">Workshops and seminars hosted</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Attended</CardTitle>
            <Award className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{metrics?.totalAttended ?? 0}</div>
            <p className="text-xs text-slate-500 mt-1">Conferences & symposiums attended</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Departments</CardTitle>
            <Building2 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{metrics?.departmentsEngaged ?? 0}</div>
            <p className="text-xs text-slate-500 mt-1">Inter-departmental collaborations</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Monthly Streak</CardTitle>
            <Flame className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <SparklesText
                text={String(metrics?.activeMonthsStreak ?? 0)}
                className="text-3xl font-bold text-slate-900 inline-block"
                sparklesCount={6}
                colors={{ first: "#f59e0b", second: "#3b82f6" }}
              />
              <span className="text-sm font-normal text-slate-500">months</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Consecutive activity records</p>
          </CardContent>
        </Card>
      </div>

      {/* Badges Grid */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-900">Milestone Badges</CardTitle>
          <CardDescription className="text-slate-500">
            Earn badges by organizing events, maintaining streaks, and collaborating cross-departmentally
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {badges.map((badge) => {
              return (
                <div
                  key={badge.id}
                  className={`relative flex flex-col justify-between rounded-xl p-5 border transition-all ${
                    badge.earned
                      ? "border-blue-200 bg-blue-50/40 shadow-xs"
                      : "border-slate-200 bg-slate-50/50 opacity-75"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl font-bold shadow-xs ${
                        badge.earned
                          ? "bg-blue-600 text-white"
                          : "bg-slate-200 text-slate-400"
                      }`}
                    >
                      {badge.earned ? <Award className="h-6 w-6" /> : <Lock className="h-5 w-5" />}
                    </div>
                    {badge.earned ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                        <CheckCircle2 className="h-3 w-3" /> Earned
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        In Progress
                      </span>
                    )}
                  </div>

                  <div className="mt-4 space-y-1">
                    <h4 className="font-semibold text-slate-900 text-base">{badge.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{badge.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>Progress</span>
                      <span className="font-semibold text-slate-700">
                        {badge.currentCount} / {badge.targetCount}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          badge.earned ? "bg-blue-600" : "bg-slate-400"
                        }`}
                        style={{ width: `${Math.min(100, badge.progressPercent)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
