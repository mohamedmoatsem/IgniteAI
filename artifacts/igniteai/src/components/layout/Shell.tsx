import { useState } from "react"
import { Link, useLocation } from "wouter"
import { LayoutDashboard, Code2, FileUp, Flame, Globe, Briefcase, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage, SUPPORTED_LANGUAGES, type LanguageSetting } from "@/lib/i18n"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

interface ShellProps {
  children: React.ReactNode
}

export function Shell({ children }: ShellProps) {
  const [location] = useLocation()
  const { setting, setSetting, t, dir } = useLanguage()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const navItems = [
    { href: "/",              label: t("nav.jumpstart"),    icon: LayoutDashboard },
    { href: "/livelab",       label: t("nav.livelab"),      icon: Code2 },
    { href: "/asset-reviver", label: t("nav.assetReviver"), icon: FileUp },
    { href: "/career",        label: t("nav.career"),       icon: Briefcase },
  ]

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {navItems.map((item) => {
        const isActive = location === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors font-medium",
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
    </>
  )

  const LanguageSelect = () => (
    <Select value={setting} onValueChange={(v) => setSetting(v as LanguageSetting)}>
      <SelectTrigger className="h-9 text-sm">
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
  )

  return (
    <div dir={dir} className="min-h-screen bg-background flex flex-col md:flex-row w-full font-sans text-foreground">
      {/* ── Mobile top bar ── */}
      <header className="md:hidden flex items-center justify-between px-4 h-14 border-b border-border bg-card shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-2 font-bold text-base tracking-tight">
          <Flame className="w-4 h-4 text-primary" />
          {t("nav.brand")}
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open navigation menu"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </Button>
      </header>

      {/* ── Mobile drawer ── */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side={dir === "rtl" ? "right" : "left"} className="w-72 flex flex-col p-0">
          <SheetHeader className="h-14 flex-row items-center px-5 border-b border-border shrink-0">
            <SheetTitle className="flex items-center gap-2 font-bold text-base tracking-tight flex-1">
              <Flame className="w-4 h-4 text-primary" />
              {t("nav.brand")}
            </SheetTitle>
            <SheetClose asChild>
              <Button variant="ghost" size="icon" className="-me-1" aria-label="Close menu">
                <X className="w-4 h-4" />
              </Button>
            </SheetClose>
          </SheetHeader>
          <nav className="flex flex-col gap-1 p-4 flex-1">
            <NavLinks onNavigate={() => setDrawerOpen(false)} />
          </nav>
          <div className="p-4 border-t border-border">
            <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
              <Globe className="w-3.5 h-3.5" />
              {t("nav.language")}
            </label>
            <LanguageSelect />
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-64 border-e border-border bg-card flex-col shrink-0 sticky top-0 h-screen">
        <div className="h-16 flex items-center px-6 border-b border-border font-bold text-lg tracking-tight">
          <Flame className="w-5 h-5 text-primary me-2" />
          {t("nav.brand")}
        </div>
        <nav className="p-4 flex flex-col gap-1">
          <NavLinks />
        </nav>
        <div className="mt-auto p-4 border-t border-border">
          <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
            <Globe className="w-3.5 h-3.5" />
            {t("nav.language")}
          </label>
          <LanguageSelect />
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
