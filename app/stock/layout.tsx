import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

export default function StocksLayout({
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
