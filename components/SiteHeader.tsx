"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarDays, LayoutDashboard, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { clearActor, getActor } from "@/lib/actor";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const pathname = usePathname();
  const [actor, setActor] = useState<string | null>(null);

  useEffect(() => {
    setActor(getActor());
  }, [pathname]);

  const navItems = [
    { href: "/", label: "日历", icon: CalendarDays },
    { href: "/dashboard", label: "仪表盘", icon: LayoutDashboard },
    { href: "/activities/new", label: "新建活动", icon: Plus },
  ];

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <img
            src="/logo.png"
            alt="校徽"
            width={28}
            height={28}
            className="h-7 w-7 rounded-md object-contain"
          />
          <span className="hidden text-sm sm:inline">南大研支团 · 协同平台</span>
          <span className="sm:hidden">协同平台</span>
        </Link>

        <nav className="ml-4 flex items-center gap-1 text-sm">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                  active && "bg-accent text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {actor ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{actor}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  clearActor();
                  setActor(null);
                }}
                className="h-6 px-2 text-xs"
              >
                切换
              </Button>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">未登记操作人</span>
          )}
        </div>
      </div>
    </header>
  );
}