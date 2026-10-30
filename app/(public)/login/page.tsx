"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FacultyAmbientBackground } from "@/components/ui/faculty-ambient-background";
import { GraduationCap, AlertCircle, Loader2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/dashboard";

  const [facultyCode, setFacultyCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facultyCode: facultyCode.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || "Failed to sign in. Please verify your credentials.");
        setLoading(false);
        return;
      }

      router.push(nextUrl);
    } catch {
      setError("Network error occurred. Please try again.");
      setLoading(false);
    }
  };

  const setDemoCredentials = (code: string) => {
    setFacultyCode(code);
    setPassword("DemoPassword123");
  };

  return (
    <Card className="w-full max-w-md shadow-xl border-slate-200/80 bg-white/95 backdrop-blur-md relative z-10">
      <CardHeader className="text-center space-y-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
          <GraduationCap className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
          FacultyPulse
        </CardTitle>
        <CardDescription className="text-slate-600">
          Sign in to track your academic events, workload, and achievements
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="facultyCode" className="font-semibold text-slate-700">
              Faculty ID
            </Label>
            <Input
              id="facultyCode"
              type="text"
              placeholder="e.g. DEMO-001"
              value={facultyCode}
              onChange={(e) => setFacultyCode(e.target.value)}
              required
              autoFocus
              disabled={loading}
              className="bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="font-semibold text-slate-700">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="bg-white"
            />
          </div>

          <Button type="submit" className="w-full shadow-sm" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2 border-t border-slate-100 pt-4 text-center">
        <p className="text-xs font-medium text-slate-500">Quick Demo Accounts:</p>
        <div className="flex justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDemoCredentials("DEMO-001")}
            className="bg-white hover:bg-slate-50 text-slate-700 font-medium"
          >
            DEMO-001
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDemoCredentials("DEMO-002")}
            className="bg-white hover:bg-slate-50 text-slate-700 font-medium"
          >
            DEMO-002
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <FacultyAmbientBackground interactiveColor="#2563eb" />
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center relative z-10">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
