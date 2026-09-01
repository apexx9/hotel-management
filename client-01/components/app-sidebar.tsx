// components/app-sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ChevronRight,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  User,
  Sparkles,
} from 'lucide-react';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import AuthService from '@/services/auth.service';
import { navItems, type NavItem } from '@/utils/nav-items';
import { toast } from 'sonner';

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  // Auto-open parent menu of active route
  useEffect(() => {
    navItems.forEach((item) => {
      if (item.children?.some((child) => pathname.startsWith(child.href))) {
        setOpenMenus((prev) => ({ ...prev, [item.href]: true }));
      }
    });
  }, [pathname]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  const handleLogout = async () => {
    try {
      await AuthService().logout();
      toast.success('Logged out');
      router.push('/login');
    } catch {
      toast.error('Logout failed');
    }
  };

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-slate-800 bg-slate-900 text-slate-100"
    >
      {/* Header: Brand & logo */}
      <SidebarHeader className="border-b border-slate-800">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/dashboard" />}
              className="data-[active=true]:bg-transparent hover:bg-slate-800/60"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-lg shadow-indigo-500/20">
                H
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Hotel HMS</span>
                <span className="truncate text-xs text-slate-400">
                  Management
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Content: Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-500">
            Main Menu
          </SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => {
              const hasChildren = !!item.children?.length;
              const isParentActive =
                isActive(item.href) ||
                item.children?.some((child) => isActive(child.href));

              if (hasChildren) {
                return (
                  <Collapsible
                    key={item.href}
                    open={openMenus[item.href]}
                    onOpenChange={(open) =>
                      setOpenMenus((prev) => ({ ...prev, [item.href]: open }))
                    }
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={item.label}
                          isActive={isParentActive}
                          className={cn(
                            'text-slate-400 hover:bg-slate-800/60 hover:text-white',
                            isParentActive &&
                              'bg-slate-800/80 text-white data-[active=true]:bg-slate-800/80 data-[active=true]:text-white'
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                          <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.children.map((child) => (
                            <SidebarMenuSubItem key={child.href}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isActive(child.href)}
                                onClick={() => setOpenMobile(false)}
                                className={cn(
                                  'text-slate-400 hover:bg-slate-800/60 hover:text-white',
                                  isActive(child.href) &&
                                    'bg-indigo-500/10 text-indigo-400 data-[active=true]:bg-indigo-500/10 data-[active=true]:text-indigo-400'
                                )}
                              >
                                <Link href={child.href}>
                                  <child.icon className="h-4 w-4" />
                                  <span>{child.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              }

              // Single item
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.label}
                    isActive={isActive(item.href)}
                    onClick={() => setOpenMobile(false)}
                    className={cn(
                      'text-slate-400 hover:bg-slate-800/60 hover:text-white',
                      isActive(item.href) &&
                        'bg-indigo-500/10 text-indigo-400 data-[active=true]:bg-indigo-500/10 data-[active=true]:text-indigo-400'
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>

        {/* Optional upgrade card (visible only when expanded) */}
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel className="text-slate-500">
            Extras
          </SidebarGroupLabel>
          <div className="mx-3 rounded-lg bg-gradient-to-r from-indigo-500/20 to-purple-500/20 p-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-medium text-indigo-200">
                Upgrade to Pro
              </span>
            </div>
            <p className="mt-1 text-[10px] text-slate-400">
              Unlock advanced features and reporting.
            </p>
            <button className="mt-2 w-full rounded-md bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700">
              Upgrade
            </button>
          </div>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer: User & Logout */}
      <SidebarFooter className="border-t border-slate-800">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="text-slate-400 hover:bg-slate-800 hover:text-white data-[state=open]:bg-slate-800 data-[state=open]:text-white"
                >
                  <Avatar className="h-8 w-8 border border-slate-700">
                    <AvatarImage src="/avatars/admin.png" />
                    <AvatarFallback className="bg-indigo-600 text-white">
                      AN
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium text-white">
                      Aaron Nartey
                    </span>
                    <span className="truncate text-xs text-slate-400">
                      Administrator
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="right"
                align="end"
                className="w-56 border-slate-700 bg-slate-800 text-slate-100"
              >
                <DropdownMenuLabel className="text-slate-300">
                  My Account
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem className="hover:bg-slate-700 hover:text-white">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-slate-700 hover:text-white">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Optional rail for desktop drag/expand */}
      <SidebarRail />
    </Sidebar>
  );
}
