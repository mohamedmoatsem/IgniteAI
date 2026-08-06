import { Link, useLocation } from "wouter"
import { LayoutDashboard, Code2, FileUp, Flame, Globe, Briefcase } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage, SUPPORTED_LANGUAGES, type LanguageSetting } from "@/lib/i18n"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ShellProps {
  children: React.ReactNode
}

export function Shell({ children }: ShellProps) {
  const [location] = useLocation()
  const { setting, setSetting, t, dir } = useLanguage()

  const navItems = [
    { href: "/", label: t("nav.jumpstart"), icon: LayoutDashboard },
    { href: "/livelab", label: t("nav.livelab"), icon: Code2 },
    { href: "/asset-reviver", label: t("nav.assetReviver"), icon: FileUp },
    { href: "/career", label: t("nav.career"), icon: Briefcase },
  ]

  return (
    <div dir={dir} className="min-h-screen bg-background flex flex-col md:flex-row w-full font-sans text-foreground">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-card flex flex-col shrink-0 sticky top-0 z-10 md:h-screen">
        <div className="h-16 flex items-center px-6 border-b border-border font-bold text-lg tracking-tight">
          <Flame className="w-5 h-5 text-primary mr-2" />
          {t("nav.brand")}
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
        <div className="mt-auto p-4 border-t border-border hidden md:block">
          <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
            <Globe className="w-3.5 h-3.5" />
            {t("nav.language")}
          </label>
          <Select value={setting} onValueChange={(v) => setSetting(v as LanguageSetting)}>
            <SelectTrigger className="h-9 text-sm" data-testid="select-language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">{t("nav.autoDetect")}</SelectItem>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.nativeLabel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="p-4 border-t border-border md:hidden">
          <Select value={setting} onValueChange={(v) => setSetting(v as LanguageSetting)}>
            <SelectTrigger className="h-9 text-sm" data-testid="select-language-mobile">
              <Globe className="w-3.5 h-3.5 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">{t("nav.autoDetect")}</SelectItem>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.nativeLabel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
