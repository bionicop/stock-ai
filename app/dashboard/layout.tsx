import type { Metadata } from "next";
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

export const metadata: Metadata = {
  title: "AI Stock Market: Dashboard",
  description: "",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="grid grid-cols-[auto,1fr] min-h-screen w-full">
        <AppSidebar />
        <main className="flex flex-col w-full">
          <div className="flex-1 overflow-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
