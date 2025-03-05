"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  return (
    <div className="space-y-1">
      {items.map((item) => (
        <div key={item.title} className="space-y-1">
          <div
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
              item.isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {item.icon && <item.icon className="h-4 w-4" />}
            <a href={item.url}>{item.title}</a>
            {item.items && <ChevronRight className={cn("ml-auto h-4 w-4", item.isActive && "rotate-90")} />}
          </div>

          {item.items && item.isActive && (
            <div className="ml-4 space-y-1">
              {item.items.map((subItem) => (
                <a
                  key={subItem.title}
                  href={subItem.url}
                  className="block rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  {subItem.title}
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
