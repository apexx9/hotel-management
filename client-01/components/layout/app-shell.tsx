import { AppSidebar } from "../app-sidebar";
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import Topbar from "./topbar";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({
  children,
}: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <SidebarProvider>
            <AppSidebar />
            <main className="w-full">
              <div className="flex h-16 items-center border-b px-4">
                <SidebarTrigger />
                {/* Your header content */}
              </div>
              {children}
            </main>
          </SidebarProvider>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />

        <main className="min-h-0 flex-1 overflow-y-auto bg-[#fafafa]">
          {children}
        </main>
      </div>
    </div>
  );
}
