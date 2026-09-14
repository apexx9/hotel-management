"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Loader2, Building2, Lock, Unlock } from "lucide-react";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { navItems } from "@/utils/nav-items";
import { cn } from "@/lib/utils";

import useAuthStore from "@/store/useAuthStore";
import AuthService from "@/services/auth.service";

function getInitials(value?: string) {
  if (!value) return "?";
  const parts = value.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { state, isMobile, setOpen } = useSidebar();
  const isCollapsed = state === "collapsed";

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [locked, setLocked] = useState(false);

  const user = useAuthStore((s) => s.user);

  const visibleNavItems = (() => {
    const role = user?.role;
    return navItems
      .map((item) => ({
        ...item,
        children: item.children
          ? item.children.filter(
              (c) => !c.allowedRoles || !role || c.allowedRoles.includes(role),
            )
          : undefined,
      }))
      .filter((item) => {
        if (item.allowedRoles && role && !item.allowedRoles.includes(role))
          return false;
        if (
          item.children &&
          item.children.length === 0 &&
          item.children !== undefined
        )
          return false;
        return true;
      });
  })();

  const handleMouseEnterSidebar = () => {
    if (!isMobile && isCollapsed && !locked) setOpen(true);
  };

  const handleMouseLeaveSidebar = () => {
    if (!isMobile && !locked) {
      setOpen(false);
    }
  };

  const toggleLock = () => {
    const nextLocked = !locked;
    setLocked(nextLocked);
    if (nextLocked) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await AuthService().logout();
    } catch {
      // Graceful failure
    } finally {
      setIsLoggingOut(false);
      router.replace("/login");
    }
  };

  // ─── COLLAPSED RENDER ─────────────────────────────────────
  if (isCollapsed) {
    return (
      <Sidebar
        collapsible="icon"
        onMouseEnter={handleMouseEnterSidebar}
        onMouseLeave={handleMouseLeaveSidebar}
        className="border-r shadow-sm"
      >
        <SidebarHeader className="flex items-center justify-center py-3 px-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md">
            <Building2 className="h-5 w-5" />
          </div>
        </SidebarHeader>

        <SidebarContent className="flex flex-col items-center gap-1 py-2 px-0">
          {visibleNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.children &&
                item.children.some((child) => pathname === child.href));

            // Leaf item — clickable icon link (unchanged)
            if (!item.children) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                </Link>
              );
            }

            // Section with children — non-clickable icon, tooltip shows label
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger
                  aria-label={item.label}
                  className={cn(
                    "flex h-9 w-9 cursor-default items-center justify-center rounded-md transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="right" align="center">
                  <p className="font-medium">{item.label}</p>
                  {item.children && (
                    <ul className="mt-1 space-y-0.5">
                      {item.children.map((child) => (
                        <li
                          key={child.href}
                          className="text-xs opacity-80"
                        >
                          {child.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </SidebarContent>

        <SidebarFooter className="flex flex-col items-center gap-2 border-t border-border py-3 px-0">
          {user ? (
            <Tooltip>
              <TooltipTrigger
                aria-label={user.name || user.email}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-1 ring-primary/20"
              >
                {getInitials(user?.name || user?.email)}
              </TooltipTrigger>
              <TooltipContent side="right" align="center">
                <p className="font-medium">{user?.name || "My Account"}</p>
                <p className="text-xs opacity-70">{user?.email}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
          )}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            title="Log out"
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            {isLoggingOut ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4 shrink-0" />
            )}
          </button>
        </SidebarFooter>
      </Sidebar>
    );
  }

  // ─── EXPANDED RENDER ─────────────────────────────────────
  return (
    <Sidebar
      collapsible="icon"
      onMouseEnter={handleMouseEnterSidebar}
      onMouseLeave={handleMouseLeaveSidebar}
      className="border-r shadow-sm"
    >
      <SidebarHeader className="pt-4 pb-2 px-3">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-bold leading-tight">
              Hotel Manager
            </span>
            <span className="truncate text-xs text-muted-foreground">
              Admin Portal
            </span>
          </div>
          <button
            onClick={toggleLock}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            title={locked ? "Unlock sidebar" : "Lock sidebar open"}
          >
            {locked ? (
              <Lock className="h-4 w-4" />
            ) : (
              <Unlock className="h-4 w-4" />
            )}
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-2">
        <SidebarGroup>
          <SidebarMenu className="space-y-3">
            {visibleNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.children?.some((c) => pathname === c.href) ?? false);

              // ── Leaf item (no children) — unchanged pill styling ──
              if (!item.children) {
                return (
                  <SidebarMenuItem key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex h-9 items-center gap-3 rounded-md px-3 text-sm transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        isActive
                          ? "bg-accent text-accent-foreground font-medium"
                          : "text-muted-foreground",
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuItem>
                );
              }

              // ── Section with children — always visible ──
              return (
                <SidebarMenuItem key={item.href} className="space-y-1">
                  {/* Non-clickable section label */}
                  <div className="flex items-center gap-2 px-3 pb-1.5 pt-1">
                    <item.icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                      {item.label}
                    </span>
                  </div>

                  {/* Children with left rail */}
                  <div className="ml-[18px] space-y-0.5 border-l border-border pl-2">
                    {item.children.map((child) => {
                      const childActive = pathname === child.href;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "flex h-8 items-center gap-2 rounded-md px-3 text-sm transition-colors",
                            "hover:bg-accent hover:text-accent-foreground",
                            childActive
                              ? "bg-accent text-accent-foreground font-medium"
                              : "text-muted-foreground",
                          )}
                        >
                          <child.icon className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-3">
        {user ? (
          <div className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-1 ring-primary/20">
              {getInitials(user?.name || user?.email)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {user?.name || "My Account"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg p-2">
            <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-3.5 w-24 animate-pulse rounded bg-muted" />
              <div className="h-3 w-32 animate-pulse rounded bg-muted" />
            </div>
          </div>
        )}

        <SidebarMenu className="mt-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              disabled={isLoggingOut}
              tooltip="Log out"
              className="rounded-md transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              {isLoggingOut ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4 shrink-0" />
              )}
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
