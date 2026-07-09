import { useState, useRef, useEffect } from "react"
import { useListAssetJobs, useCreateAssetJob, useGetAssetJob, getListAssetJobsQueryKey } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UploadCloud, FileText, CheckCircle2, Clock, XCircle, FileArchive, Loader2, Sparkles } from "lucide-react"
import { format } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import ReactMarkdown from "react-markdown"

export default function AssetReviver() {
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const queryClient = useQueryClient()
  
  const { data: jobs, isLoading: isLoadingJobs } = useListAssetJobs()
  const createJob = useCreateAssetJob()

  // Polling selected job if it's pending/processing
  const { data: selectedJob, isLoading: isLoadingJob } = useGetAssetJob(selectedJobId!, {
    query: {
      enabled: !!selectedJobId,
      queryKey: ["assetJob", selectedJobId],
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        if (status === "pending" || status === "processing") return 2000;
        return false;
      }
    }
  })

  // Also poll the list if there are active jobs
  const hasActiveJobs = jobs?.some(j => j.status === 'pending' || j.status === 'processing')
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
      { data: { file } },
      {
        onSuccess: (newJob) => {
          queryClient.invalidateQueries({ queryKey: getListAssetJobsQueryKey() })
          setSelectedJobId(newJob.id)
        }
      }
    )
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files?.[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case "failed": return <XCircle className="w-4 h-4 text-destructive" />
      case "processing": return <Loader2 className="w-4 h-4 text-primary animate-spin" />
      default: return <Clock className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/10 text-green-600 border-green-500/20"
      case "failed": return "bg-destructive/10 text-destructive border-destructive/20"
      case "processing": return "bg-primary/10 text-primary border-primary/20"
      default: return "bg-muted text-muted-foreground border-border"
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
      <div className="border-b border-border bg-card p-6 flex flex-col gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileArchive className="w-6 h-6 text-primary" />
            Asset Reviver
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Upload dull exports, get polished marketing copy and e-books.</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar jobs list */}
        <div className="w-full md:w-80 border-r border-border bg-muted/20 flex flex-col h-full overflow-y-auto">
          <div className="p-4 font-semibold text-sm text-muted-foreground uppercase tracking-wider flex justify-between items-center">
            Recent Jobs
          </div>
          
          <div className="px-4 pb-4 flex flex-col gap-3">
            {/* Upload Zone */}
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2
                ${isDragging ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50 hover:bg-card/80"}
                ${createJob.isPending ? "opacity-50 pointer-events-none" : ""}
              `}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                accept=".xlsx,.xls,.csv,.txt,.md"
              />
              {createJob.isPending ? (
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              ) : (
                <UploadCloud className={`w-8 h-8 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
              )}
              <div className="text-sm font-medium text-foreground">
                {isDragging ? "Drop file to upload" : "Upload file"}
              </div>
              <p className="text-xs text-muted-foreground">Excel (.xlsx/.xls), CSV, or a Notion export (.txt/.md)</p>
            </div>

            <div className="w-full h-px bg-border my-2" />

            {isLoadingJobs ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))
            ) : jobs?.length === 0 ? (
              <div className="text-center p-4 text-muted-foreground text-sm">No jobs yet</div>
            ) : (
              <AnimatePresence>
                {jobs?.map((job, i) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <button
                      onClick={() => setSelectedJobId(job.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3 ${
                        selectedJobId === job.id 
                          ? "bg-card border-primary ring-1 ring-primary shadow-sm" 
                          : "bg-card/50 border-border hover:border-primary/50 hover:bg-card"
                      }`}
                    >
                      <div className="shrink-0 p-2 bg-secondary rounded-md">
                        <FileText className="w-4 h-4 text-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate text-foreground">{job.filename}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {format(new Date(job.createdAt), 'MMM d, h:mm a')}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {getStatusIcon(job.status)}
                      </div>
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Results View */}
        <div className="flex-1 overflow-y-auto bg-background p-6">
          {!selectedJobId ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground max-w-sm mx-auto text-center">
              <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6">
                <FileArchive className="w-10 h-10 text-primary opacity-50" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Asset Reviver</h3>
              <p className="mt-2">Select a job from the sidebar or upload a new export to generate marketing copy and e-book content automatically.</p>
            </div>
          ) : isLoadingJob || !selectedJob ? (
            <div className="flex flex-col gap-6 max-w-4xl mx-auto">
              <Skeleton className="h-12 w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-64 w-1/2" />
                <Skeleton className="h-64 w-1/2" />
              </div>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto flex flex-col h-full">
              <div className="flex items-start justify-between mb-8 pb-6 border-b border-border">
                <div>
                  <h2 className="text-2xl font-bold text-foreground break-all">{selectedJob.filename}</h2>
                  <div className="flex items-center gap-3 mt-3">
                    <Badge variant="outline" className={getStatusColor(selectedJob.status)}>
                      {selectedJob.status.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(selectedJob.createdAt), 'PPpp')}
                    </span>
                  </div>
                </div>
              </div>

              {selectedJob.status === "failed" && (
                <div className="p-6 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl flex items-start gap-3">
                  <XCircle className="w-6 h-6 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-lg">Job Failed</h3>
                    <p className="opacity-80 mt-1">{selectedJob.error || "An unknown error occurred during processing."}</p>
                  </div>
                </div>
              )}

              {(selectedJob.status === "pending" || selectedJob.status === "processing") && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 border border-border bg-card/50 rounded-xl shadow-sm">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 border-[3px] border-border rounded-full" />
                    <motion.div 
                      className="w-16 h-16 border-[3px] border-primary border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {selectedJob.status === "pending" ? "In Queue..." : "Reviving Assets..."}
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    Gemini is currently analyzing your upload and generating cohesive marketing materials and e-book structure. This usually takes 15-30 seconds.
                  </p>
                </div>
              )}

              {selectedJob.status === "completed" && (
                <Tabs defaultValue="marketing" className="flex-1 flex flex-col">
                  <TabsList className="w-full max-w-md grid grid-cols-2 mb-6">
                    <TabsTrigger value="marketing" className="text-base py-2">Marketing Copy</TabsTrigger>
                    <TabsTrigger value="ebook" className="text-base py-2">E-Book Content</TabsTrigger>
                  </TabsList>
                  
                  <div className="flex-1 bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                    <TabsContent value="marketing" className="m-0 h-full overflow-y-auto p-8 outline-none">
                      <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
                        {selectedJob.marketingContent ? (
                          <ReactMarkdown>{selectedJob.marketingContent}</ReactMarkdown>
                        ) : (
                          <div className="text-muted-foreground italic">No marketing content generated.</div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="ebook" className="m-0 h-full overflow-y-auto p-8 outline-none">
                      <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
                        {selectedJob.ebookContent ? (
                          <ReactMarkdown>{selectedJob.ebookContent}</ReactMarkdown>
                        ) : (
                          <div className="text-muted-foreground italic">No e-book content generated.</div>
                        )}
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
