import { useState } from "react"
import { useScoreAtsResume, type AtsScoreCategory, type AtsScoreResult } from "@workspace/api-client-react"
import { AlertCircle, Loader2, Radar, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/lib/i18n"

interface AtsScorePanelProps {
  selectedResumeId: number | null
  selectedResumeName?: string
}

const RING_RADIUS = 52
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS
const MIN_JOB_DESCRIPTION_LENGTH = 40
const MIN_RESUME_LENGTH = 50

function isFallbackResult(result: AtsScoreResult): boolean {
  return result.topFixes[0]?.startsWith("Fallback result:") ?? false
}

export function AtsScorePanel({
  selectedResumeId,
  selectedResumeName,
}: AtsScorePanelProps) {
  const { t, dir, language } = useLanguage()
  const scoreMutation = useScoreAtsResume()
  const [jobDescription, setJobDescription] = useState("")
  const [resumeText, setResumeText] = useState("")
  const [inputError, setInputError] = useState("")

  const result = scoreMutation.data
  const showingFallback = result ? isFallbackResult(result) : false

  const categoryLabel = (category: AtsScoreCategory) => {
    switch (category.id) {
      case "keyword_match":
        return t("career.ats.keywordMatch")
      case "formatting_parseability":
        return t("career.ats.formatting")
      case "section_completeness":
        return t("career.ats.sections")
      case "action_verbs_impact":
        return t("career.ats.actionImpact")
      case "length_readability":
        return t("career.ats.lengthReadability")
    }
  }

  const fallbackIssue = (category: AtsScoreCategory) => {
    switch (category.id) {
      case "keyword_match":
        return t("career.ats.fallbackKeyword")
      case "formatting_parseability":
        return t("career.ats.fallbackFormatting")
      case "section_completeness":
        return t("career.ats.fallbackSections")
      case "action_verbs_impact":
        return t("career.ats.fallbackActionImpact")
      case "length_readability":
        return t("career.ats.fallbackLength")
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setInputError("")

    const trimmedJobDescription = jobDescription.trim()
    const trimmedResumeText = resumeText.trim()

    if (trimmedJobDescription.length < MIN_JOB_DESCRIPTION_LENGTH) {
      setInputError(t("career.ats.jobDescriptionTooShort"))
      return
    }
    if (trimmedResumeText.length > 0 && trimmedResumeText.length < MIN_RESUME_LENGTH) {
      setInputError(t("career.ats.resumeTooShort"))
      return
    }
    if (trimmedResumeText.length === 0 && !selectedResumeId) {
      setInputError(t("career.ats.inputRequired"))
      return
    }

    scoreMutation.mutate({
      data: {
        jobDescription: trimmedJobDescription,
        ...(trimmedResumeText.length > 0
          ? { resumeText: trimmedResumeText }
          : { resumeId: selectedResumeId! }),
        uiLanguage: language,
      },
    })
  }

  const scoreColor =
    (result?.score ?? 0) >= 80
      ? "#22c55e"
      : (result?.score ?? 0) >= 60
        ? "#f59e0b"
        : "#f97316"

  return (
    <Card className="border-primary/20 bg-card/80 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-xl bg-primary/10 p-2.5 text-primary">
            <Radar className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-lg">{t("career.ats.title")}</CardTitle>
            <CardDescription className="mt-1 leading-relaxed">
              {t("career.ats.subtitle")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="ats-job-description" className="text-sm font-medium">
              {t("career.ats.jobDescription")}
            </label>
            <Textarea
              id="ats-job-description"
              dir={dir}
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              placeholder={t("career.ats.jobDescriptionPlaceholder")}
              maxLength={20000}
              rows={6}
              className="min-h-36 resize-y bg-background/70 leading-relaxed"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="ats-resume-text" className="text-sm font-medium">
              {t("career.ats.resumeText")}
            </label>
            <Textarea
              id="ats-resume-text"
              dir={dir}
              value={resumeText}
              onChange={(event) => setResumeText(event.target.value)}
              placeholder={t("career.ats.resumeTextPlaceholder")}
              maxLength={50000}
              rows={6}
              className="min-h-36 resize-y bg-background/70 leading-relaxed"
            />
            <p className="text-xs text-muted-foreground" dir={dir}>
              {selectedResumeName
                ? `${t("career.ats.resumeSourceHelp")} ${selectedResumeName}`
                : t("career.ats.resumeSourceHelp")}
            </p>
          </div>
          <div className="space-y-2 lg:col-span-2">
            {inputError && (
              <p role="alert" className="text-sm text-destructive">
                {inputError}
              </p>
            )}
            {scoreMutation.isError && (
              <p role="alert" className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {t("career.ats.error")}
              </p>
            )}
            <Button
              type="submit"
              className="w-full gap-2 sm:w-auto"
              disabled={scoreMutation.isPending}
            >
              {scoreMutation.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Sparkles className="h-4 w-4" />}
              {scoreMutation.isPending ? t("career.ats.running") : t("career.ats.run")}
            </Button>
          </div>
        </form>

        {scoreMutation.isPending && (
          <div
            className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">{t("career.ats.running")}</p>
          </div>
        )}

        {!scoreMutation.isPending && result && (
          <div className="space-y-5" dir={dir}>
            {showingFallback && (
              <div
                role="status"
                className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{t("career.ats.fallbackNotice")}</p>
              </div>
            )}

            <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-muted/15 p-5 text-center">
                <div className="relative h-36 w-36">
                  <svg
                    viewBox="0 0 128 128"
                    className="h-full w-full"
                    style={{ transform: dir === "rtl" ? "scaleX(-1)" : undefined }}
                    role="img"
                    aria-label={`${t("career.ats.scoreLabel")}: ${result.score} ${t("career.ats.scoreOutOf")}`}
                  >
                    <circle
                      cx="64"
                      cy="64"
                      r={RING_RADIUS}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="10"
                      className="text-muted"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r={RING_RADIUS}
                      fill="none"
                      stroke={scoreColor}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={RING_CIRCUMFERENCE}
                      strokeDashoffset={RING_CIRCUMFERENCE * (1 - result.score / 100)}
                      transform="rotate(-90 64 64)"
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold tracking-tight tabular-nums">
                      {result.score}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t("career.ats.scoreOutOf")}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-sm font-semibold">{t("career.ats.scoreLabel")}</p>
              </div>

              <div className="rounded-xl border border-border bg-background/50 p-4 sm:p-5">
                <h3 className="mb-4 text-sm font-semibold">{t("career.ats.breakdown")}</h3>
                <div className="space-y-4">
                  {result.categories.map((category) => (
                    <div key={category.id} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium">{categoryLabel(category)}</span>
                        <span className="shrink-0 font-semibold tabular-nums">
                          {category.score}
                          <span className="font-normal text-muted-foreground"> / 100</span>
                        </span>
                      </div>
                      <div
                        dir={dir}
                        className="h-2 overflow-hidden rounded-full bg-muted"
                        role="progressbar"
                        aria-label={categoryLabel(category)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={category.score}
                      >
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-violet-500 transition-[width] duration-700 ease-out"
                          style={{
                            width: `${category.score}%`,
                            marginInlineEnd: "auto",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <section className="rounded-xl border border-border bg-background/50 p-4 sm:p-5">
                <h3 className="mb-3 text-sm font-semibold">{t("career.ats.issues")}</h3>
                <div className="space-y-4">
                  {result.categories.map((category) => (
                    <div key={category.id}>
                      <h4 className="mb-1 text-xs font-semibold text-muted-foreground">
                        {categoryLabel(category)}
                      </h4>
                      <ul className="space-y-1.5">
                        {(showingFallback
                          ? [fallbackIssue(category)]
                          : category.issues
                        ).map((issue, index) => (
                          <li
                            key={`${category.id}-${index}`}
                            dir="auto"
                            className="flex items-start gap-2 text-sm leading-relaxed"
                          >
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-border bg-background/50 p-4 sm:p-5">
                <h3 className="mb-3 text-sm font-semibold">{t("career.ats.topFixes")}</h3>
                {showingFallback ? (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t("career.ats.fallbackNotice")}
                  </p>
                ) : (
                  <ol className="space-y-3">
                    {result.topFixes.map((fix, index) => (
                      <li
                        key={index}
                        dir="auto"
                        className="flex items-start gap-3 text-sm leading-relaxed"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {index + 1}
                        </span>
                        <span>{fix}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>
          </div>
        )}

        {!scoreMutation.isPending && !result && !scoreMutation.isError && (
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/15 p-6 text-center">
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <Radar className="h-6 w-6" />
            </div>
            <h3 className="font-semibold">{t("career.ats.emptyTitle")}</h3>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              {t("career.ats.emptyDescription")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
