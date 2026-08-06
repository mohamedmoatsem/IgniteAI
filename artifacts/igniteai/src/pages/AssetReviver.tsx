import { useState, useRef, useEffect } from "react"
import { useListAssetJobs, useCreateAssetJob, useGetAssetJob, getListAssetJobsQueryKey } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { UploadCloud, FileText, CheckCircle2, Clock, XCircle, Loader2, Sparkles, PenLine, Image } from "lucide-react"
import { format } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import ReactMarkdown from "react-markdown"
import { MermaidRenderer } from "@/components/MermaidRenderer"
import { useLanguage } from "@/lib/i18n"

export default function AssetReviver() {
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [draftText, setDraftText] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const queryClient = useQueryClient()
  const { t, language } = useLanguage()

  const { data: jobs, isLoading: isLoadingJobs } = useListAssetJobs()
  const createJob = useCreateAssetJob()

  const { data: selectedJob, isLoading: isLoadingJob } = useGetAssetJob(selectedJobId!, {
    query: {
      enabled: !!selectedJobId,
      queryKey: ["assetJob", selectedJobId],
      refetchInterval: (query) => {
        const status = query.state.data?.status
        if (status === "pending" || status === "processing") return 2000
        return false
      },
    },
  })

  const hasActiveJobs = jobs?.some(j => j.status === "pending" || j.status === "processing")
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (hasActiveJobs) {
      interval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: getListAssetJobsQueryKey() })
      }, 3000)
    }
    return () => clearInterval(interval)
  }, [hasActiveJobs, queryClient])

  const handleFileSelect = (file: File) => {
    if (!file) return
    createJob.mutate(
      { data: { file, language } },
      {
        onSuccess: (newJob) => {
          queryClient.invalidateQueries({ queryKey: getListAssetJobsQueryKey() })
          setSelectedJobId(newJob.id)
        },
      }
    )
  }

  const handleGenerateFromText = () => {
    const text = draftText.trim()
    if (!text) return
    createJob.mutate(
      { data: { text, language } },
      {
        onSuccess: (newJob) => {
          queryClient.invalidateQueries({ queryKey: getListAssetJobsQueryKey() })
          setSelectedJobId(newJob.id)
          setDraftText("")
        },
      }
    )
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0])
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      case "pending": case "processing": return <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
      case "failed": return <XCircle className="w-4 h-4 text-destructive" />
      default: return <FileText className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    const map: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default", pending: "secondary", processing: "secondary", failed: "destructive",
    }
    return <Badge variant={map[status] ?? "outline"} className="text-[10px] capitalize">{status}</Badge>
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      <div className="border-b border-border bg-card px-4 md:px-6 py-4 shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">{t("assetReviver.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("assetReviver.subtitle")}</p>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar */}
        <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-border bg-muted/20 flex flex-col shrink-0 max-h-80 md:max-h-none md:h-full overflow-y-auto">
          <div className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider">
            {t("assetReviver.recentJobs")}
          </div>
          <div className="px-4 pb-4 flex flex-col gap-3">
            {/* Upload zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2
                ${isDragging ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50 hover:bg-card/80"}
                ${createJob.isPending ? "opacity-50 pointer-events-none" : ""}`}
            >
              <input type="file" ref={fileInputRef} className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                accept=".xlsx,.xls,.csv,.txt,.md" />
              {createJob.isPending
                ? <Loader2 className="w-7 h-7 text-primary animate-spin" />
                : <UploadCloud className={`w-7 h-7 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />}
              <div className="text-sm font-medium">{isDragging ? "Drop file to upload" : t("assetReviver.uploadFile")}</div>
              <p className="text-xs text-muted-foreground">{t("assetReviver.uploadHint")}</p>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs">{t("assetReviver.or")}</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Text entry (Arabic RTL label) */}
            <div className="flex flex-col gap-2" dir="rtl">
              <label htmlFor="draft-text" className="text-sm font-medium flex items-center gap-2 justify-end">
                {t("assetReviver.pasteLabel")}
                <PenLine className="w-4 h-4 text-muted-foreground shrink-0" />
              </label>
              <Textarea id="draft-text" value={draftText} onChange={(e) => setDraftText(e.target.value)}
                disabled={createJob.isPending} dir="auto" rows={5}
                className="resize-none text-sm"
                placeholder={t("assetReviver.pastePlaceholder")} />
              <Button onClick={handleGenerateFromText} disabled={!draftText.trim() || createJob.isPending}
                className="w-full" dir="ltr">
                {createJob.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Sparkles className="w-4 h-4" />}
                {t("assetReviver.generateFromText")}
              </Button>
            </div>

            {/* Job list */}
            {isLoadingJobs
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)
              : (
                <AnimatePresence>
                  {jobs?.map((job, i) => (
                    <motion.button key={job.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => setSelectedJobId(job.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3
                        ${selectedJobId === job.id
                          ? "bg-card border-primary ring-1 ring-primary shadow-sm"
                          : "bg-card/50 border-border hover:border-primary/50 hover:bg-card"}`}
                    >
                      <div className="shrink-0">{getStatusIcon(job.status)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{job.filename}</p>
                        <p className="text-[10px] text-muted-foreground">{format(new Date(job.createdAt), "MMM d, h:mm a")}</p>
                      </div>
                      {getStatusBadge(job.status)}
                    </motion.button>
                  ))}
                </AnimatePresence>
              )}
          </div>
        </div>

        {/* Result viewport */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {!selectedJobId ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                <FileText className="w-10 h-10 opacity-30" />
              </div>
              <h3 className="font-semibold text-foreground">{t("assetReviver.emptyTitle")}</h3>
              <p className="text-sm mt-2 text-center max-w-xs">{t("assetReviver.emptySubtitle")}</p>
            </div>
          ) : isLoadingJob ? (
            <div className="flex flex-col gap-4 max-w-2xl">
              <Skeleton className="h-7 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-40 w-full mt-4" />
            </div>
          ) : selectedJob ? (
            <div className="max-w-3xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">{selectedJob.filename}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(selectedJob.createdAt), "PPpp")}</p>
                </div>
                {getStatusBadge(selectedJob.status)}
              </div>

              {selectedJob.status === "pending" || selectedJob.status === "processing" ? (
                <Card className="border-border">
                  <CardContent className="p-8 flex flex-col items-center gap-3 text-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="font-medium">Generating your assets…</p>
                    <p className="text-sm text-muted-foreground">Three AI agents are working on marketing copy, the e-book, and a cover sketch.</p>
                  </CardContent>
                </Card>
              ) : selectedJob.status === "failed" ? (
                <Card className="border-destructive/30 bg-destructive/5">
                  <CardContent className="p-6">
                    <p className="text-destructive font-medium">Processing failed</p>
                    <p className="text-sm text-muted-foreground mt-1">{selectedJob.error}</p>
                  </CardContent>
                </Card>
              ) : (
                <Tabs defaultValue="marketing">
                  <TabsList className="mb-4">
                    <TabsTrigger value="marketing">{t("assetReviver.marketingTab")}</TabsTrigger>
                    <TabsTrigger value="ebook">{t("assetReviver.ebookTab")}</TabsTrigger>
                    {selectedJob.coverSvg && (
                      <TabsTrigger value="cover">
                        <Image className="w-3.5 h-3.5 mr-1" />
                        {t("assetReviver.coverTab")}
                      </TabsTrigger>
                    )}
                  </TabsList>
                  <TabsContent value="marketing">
                    <Card>
                      <CardContent className="p-6 prose prose-sm dark:prose-invert max-w-none">
                        <MarkdownWithMermaid content={selectedJob.marketingContent ?? ""} />
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="ebook">
                    <Card>
                      <CardContent className="p-6 prose prose-sm dark:prose-invert max-w-none">
                        <MarkdownWithMermaid content={selectedJob.ebookContent ?? ""} />
                      </CardContent>
                    </Card>
                  </TabsContent>
                  {selectedJob.coverSvg && (
                    <TabsContent value="cover">
                      <Card>
                        <CardContent className="p-6 flex flex-col items-center gap-4">
                          <p className="text-sm text-muted-foreground">{t("assetReviver.cover")}</p>
                          <img
                            src={`data:image/svg+xml,${encodeURIComponent(selectedJob.coverSvg)}`}
                            alt="AI-generated cover art"
                            className="rounded-xl overflow-hidden shadow-lg border border-border max-w-xs w-full"
                          />
                        </CardContent>
                      </Card>
                    </TabsContent>
                  )}
                </Tabs>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

/** Renders markdown, replacing ```mermaid fences with live Mermaid diagrams. */
function MarkdownWithMermaid({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        code({ className, children, ...props }) {
          const isMermaid = /language-mermaid/.test(className ?? "")
          if (isMermaid) {
            return <MermaidRenderer chart={String(children).trim()} />
          }
          return <code className={className} {...props}>{children}</code>
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
