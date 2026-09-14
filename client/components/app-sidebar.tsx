"use client";

import { useState } from "react";
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
   * Filter navigation according to the
   * authenticated user's role.
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

      /**
       * Hide empty navigation groups.
       */
      if (item.children && item.children.length === 0) {
        return false;
      }

      return true;
    });

  /**
   * Expand the sidebar when the mouse enters
   * while it is collapsed.
   */
  const handleMouseEnterSidebar = () => {
    if (!isMobile && isCollapsed && !locked) {
      setOpen(true);
    }
  };

  /**
   * Collapse the sidebar when the mouse leaves,
   * unless it has been locked open.
   */
  const handleMouseLeaveSidebar = () => {
    if (!isMobile && !locked) {
      setOpen(false);
    }
  };

  /**
   * Lock/unlock the sidebar.
   */
  const toggleLock = () => {
    const nextLocked = !locked;

    setLocked(nextLocked);

    if (nextLocked) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  /**
   * Logout.
   */
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
   * ============================================================
   * COLLAPSED SIDEBAR
   * ============================================================
   */

  if (isCollapsed) {
    return (
      <Sidebar
        collapsible="icon"
        onMouseEnter={handleMouseEnterSidebar}
        onMouseLeave={handleMouseLeaveSidebar}
        className="border-r shadow-sm"
      >
        {/* ======================================================
            LOGO
        ====================================================== */}

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

        {/* ======================================================
            COLLAPSED NAVIGATION
        ====================================================== */}

        <SidebarContent className="px-2 py-3">
          <SidebarGroup className="p-0">
            <SidebarMenu className="gap-1">
              {visibleNavItems.map((item) => {
                /**
                 * Groups:
                 *
                 * When collapsed, we show all children as
                 * individual icon buttons.
                 */
                if (item.children?.length) {
                  return item.children.map((child) => {
                    const isActive = pathname === child.href;

                    return (
                      <SidebarMenuItem key={child.href}>
                        <Tooltip>
                          <TooltipTrigger
                            aria-label={child.label}
                            className={cn(
                              "flex h-9 w-9 items-center justify-center",
                              "rounded-md",
                              "transition-all duration-200",
                              "hover:bg-accent",
                              "hover:text-accent-foreground",
                              isActive
                                ? "bg-accent text-accent-foreground"
                                : "text-muted-foreground",
                            )}
                            onClick={() =>
                              router.push(child.href)
                            }
                          >
                            <child.icon
                              className={cn(
                                "h-4 w-4 shrink-0",
                                "transition-transform duration-200",
                              )}
                            />
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

                /**
                 * Normal top-level item.
                 */

                const isActive = pathname === item.href;

                return (
                  <SidebarMenuItem key={item.href}>
                    <Tooltip>
                      <TooltipTrigger
                        aria-label={item.label}
                        className={cn(
                          "flex h-9 w-9 items-center justify-center",
                          "rounded-md",
                          "transition-all duration-200",
                          "hover:bg-accent",
                          "hover:text-accent-foreground",
                          isActive
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground",
                        )}
                        onClick={() =>
                          router.push(item.href)
                        }
                      >
                        <item.icon
                          className="h-4 w-4 shrink-0"
                        />
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

        {/* ======================================================
            COLLAPSED FOOTER
        ====================================================== */}

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

                <TooltipContent
                  side="right"
                  align="center"
                >
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
              <TooltipTrigger
                aria-label="Log out"
                className={cn(
                  "flex h-9 w-9 items-center justify-center",
                  "rounded-md text-muted-foreground",
                  "transition-colors duration-200",
                  "hover:bg-destructive/10",
                  "hover:text-destructive",
                )}
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
              </TooltipTrigger>

              <TooltipContent
                side="right"
                align="center"
              >
                Log out
              </TooltipContent>
            </Tooltip>
          </div>
        </SidebarFooter>
      </Sidebar>
    );
  }

  /**
   * ============================================================
   * EXPANDED SIDEBAR
   * ============================================================
   */

  return (
    <Sidebar
      collapsible="icon"
      onMouseEnter={handleMouseEnterSidebar}
      onMouseLeave={handleMouseLeaveSidebar}
      className="border-r shadow-sm"
    >
      {/* ========================================================
          HEADER
      ======================================================== */}

      <SidebarHeader className="px-4 pb-3 pt-4">
        <div className="flex items-center gap-3">
          {/* Logo */}

          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center",
              "rounded-lg bg-primary text-primary-foreground",
              "shadow-sm",
            )}
          >
            <Building2 className="h-5 w-5" />
          </div>

          {/* Brand */}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold leading-tight">
              Hotel Manager
            </p>

            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              Admin Portal
            </p>
          </div>

          {/* Lock */}

          <button
            type="button"
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
              locked &&
                "bg-accent text-foreground",
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

      {/* ========================================================
          NAVIGATION
      ======================================================== */}

      <SidebarContent className="px-3 py-2">
        <SidebarGroup className="p-0">
          <SidebarMenu className="gap-0">
            {visibleNavItems.map((item, index) => {
              /**
               * ==================================================
               * NAVIGATION GROUP
               * ==================================================
               *
               * Parent items with children are now section
               * headings.
               *
               * They NEVER collapse.
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
                    {/* ------------------------------------------
                        SECTION HEADING
                    ------------------------------------------ */}

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

                    {/* ------------------------------------------
                        ALWAYS VISIBLE CHILDREN
                    ------------------------------------------ */}

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
                                "h-5 w-0.5",
                                "-translate-y-1/2",
                                "rounded-full bg-primary",
                                "transition-all duration-200",
                                isActive
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />

                            {/* Icon */}

                            <child.icon
                              className={cn(
                                "h-4 w-4 shrink-0",
                                "transition-transform duration-200",
                                "group-hover/item:scale-105",
                              )}
                            />

                            {/* Label */}

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
               * ==================================================
               * NORMAL TOP LEVEL ITEM
               * ==================================================
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
                    {/* Active indicator */}

                    <span
                      className={cn(
                        "absolute left-0 top-1/2",
                        "h-5 w-0.5",
                        "-translate-y-1/2",
                        "rounded-full bg-primary",
                        "transition-all duration-200",
                        isActive
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />

                    {/* Icon */}

                    <item.icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        "transition-transform duration-200",
                        "group-hover/item:scale-105",
                      )}
                    />

                    {/* Label */}

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

      {/* ========================================================
          FOOTER
      ======================================================== */}

      <SidebarFooter className="border-t border-border p-3">
        {/* ------------------------------------------------------
            USER
        ------------------------------------------------------ */}

        {user ? (
          <div
            className={cn(
              "flex items-center gap-3 rounded-md p-2",
              "transition-colors duration-200",
              "hover:bg-accent",
            )}
          >
            {/* Avatar */}

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

            {/* User information */}

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

        {/* ------------------------------------------------------
            LOGOUT
        ------------------------------------------------------ */}

        <div className="mt-2">
          <button
            type="button"
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
