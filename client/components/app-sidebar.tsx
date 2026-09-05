"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronRight,
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
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
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

  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());
  const [pinnedMenus, setPinnedMenus] = useState<Set<string>>(new Set());
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

  // Refs for hover-intent timers
  const openTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const closeTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const clearOpenTimeout = (href: string) => {
    const timeout = openTimeouts.current.get(href);
    if (timeout) {
      clearTimeout(timeout);
      openTimeouts.current.delete(href);
    }
  };

  const clearCloseTimeout = (href: string) => {
    const timeout = closeTimeouts.current.get(href);
    if (timeout) {
      clearTimeout(timeout);
      closeTimeouts.current.delete(href);
    }
  };

  const openSubmenu = useCallback(
    (href: string) => {
      // Cancel any pending close for this href
      clearCloseTimeout(href);

      // Clear any pending open for this href (avoid duplicates)
      clearOpenTimeout(href);

      // Schedule open after 120ms
      const timeout = setTimeout(() => {
        setOpenMenus((prev) => {
          const newOpen = new Set([...pinnedMenus]);
          newOpen.add(href);
          return newOpen;
        });
        openTimeouts.current.delete(href);
      }, 120);

      openTimeouts.current.set(href, timeout);
    },
    [pinnedMenus],
  );

  const closeSubmenu = useCallback(
    (href: string) => {
      // Cancel any pending open for this href
      clearOpenTimeout(href);

      // If pinned, don't close
      if (pinnedMenus.has(href)) return;

      // Cancel any existing close timeout
      clearCloseTimeout(href);

      // Schedule close after 300ms
      const timeout = setTimeout(() => {
        setOpenMenus((prev) => {
          const next = new Set(prev);
          next.delete(href);
          return next;
        });
        closeTimeouts.current.delete(href);
      }, 300);

      closeTimeouts.current.set(href, timeout);
    },
    [pinnedMenus],
  );

  const togglePin = useCallback((href: string) => {
    setPinnedMenus((prev) => {
      const next = new Set(prev);
      if (next.has(href)) next.delete(href);
      else next.add(href);
      return next;
    });
    setOpenMenus((prev) => new Set(prev).add(href));
  }, []);

  const handleMouseEnterSidebar = () => {
    if (!isMobile && isCollapsed && !locked) setOpen(true);
  };

  const handleMouseLeaveSidebar = () => {
    if (!isMobile && !locked && pinnedMenus.size === 0) {
      setOpen(false);
      setOpenMenus(new Set());
      openTimeouts.current.forEach((timeout) => clearTimeout(timeout));
      closeTimeouts.current.forEach((timeout) => clearTimeout(timeout));
      openTimeouts.current.clear();
      closeTimeouts.current.clear();
    }
  };

  const toggleLock = () => {
    const nextLocked = !locked;
    setLocked(nextLocked);
    if (nextLocked) {
      setOpen(true);
    } else {
      if (pinnedMenus.size === 0) {
        setOpen(false);
        setOpenMenus(new Set());
      }
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

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      openTimeouts.current.forEach((timeout) => clearTimeout(timeout));
      closeTimeouts.current.forEach((timeout) => clearTimeout(timeout));
      openTimeouts.current.clear();
      closeTimeouts.current.clear();
    };
  }, []);

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

            return (
              <button
                key={item.href}
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
              </button>
            );
          })}
        </SidebarContent>

        <SidebarFooter className="flex flex-col items-center gap-2 border-t border-border py-3 px-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-1 ring-primary/20">
            {getInitials(user?.name || user?.email)}
          </div>
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
          <SidebarMenu className="space-y-1">
            {visibleNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.children &&
                  item.children.some((child) => pathname === child.href));

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

              const isOpen = openMenus.has(item.href);

              return (
                <SidebarMenuItem
                  key={item.href}
                  onMouseEnter={() => openSubmenu(item.href)}
                  onMouseLeave={() => closeSubmenu(item.href)}
                >
                  <SidebarMenuButton
                    isActive={isActive}
                    tooltip={item.label}
                    onClick={() => togglePin(item.href)}
                    className={cn(
                      "rounded-md transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground font-medium"
                        : "hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    <ChevronRight
                      className={cn(
                        "ml-auto h-4 w-4 shrink-0 transition-transform duration-200",
                        isOpen && "rotate-90",
                      )}
                    />
                  </SidebarMenuButton>

                  <div
                    className="grid transition-[grid-template-rows] duration-200 ease-in-out"
                    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <SidebarMenuSub className="mt-1 ml-4 border-l border-border pl-2 space-y-1">
                        {item.children.map((child) => {
                          const childActive = pathname === child.href;
                          return (
                            <SidebarMenuSubItem key={child.href}>
                              <Link
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
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </div>
                  </div>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-3">
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
