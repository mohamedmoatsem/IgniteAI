import { useState, useEffect, useRef, useCallback } from "react"
import { Timer, Play, Pause, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/i18n"

interface PomodoroTimerProps {
  onPhaseChange?: (phase: "focus" | "review") => void
}

const FOCUS_SECS = 25 * 60
const REVIEW_SECS = 5 * 60

export function PomodoroTimer({ onPhaseChange }: PomodoroTimerProps) {
  const { t } = useLanguage()
  const [phase, setPhase] = useState<"focus" | "review">("focus")
  const [remaining, setRemaining] = useState(FOCUS_SECS)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const tick = useCallback(() => {
    setRemaining((r) => {
      if (r <= 1) {
        // flip phase
        const next = phase === "focus" ? "review" : "focus"
        setPhase(next)
        onPhaseChange?.(next)
        return next === "focus" ? FOCUS_SECS : REVIEW_SECS
      }
      return r - 1
    })
  }, [phase, onPhaseChange])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, tick])

  const reset = () => {
    setRunning(false)
    setPhase("focus")
    setRemaining(FOCUS_SECS)
  }

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0")
  const ss = String(remaining % 60).padStart(2, "0")
  const pct = phase === "focus"
    ? ((FOCUS_SECS - remaining) / FOCUS_SECS) * 100
    : ((REVIEW_SECS - remaining) / REVIEW_SECS) * 100

  const ringColor = phase === "focus" ? "stroke-primary" : "stroke-emerald-500"
  const labelColor = phase === "focus" ? "text-primary" : "text-emerald-500"
  const phaseLabel = phase === "focus" ? t("livelab.focusDeepWork") : t("livelab.focusReview")

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Ring */}
      <div className="relative w-12 h-12 shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor"
            strokeWidth="2.5" className="text-border" />
          <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="2.5"
            strokeDasharray={`${pct} ${100 - pct}`}
            strokeLinecap="round"
            className={`${ringColor} transition-all duration-1000`} />
        </svg>
        <Timer className={`absolute inset-0 m-auto w-4 h-4 ${labelColor}`} />
      </div>
      {/* Time + label */}
      <div className="flex flex-col min-w-0">
        <span className={`text-base font-mono font-bold leading-none ${labelColor}`}>
          {mm}:{ss}
        </span>
        <span className="text-[10px] text-muted-foreground truncate">{phaseLabel}</span>
      </div>
      {/* Controls */}
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7"
          onClick={() => setRunning((r) => !r)} title={running ? t("livelab.focusPause") : t("livelab.focusStart")}>
          {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7"
          onClick={reset} title={t("livelab.focusReset")}>
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}
