"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ChevronRight,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import AuthService from "@/services/auth.service";
import {
  navigationSections,
  NavigationItem,
} from "@/utils/hms.data";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  isDesktop: boolean;
}

export default function Sidebar({
  isOpen,
  onClose,
  isExpanded,
  setIsExpanded,
  isDesktop,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  /*
   * openItems controls which parent navigation groups
   * have their children visible.
   */
  const [openItems, setOpenItems] = useState<
    Record<string, boolean>
  >({
    "/front-desk": pathname.startsWith("/front-desk"),
  });

  /*
   * A hover expansion is only a preview.
   *
   * Once the user explicitly clicks the sidebar's
   * expand/collapse control, it becomes locked.
   */
  const [isLocked, setIsLocked] = useState(false);

  /*
   * Desktop:
   *
   * - locked + expanded => expanded
   * - hover => expanded preview
   * - otherwise => collapsed
   *
   * Mobile:
   *
   * - controlled entirely by isOpen
   */
  const [isHovered, setIsHovered] = useState(false);

  const desktopExpanded =
    isDesktop && (isLocked ? isExpanded : isHovered);

  const showLabels = isDesktop
    ? desktopExpanded
    : isOpen;

  /*
   * When the parent component changes isExpanded
   * externally, respect that state.
   *
   * This also allows the existing sidebar state
   * architecture to continue working.
   */
  useEffect(() => {
    if (!isDesktop) {
      return;
    }

    if (isLocked) {
      return;
    }

    if (isHovered) {
      setIsExpanded(true);
    } else {
      setIsExpanded(false);
    }
  }, [
    isDesktop,
    isHovered,
    isLocked,
    setIsExpanded,
  ]);

  /*
   * Keep the currently active parent open.
   */
  useEffect(() => {
    navigationSections.forEach((section) => {
      section.items.forEach((item) => {
        if (!item.children?.length) {
          return;
        }

        const childIsActive =
          item.children.some((child) =>
            isItemActive(child),
          );

        if (childIsActive) {
          setOpenItems((current) => ({
            ...current,
            [item.href]: true,
          }));
        }
      });
    });
  }, [pathname]);

  const getErrorMessage = (error: unknown) =>
    error instanceof Error
      ? error.message
      : "Unable to logout. Please try again.";

  const handleLogout = async () => {
    try {
      await AuthService().logout();

      toast.success("Logged out successfully");

      router.push("/login");
      router.refresh();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  };

  const isItemActive = (item: NavigationItem) => {
    if (pathname === item.href) {
      return true;
    }

    if (
      item.href !== "/dashboard" &&
      pathname.startsWith(`${item.href}/`)
    ) {
      return true;
    }

    return false;
  };

  const hasActiveChild = (item: NavigationItem) => {
    return (
      item.children?.some((child) =>
        isItemActive(child),
      ) ?? false
    );
  };

  const toggleItem = (href: string) => {
    setOpenItems((current) => ({
      ...current,
      [href]: !current[href],
    }));
  };

  /*
   * Desktop sidebar interaction:
   *
   * Hovering previews the expanded state.
   *
   * Clicking the expand/collapse control locks the
   * sidebar in its current state.
   */
  const handleMouseEnter = () => {
    if (!isDesktop || isLocked) {
      return;
    }

    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (!isDesktop || isLocked) {
      return;
    }

    setIsHovered(false);
  };

  const handleToggleLock = () => {
    if (!isDesktop) {
      return;
    }

    /*
     * If currently collapsed, explicitly opening it
     * means "keep this open".
     */
    if (!isExpanded) {
      setIsExpanded(true);
      setIsLocked(true);
      setIsHovered(false);
      return;
    }

    /*
     * If currently expanded, explicitly collapsing it
     * means "keep this collapsed".
     */
    setIsExpanded(false);
    setIsLocked(false);
    setIsHovered(false);
  };

  /*
   * Parent navigation behavior.
   *
   * If collapsed:
   *   1. Expand
   *   2. Open the submenu
   *
   * This fixes the old "dead first click" behavior.
   */
  const handleParentClick = (
    item: NavigationItem,
    currentlyOpen: boolean,
  ) => {
    if (!showLabels) {
      if (isDesktop) {
        setIsExpanded(true);
        setIsLocked(true);
      }

      setOpenItems((current) => ({
        ...current,
        [item.href]: true,
      }));

      return;
    }

    toggleItem(item.href);
  };

  return (
    <>
      {/* =====================================================
          MOBILE BACKDROP
      ===================================================== */}
      {!isDesktop && isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}
      <motion.aside
        initial={false}
        animate={{
          width: isDesktop
            ? desktopExpanded
              ? 248
              : 80
            : 280,

          x: isDesktop
            ? 0
            : isOpen
              ? 0
              : -280,
        }}
        transition={{
          width: {
            duration: 0.24,
            ease: [0.22, 1, 0.36, 1],
          },
          x: {
            duration: 0.28,
            ease: [0.22, 1, 0.36, 1],
          },
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="fixed left-0 top-0 z-50 flex h-screen flex-col overflow-hidden border-r border-white/10 bg-[#0C0332] text-white"
      >
        {/* =====================================================
            BRAND
        ===================================================== */}
        <div className="flex h-16 shrink-0 items-center border-b border-white/10 px-5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-[#1900FF]">
            <div className="h-2.5 w-2.5 rounded-[1px] bg-white" />
          </div>

          <AnimatePresence initial={false}>
            {showLabels && (
              <motion.div
                key="brand-label"
                initial={{
                  opacity: 0,
                  x: -8,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                exit={{
                  opacity: 0,
                  x: -6,
                }}
                transition={{
                  duration: 0.16,
                  ease: "easeOut",
                }}
                className="ml-4 min-w-0 overflow-hidden whitespace-nowrap"
              >
                <p className="text-[12px] font-bold uppercase tracking-[0.18em]">
                  Hotel HMS
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Desktop expand/collapse control */}
          {isDesktop && showLabels && (
            <motion.button
              type="button"
              initial={{
                opacity: 0,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              transition={{
                duration: 0.15,
                delay: 0.04,
              }}
              onClick={handleToggleLock}
              aria-label={
                isLocked
                  ? "Collapse sidebar"
                  : "Lock sidebar open"
              }
              className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-[#77718F] transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              {isLocked ? (
                <PanelLeftClose size={17} />
              ) : (
                <PanelLeftOpen size={17} />
              )}
            </motion.button>
          )}
        </div>

        {/* =====================================================
            NAVIGATION
        ===================================================== */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-6">
          <nav className="space-y-6">
            {navigationSections.map((section) => (
              <div key={section.label}>
                {/* Section heading */}
                <AnimatePresence initial={false}>
                  {showLabels && (
                    <motion.div
                      key={`${section.label}-heading`}
                      initial={{
                        opacity: 0,
                        height: 0,
                        marginBottom: 0,
                      }}
                      animate={{
                        opacity: 1,
                        height: 16,
                        marginBottom: 8,
                      }}
                      exit={{
                        opacity: 0,
                        height: 0,
                        marginBottom: 0,
                      }}
                      transition={{
                        duration: 0.16,
                        ease: "easeOut",
                      }}
                      className="flex items-end overflow-hidden px-3"
                    >
                      <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.18em] text-[#77718F]">
                        {section.label}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-1">
                  {section.items.map((item) => {
                    const active =
                      isItemActive(item);

                    const childActive =
                      hasActiveChild(item);

                    const itemIsOpen =
                      openItems[item.href] ?? false;

                    const Icon = item.icon;

                    const hasChildren =
                      Boolean(
                        item.children?.length,
                      );

                    /* =================================================
                       PARENT WITH CHILDREN
                    ================================================= */
                    if (hasChildren) {
                      return (
                        <div key={item.href}>
                          <button
                            type="button"
                            onClick={() =>
                              handleParentClick(
                                item,
                                itemIsOpen,
                              )
                            }
                            className={`
                              group relative flex h-11 w-full
                              items-center rounded-md px-3
                              text-left transition-colors
                              duration-200
                              ${
                                childActive ||
                                active
                                  ? "text-white"
                                  : "text-[#AAA5C0] hover:bg-white/[0.06] hover:text-white"
                              }
                            `}
                          >
                            <Icon
                              size={19}
                              strokeWidth={
                                childActive ||
                                active
                                  ? 2.3
                                  : 1.9
                              }
                              className="shrink-0"
                            />

                            <AnimatePresence
                              initial={false}
                            >
                              {showLabels && (
                                <motion.span
                                  key={`${item.href}-label`}
                                  initial={{
                                    opacity: 0,
                                    x: -6,
                                  }}
                                  animate={{
                                    opacity: 1,
                                    x: 0,
                                  }}
                                  exit={{
                                    opacity: 0,
                                    x: -6,
                                  }}
                                  transition={{
                                    duration: 0.16,
                                    ease: "easeOut",
                                  }}
                                  className="ml-4 whitespace-nowrap text-[13px] font-medium"
                                >
                                  {item.label}
                                </motion.span>
                              )}
                            </AnimatePresence>

                            {showLabels && (
                              <motion.span
                                animate={{
                                  rotate: itemIsOpen
                                    ? 90
                                    : 0,
                                }}
                                transition={{
                                  duration: 0.18,
                                  ease: "easeOut",
                                }}
                                className="ml-auto"
                              >
                                <ChevronRight
                                  size={15}
                                  strokeWidth={1.8}
                                />
                              </motion.span>
                            )}

                            {childActive &&
                              showLabels && (
                                <span className="absolute right-9 h-1.5 w-1.5 rounded-full bg-[#1900FF]" />
                              )}
                          </button>

                          {/* =================================================
                              CHILD NAVIGATION
                          ================================================= */}
                          <AnimatePresence initial={false}>
                            {showLabels &&
                              itemIsOpen && (
                                <motion.div
                                  key={`${item.href}-children`}
                                  initial={{
                                    height: 0,
                                    opacity: 0,
                                  }}
                                  animate={{
                                    height: "auto",
                                    opacity: 1,
                                  }}
                                  exit={{
                                    height: 0,
                                    opacity: 0,
                                  }}
                                  transition={{
                                    height: {
                                      duration: 0.2,
                                      ease: [
                                        0.22,
                                        1,
                                        0.36,
                                        1,
                                      ],
                                    },
                                    opacity: {
                                      duration: 0.12,
                                    },
                                  }}
                                  className="overflow-hidden"
                                >
                                  <div className="relative ml-5 mt-1 space-y-1 border-l border-white/10 pl-3">
                                    {item.children?.map(
                                      (child) => {
                                        const childIsActive =
                                          isItemActive(
                                            child,
                                          );

                                        const ChildIcon =
                                          child.icon;

                                        return (
                                          <Link
                                            key={
                                              child.href
                                            }
                                            href={
                                              child.href
                                            }
                                            onClick={() => {
                                              if (
                                                !isDesktop
                                              ) {
                                                onClose();
                                              }
                                            }}
                                            className={`
                                              flex h-9 items-center
                                              rounded-md px-3
                                              text-[12px]
                                              transition-colors
                                              duration-200
                                              ${
                                                childIsActive
                                                  ? "bg-[#1900FF]/15 text-white"
                                                  : "text-[#77718F] hover:bg-white/[0.05] hover:text-[#AAA5C0]"
                                              }
                                            `}
                                          >
                                            <ChildIcon
                                              size={15}
                                              strokeWidth={
                                                childIsActive
                                                  ? 2.2
                                                  : 1.8
                                              }
                                              className="shrink-0"
                                            />

                                            <span className="ml-3 whitespace-nowrap">
                                              {
                                                child.label
                                              }
                                            </span>

                                            {childIsActive && (
                                              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#1900FF]" />
                                            )}
                                          </Link>
                                        );
                                      },
                                    )}
                                  </div>
                                </motion.div>
                              )}
                          </AnimatePresence>
                        </div>
                      );
                    }

                    /* =================================================
                       NORMAL NAVIGATION ITEM
                    ================================================= */
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => {
                          if (!isDesktop) {
                            onClose();
                          }
                        }}
                        className="group relative block"
                      >
                        <motion.div
                          whileHover={{
                            x: showLabels ? 2 : 0,
                          }}
                          transition={{
                            duration: 0.16,
                            ease: "easeOut",
                          }}
                          className={`
                            relative flex h-11 items-center
                            rounded-md px-3
                            transition-colors duration-200
                            ${
                              active
                                ? "bg-[#1900FF] text-white"
                                : "text-[#AAA5C0] hover:bg-white/[0.06] hover:text-white"
                            }
                          `}
                        >
                          <Icon
                            size={19}
                            strokeWidth={
                              active ? 2.4 : 1.9
                            }
                            className="shrink-0"
                          />

                          <AnimatePresence
                            initial={false}
                          >
                            {showLabels && (
                              <motion.span
                                key={`${item.href}-label`}
                                initial={{
                                  opacity: 0,
                                  x: -6,
                                }}
                                animate={{
                                  opacity: 1,
                                  x: 0,
                                }}
                                exit={{
                                  opacity: 0,
                                  x: -6,
                                }}
                                transition={{
                                  duration: 0.16,
                                  ease: "easeOut",
                                }}
                                className="ml-4 whitespace-nowrap text-[13px] font-medium"
                              >
                                {item.label}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* =====================================================
            USER / LOGOUT
        ===================================================== */}
        <div className="shrink-0 space-y-1 border-t border-white/10 bg-[#090226] p-3">
          <div className="flex h-12 items-center overflow-hidden rounded-md px-2 transition-colors duration-200 hover:bg-white/[0.06]">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1900FF] text-[11px] font-bold text-white">
              AN
            </div>

            <AnimatePresence initial={false}>
              {showLabels && (
                <motion.div
                  key="user-info"
                  initial={{
                    opacity: 0,
                    x: -8,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  exit={{
                    opacity: 0,
                    x: -8,
                  }}
                  transition={{
                    duration: 0.16,
                    ease: "easeOut",
                  }}
                  className="ml-3 min-w-0 whitespace-nowrap"
                >
                  <p className="truncate text-[12px] font-semibold text-white">
                    Aaron Nartey
                  </p>

                  <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-[#77718F]">
                    Administrator
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex h-11 w-full cursor-pointer items-center rounded-md px-3 text-left text-[#AAA5C0] transition-colors duration-200 hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut
              size={19}
              className="shrink-0"
            />

            <AnimatePresence initial={false}>
              {showLabels && (
                <motion.span
                  key="logout-label"
                  initial={{
                    opacity: 0,
                    x: -6,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  exit={{
                    opacity: 0,
                    x: -6,
                  }}
                  transition={{
                    duration: 0.16,
                    ease: "easeOut",
                  }}
                  className="ml-4 whitespace-nowrap text-[13px] font-medium"
                >
                  Log Out
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
