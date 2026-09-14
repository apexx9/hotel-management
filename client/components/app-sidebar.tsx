"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LogOut,
  Loader2,
  Building2,
  Lock,
  Unlock,
} from "lucide-react";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarFooter,
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

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

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

  /**
   * Filter navigation based on the authenticated user's role.
   *
   * Parent items act as navigation sections when they contain children.
   * Their children remain permanently visible.
   */
  const visibleNavItems = navItems
    .map((item) => {
      const role = user?.role;

      const children = item.children?.filter(
        (child) =>
          !child.allowedRoles ||
          !role ||
          child.allowedRoles.includes(role),
      );

      return {
        ...item,
        children,
      };
    })
    .filter((item) => {
      const role = user?.role;

      if (
        item.allowedRoles &&
        role &&
        !item.allowedRoles.includes(role)
      ) {
        return false;
      }

      if (
        item.children &&
        item.children.length === 0
      ) {
        return false;
      }

      return true;
    });

  const handleMouseEnterSidebar = () => {
    if (!isMobile && isCollapsed && !locked) {
      setOpen(true);
    }
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
      // Graceful failure.
    } finally {
      setIsLoggingOut(false);
      router.replace("/login");
    }
  };

  /**
   * ─────────────────────────────────────────────
   * COLLAPSED SIDEBAR
   * ─────────────────────────────────────────────
   */
  if (isCollapsed) {
    return (
      <Sidebar
        collapsible="icon"
        onMouseEnter={handleMouseEnterSidebar}
        onMouseLeave={handleMouseLeaveSidebar}
        className="border-r shadow-sm"
      >
        <SidebarHeader className="flex items-center justify-center px-0 py-4">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center",
              "rounded-lg bg-primary text-primary-foreground",
              "shadow-sm",
            )}
          >
            <Building2 className="h-5 w-5" />
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2 py-3">
          <SidebarGroup className="p-0">
            <SidebarMenu className="gap-1">
              {visibleNavItems.map((item) => {
                /**
                 * Parent with children:
                 * show every child directly.
                 */
                if (item.children?.length) {
                  return item.children.map((child) => {
                    const isActive = pathname === child.href;

                    return (
                      <SidebarMenuItem key={child.href}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href={child.href}
                              className={cn(
                                "flex h-9 w-9 items-center justify-center",
                                "rounded-md transition-all duration-200",
                                "hover:bg-accent hover:text-accent-foreground",
                                isActive
                                  ? "bg-accent text-accent-foreground"
                                  : "text-muted-foreground",
                              )}
                            >
                              <child.icon className="h-4 w-4 shrink-0" />
                            </Link>
                          </TooltipTrigger>

                          <TooltipContent
                            side="right"
                            align="center"
                            sideOffset={8}
                          >
                            {child.label}
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuItem>
                    );
                  });
                }

                const isActive = pathname === item.href;

                return (
                  <SidebarMenuItem key={item.href}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex h-9 w-9 items-center justify-center",
                            "rounded-md transition-all duration-200",
                            "hover:bg-accent hover:text-accent-foreground",
                            isActive
                              ? "bg-accent text-accent-foreground"
                              : "text-muted-foreground",
                          )}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                        </Link>
                      </TooltipTrigger>

                      <TooltipContent
                        side="right"
                        align="center"
                        sideOffset={8}
                      >
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-border px-2 py-3">
          <div className="flex flex-col items-center gap-2">
            {user ? (
              <Tooltip>
                <TooltipTrigger
                  aria-label={user.name || user.email}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center",
                    "rounded-full bg-primary/10",
                    "text-sm font-semibold text-primary",
                    "ring-1 ring-primary/20",
                  )}
                >
                  {getInitials(user.name || user.email)}
                </TooltipTrigger>

                <TooltipContent side="right" align="center">
                  <p className="font-medium">
                    {user.name || "My Account"}
                  </p>

                  <p className="text-xs opacity-70">
                    {user.email}
                  </p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center",
                    "rounded-md text-muted-foreground",
                    "transition-colors",
                    "hover:bg-destructive/10 hover:text-destructive",
                  )}
                >
                  {isLoggingOut ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                </button>
              </TooltipTrigger>

              <TooltipContent side="right">
                Log out
              </TooltipContent>
            </Tooltip>
          </div>
        </SidebarFooter>
      </Sidebar>
    );
  }

  /**
   * ─────────────────────────────────────────────
   * EXPANDED SIDEBAR
   * ─────────────────────────────────────────────
   */
  return (
    <Sidebar
      collapsible="icon"
      onMouseEnter={handleMouseEnterSidebar}
      onMouseLeave={handleMouseLeaveSidebar}
      className="border-r shadow-sm"
    >
      {/* ───────────────── HEADER ───────────────── */}

      <SidebarHeader className="px-4 pb-3 pt-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center",
              "rounded-lg bg-primary text-primary-foreground",
              "shadow-sm",
            )}
          >
            <Building2 className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold leading-tight">
              Hotel Manager
            </p>

            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              Admin Portal
            </p>
          </div>

          <button
            onClick={toggleLock}
            title={
              locked
                ? "Unlock sidebar"
                : "Lock sidebar open"
            }
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center",
              "rounded-md text-muted-foreground",
              "transition-all duration-200",
              "hover:bg-accent hover:text-foreground",
              locked && "bg-accent text-foreground",
            )}
          >
            {locked ? (
              <Lock className="h-3.5 w-3.5" />
            ) : (
              <Unlock className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </SidebarHeader>

      {/* ───────────────── NAVIGATION ───────────────── */}

      <SidebarContent className="px-3 py-2">
        <SidebarGroup className="p-0">
          <SidebarMenu className="gap-0">
            {visibleNavItems.map((item, index) => {
              /**
               * ─────────────────────────────
               * SECTION WITH CHILDREN
               * ─────────────────────────────
               */
              if (item.children?.length) {
                const hasActiveChild = item.children.some(
                  (child) => pathname === child.href,
                );

                return (
                  <SidebarMenuItem
                    key={item.href}
                    className={cn(
                      "group/section mb-5",
                      index === 0 && "mt-1",
                    )}
                  >
                    {/* Section heading */}

                    <div
                      className={cn(
                        "mb-1.5 flex items-center gap-2 px-3",
                        "text-[10px] font-semibold uppercase",
                        "tracking-[0.12em]",
                        "text-muted-foreground/70",
                        "transition-colors duration-200",
                        hasActiveChild &&
                          "text-muted-foreground",
                      )}
                    >
                      <span>{item.label}</span>

                      <div className="h-px flex-1 bg-border/60" />
                    </div>

                    {/* Always-visible children */}

                    <div className="space-y-0.5">
                      {item.children.map((child) => {
                        const isActive =
                          pathname === child.href;

                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              "group/item relative flex h-9",
                              "items-center gap-3",
                              "rounded-md px-3",
                              "text-sm",
                              "transition-all duration-200",
                              "hover:bg-accent",
                              "hover:text-accent-foreground",

                              isActive
                                ? "bg-accent text-accent-foreground font-medium"
                                : "text-muted-foreground",
                            )}
                          >
                            {/* Active indicator */}

                            <span
                              className={cn(
                                "absolute left-0 top-1/2",
                                "h-5 w-0.5 -translate-y-1/2",
                                "rounded-full bg-primary",
                                "transition-all duration-200",
                                isActive
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />

                            <child.icon
                              className={cn(
                                "h-4 w-4 shrink-0",
                                "transition-transform duration-200",
                                "group-hover/item:scale-105",
                              )}
                            />

                            <span className="truncate">
                              {child.label}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </SidebarMenuItem>
                );
              }

              /**
               * ─────────────────────────────
               * NORMAL TOP-LEVEL ITEM
               * ─────────────────────────────
               */

              const isActive =
                pathname === item.href;

              return (
                <SidebarMenuItem
                  key={item.href}
                  className="mb-1"
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "group/item relative flex h-9",
                      "items-center gap-3",
                      "rounded-md px-3",
                      "text-sm",
                      "transition-all duration-200",
                      "hover:bg-accent",
                      "hover:text-accent-foreground",

                      isActive
                        ? "bg-accent text-accent-foreground font-medium"
                        : "text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute left-0 top-1/2",
                        "h-5 w-0.5 -translate-y-1/2",
                        "rounded-full bg-primary",
                        "transition-all duration-200",
                        isActive
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />

                    <item.icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        "transition-transform duration-200",
                        "group-hover/item:scale-105",
                      )}
                    />

                    <span className="truncate">
                      {item.label}
                    </span>
                  </Link>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* ───────────────── FOOTER ───────────────── */}

      <SidebarFooter className="border-t border-border p-3">
        {user ? (
          <div
            className={cn(
              "flex items-center gap-3 rounded-md p-2",
              "transition-colors duration-200",
              "hover:bg-accent",
            )}
          >
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center",
                "rounded-full bg-primary/10",
                "text-sm font-semibold text-primary",
                "ring-1 ring-primary/20",
              )}
            >
              {getInitials(user.name || user.email)}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {user.name || "My Account"}
              </p>

              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-md p-2">
            <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-muted" />

            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-3.5 w-24 animate-pulse rounded bg-muted" />
              <div className="h-3 w-32 animate-pulse rounded bg-muted" />
            </div>
          </div>
        )}

        <div className="mt-2">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={cn(
              "flex h-9 w-full items-center gap-3",
              "rounded-md px-3",
              "text-sm text-muted-foreground",
              "transition-colors duration-200",
              "hover:bg-destructive/10",
              "hover:text-destructive",
              "disabled:pointer-events-none",
              "disabled:opacity-50",
            )}
          >
            {isLoggingOut ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4 shrink-0" />
            )}

            <span>Log out</span>
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
