import { Link, useLocation } from "wouter"
import { LayoutDashboard, Code2, FileUp, Flame } from "lucide-react"
import { cn } from "@/lib/utils"

interface ShellProps {
  children: React.ReactNode
}

export function Shell({ children }: ShellProps) {
  const [location] = useLocation()

  const navItems = [
    { href: "/", label: "JumpStart", icon: LayoutDashboard },
    { href: "/livelab", label: "LiveLab", icon: Code2 },
    { href: "/asset-reviver", label: "Asset Reviver", icon: FileUp },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row w-full font-sans text-foreground">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-card flex flex-col shrink-0 sticky top-0 z-10 md:h-screen">
        <div className="h-16 flex items-center px-6 border-b border-border font-bold text-lg tracking-tight">
          <Flame className="w-5 h-5 text-primary mr-2" />
          IgniteAI
        </div>
        <nav className="p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible">
          {navItems.map((item) => {
            const isActive = location === item.href
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors whitespace-nowrap md:whitespace-normal font-medium",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
