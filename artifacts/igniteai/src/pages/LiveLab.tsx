import { useState, useEffect, useRef, useCallback } from "react"
import { useExplainCode } from "@workspace/api-client-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Code2, Send, Lightbulb, Sparkles, Terminal, X } from "lucide-react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import { PomodoroTimer } from "@/components/PomodoroTimer"
import { useLanguage } from "@/lib/i18n"
import ReactMarkdown from "react-markdown"

const LANGUAGES = ["javascript", "typescript", "python", "go", "rust", "java", "css", "html"]
const INACTIVITY_MS = 10 * 60 * 1000

const STUCK_TIPS = [
  "Try rubber-duck debugging: explain the problem line-by-line out loud.",
  "Sketch the data flow on paper — identify exactly where it diverges from expected.",
  "Write the simplest possible test that exposes the bug, then work backwards.",
  "Check boundary conditions: what happens at 0, negative values, or empty inputs?",
  "Search for the exact error message — someone has likely solved it already.",
]

export default function LiveLab() {
  const [code, setCode] = useState("")
  const [language, setLanguage] = useState("javascript")
  const [question, setQuestion] = useState("")
  const [hasExplained, setHasExplained] = useState(false)
  const [stuckTip, setStuckTip] = useState<string | null>(null)

  const { t, language: uiLanguage } = useLanguage()
  const explainCode = useExplainCode()

  const lastCodeChange = useRef(Date.now())
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null)

  const showStuckTip = useCallback(() => {
    const tip = STUCK_TIPS[Math.floor(Math.random() * STUCK_TIPS.length)]!
    setStuckTip(tip)
  }, [])

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    inactivityTimer.current = setTimeout(showStuckTip, INACTIVITY_MS)
  }, [showStuckTip])

  useEffect(() => {
    resetInactivityTimer()
    return () => { if (inactivityTimer.current) clearTimeout(inactivityTimer.current) }
  }, [resetInactivityTimer])

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value)
    lastCodeChange.current = Date.now()
    setStuckTip(null)
    resetInactivityTimer()
  }

  const handleExplain = () => {
    if (!code.trim()) return
    setHasExplained(true)
    explainCode.mutate({
      data: {
        code,
        programmingLanguage: language,
        question: question.trim() || undefined,
        uiLanguage: uiLanguage !== "en" ? uiLanguage : undefined,
      },
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleExplain()
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 md:px-6 py-3 flex flex-wrap items-center gap-3 justify-between shrink-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
            <Terminal className="w-5 h-5 text-primary" />
            {t("livelab.title")}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">{t("livelab.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Pomodoro */}
          <div className="border border-border rounded-lg px-3 py-1.5 bg-background">
            <PomodoroTimer />
          </div>
          {/* Language select */}
          <select value={language} onChange={(e) => setLanguage(e.target.value)}
            className="h-9 px-3 rounded-md border border-border bg-background text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary">
            {LANGUAGES.map(lang => (
              <option key={lang} value={lang}>{lang.charAt(0).toUpperCase() + lang.slice(1)}</option>
            ))}
          </select>
          <Button onClick={handleExplain} disabled={!code.trim() || explainCode.isPending} className="gap-2">
            <Sparkles className="w-4 h-4" />
            {t("livelab.explain")}
          </Button>
        </div>
      </div>

      {/* Stuck tip banner */}
      {stuckTip && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 px-4 py-2.5 flex items-start gap-3 text-sm text-amber-800 dark:text-amber-300 shrink-0">
          <Lightbulb className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="flex-1"><strong>{t("livelab.stuckTip")}</strong> {stuckTip}</span>
          <button onClick={() => setStuckTip(null)} className="shrink-0 opacity-60 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full">
          {/* Editor */}
          <Panel defaultSize={50} minSize={25} className="flex flex-col relative bg-[#0d0d0d] dark:bg-card">
            <div className="absolute top-2 right-2 text-xs font-mono text-muted-foreground bg-black/20 px-2 py-1 rounded-md pointer-events-none">
              editor
            </div>
            <textarea value={code} onChange={handleCodeChange} onKeyDown={handleKeyDown}
              placeholder={t("livelab.codePlaceholder")}
              className="flex-1 w-full p-6 font-mono text-sm bg-transparent text-[#e5e5e5] dark:text-foreground outline-none resize-none placeholder:text-muted-foreground/50"
              spellCheck={false} />
          </Panel>

          <PanelResizeHandle className="w-2 bg-border hover:bg-primary/50 transition-colors flex items-center justify-center cursor-col-resize group">
            <div className="w-1 h-8 rounded-full bg-muted-foreground/30 group-hover:bg-primary/80" />
          </PanelResizeHandle>

          {/* Explanation */}
          <Panel defaultSize={50} minSize={25} className="bg-muted/10 flex flex-col h-full border-l border-border">
            <div className="flex-1 overflow-y-auto p-6 flex flex-col">
              {!hasExplained ? (
                <div className="m-auto flex flex-col items-center text-muted-foreground max-w-xs text-center">
                  <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                    <Lightbulb className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{t("livelab.waitingTitle")}</h3>
                  <p className="text-sm mt-2">{t("livelab.waitingSubtitle")}</p>
                </div>
              ) : explainCode.isPending ? (
                <div className="flex flex-col gap-3 max-w-2xl">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-28 w-full mt-2" />
                </div>
              ) : explainCode.isError ? (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {t("livelab.explainError")}
                </div>
              ) : explainCode.data ? (
                <div className="prose prose-sm dark:prose-invert max-w-none font-sans">
                  <ReactMarkdown>{explainCode.data.explanation}</ReactMarkdown>
                </div>
              ) : null}
            </div>
            <div className="p-4 bg-card border-t border-border shrink-0 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
              <div className="flex gap-2 max-w-3xl mx-auto">
                <Input value={question} onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t("livelab.questionPlaceholder")}
                  className="bg-background shadow-sm border-border" />
                <Button onClick={handleExplain} disabled={!code.trim() || explainCode.isPending}
                  size="icon" className="shrink-0 shadow-sm">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  )
}
