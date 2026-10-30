"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Award,
  FileText,
  Bot,
  LogOut,
  User,
  GraduationCap,
  PlusCircle,
  Menu,
  X,
  ListOrdered
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { FacultyAmbientBackground } from "@/components/ui/faculty-ambient-background";

interface FacultyProfile {
  id: string;
  facultyCode: string;
  fullName: string;
  email: string;
  department: string;
}

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Events", href: "/events", icon: ListOrdered },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Achievements", href: "/achievements", icon: Award },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "AI Assistant", href: "/assistant", icon: Bot },
];

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [faculty, setFaculty] = useState<FacultyProfile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          router.push("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.faculty) {
          setFaculty(data.faculty);
        }
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30 border-r border-slate-200 bg-white shadow-xs">
        <div className="flex h-16 items-center px-6 border-b border-slate-100 gap-3 bg-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 leading-tight">FacultyPulse</span>
            <p className="text-xs text-slate-500">Academic Portal</p>
          </div>
        </div>

        <div className="px-4 py-4 bg-white">
          <Link href="/events/new">
            <Button className="w-full justify-center gap-2 shadow-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold">
              <PlusCircle className="h-4 w-4" />
              <span>Record Event</span>
            </Button>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2 bg-white">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
                  active
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-white" : "text-slate-500"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User profile dropdown in sidebar footer */}
        <div className="p-3 border-t border-slate-100 bg-white">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-slate-100 transition-colors">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold shrink-0">
                  {faculty ? faculty.fullName[0] : <User className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {faculty?.fullName || "Loading..."}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {faculty?.facultyCode || ""} • {faculty?.department || ""}
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="font-medium text-slate-900">{faculty?.fullName}</p>
                <p className="text-xs text-slate-500">{faculty?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <GraduationCap className="h-4 w-4" />
          </div>
          <span className="font-bold text-slate-900">FacultyPulse</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-slate-900/50 pt-14">
          <div className="bg-white p-4 space-y-3 border-b border-slate-200 shadow-xl">
            <Link href="/events/new" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full justify-center gap-2 mb-2">
                <PlusCircle className="h-4 w-4" />
                <span>Record Event</span>
              </Button>
            </Link>
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                      active ? "bg-blue-50 text-blue-700" : "text-slate-600"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">{faculty?.fullName}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-600">
                <LogOut className="h-4 w-4 mr-1" /> Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 md:pl-64 flex flex-col min-h-screen relative">
        <FacultyAmbientBackground />
        <div className="flex-1 p-6 md:p-8 pt-18 md:pt-8 max-w-7xl w-full mx-auto relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
