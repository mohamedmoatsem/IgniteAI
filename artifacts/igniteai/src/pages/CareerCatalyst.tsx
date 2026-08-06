import { useState, useRef } from "react"
import {
  useListResumes, useUploadResume, useGetResume,
  useListApplications, useCreateApplication, useUpdateApplication, useDeleteApplication,
  getListApplicationsQueryKey, getListResumesQueryKey,
} from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  UploadCloud, User, Briefcase, Plus, Loader2, ChevronRight,
  CheckCircle2, Clock, Send, Trash2, FileText, MapPin, Globe, Sparkles,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import ReactMarkdown from "react-markdown"

type AppStatus = "found" | "applying" | "submitted"
const KANBAN_COLS: { id: AppStatus; label: string; icon: React.ReactNode }[] = [
  { id: "found", label: "Found", icon: <Clock className="w-3.5 h-3.5" /> },
  { id: "applying", label: "Applying", icon: <Send className="w-3.5 h-3.5" /> },
  { id: "submitted", label: "Submitted", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
]

export default function CareerCatalyst() {
  const queryClient = useQueryClient()

  const { data: resumes, isLoading: isLoadingResumes } = useListResumes()
  const { data: applications, isLoading: isLoadingApps } = useListApplications()
  const uploadResume = useUploadResume()
  const createApp = useCreateApplication()
  const updateApp = useUpdateApplication()
  const deleteApp = useDeleteApplication()

  // Resume upload state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [country, setCountry] = useState("")
  const [remote, setRemote] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Selected resume
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null)
  const { data: selectedResume } = useGetResume(selectedResumeId!, {
    query: { enabled: !!selectedResumeId, queryKey: ["resume", selectedResumeId] },
  })

  // New application dialog
  const [appDialogOpen, setAppDialogOpen] = useState(false)
  const [appCompany, setAppCompany] = useState("")
  const [appRole, setAppRole] = useState("")
  const [appDesc, setAppDesc] = useState("")

  // Cover letter view
  const [coverAppId, setCoverAppId] = useState<number | null>(null)
  const coverApp = applications?.find(a => a.id === coverAppId)

  const handleFileSelect = (file: File) => {
    const data = new FormData()
    data.append("file", file)
    if (country) data.append("country", country)
    data.append("remote", String(remote))

    uploadResume.mutate(
      { data: { file, country: country || undefined, remote } },
      {
        onSuccess: (r) => {
          queryClient.invalidateQueries({ queryKey: getListResumesQueryKey() })
          setSelectedResumeId(r.id)
        },
      }
    )
  }

  const handleCreateApp = () => {
    if (!appCompany.trim() || !appRole.trim() || !selectedResumeId) return
    createApp.mutate(
      {
        data: {
          resumeId: selectedResumeId,
          company: appCompany,
          role: appRole,
          jobDescription: appDesc || undefined,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() })
          setAppDialogOpen(false)
          setAppCompany(""); setAppRole(""); setAppDesc("")
        },
      }
    )
  }

  const handleStatusChange = (id: number, status: AppStatus) => {
    updateApp.mutate(
      { id, data: { status } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() }) }
    )
  }

  const handleDeleteApp = (id: number) => {
    deleteApp.mutate(
      { id },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() }) }
    )
  }

  const appsInCol = (col: AppStatus) => applications?.filter(a => a.status === col) ?? []

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      <div className="border-b border-border bg-card px-4 md:px-6 py-4 shrink-0">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-primary" />
          Career Catalyst
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload your resume, let AI merge your real projects, and track job applications.
        </p>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Resume sidebar */}
        <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-border bg-muted/20 flex flex-col shrink-0 max-h-96 md:max-h-none md:h-full overflow-y-auto">
          <div className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Resumes</div>
          <div className="px-4 pb-4 flex flex-col gap-3">
            {/* Location/remote */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <Input value={country} onChange={(e) => setCountry(e.target.value)}
                  placeholder="Target country (e.g. USA)" className="h-8 text-xs" />
              </div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={remote} onChange={(e) => setRemote(e.target.checked)}
                  className="rounded" />
                <Globe className="w-3.5 h-3.5" />
                Open to remote
              </label>
            </div>

            {/* Upload zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); e.dataTransfer.files?.[0] && handleFileSelect(e.dataTransfer.files[0]) }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center gap-2
                ${isDragging ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"}
                ${uploadResume.isPending ? "opacity-50 pointer-events-none" : ""}`}
            >
              <input ref={fileInputRef} type="file" className="hidden"
                accept=".pdf,.doc,.docx,.txt,.md"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
              {uploadResume.isPending
                ? <Loader2 className="w-7 h-7 text-primary animate-spin" />
                : <UploadCloud className={`w-7 h-7 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />}
              <p className="text-sm font-medium">Upload resume</p>
              <p className="text-xs text-muted-foreground">PDF, Word, or text file</p>
            </div>

            {/* Resume list */}
            {isLoadingResumes
              ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)
              : resumes?.map((r) => (
                <button key={r.id} onClick={() => setSelectedResumeId(r.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all
                    ${selectedResumeId === r.id ? "bg-card border-primary ring-1 ring-primary shadow-sm" : "bg-card/50 border-border hover:border-primary/50 hover:bg-card"}`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{r.filename}</p>
                      <p className="text-[10px] text-muted-foreground">{format(new Date(r.createdAt), "MMM d, h:mm a")}</p>
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-6">
          {/* Resume detail */}
          {selectedResume && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    {selectedResume.filename}
                    {selectedResume.country && (
                      <Badge variant="outline" className="text-[10px]">
                        <MapPin className="w-2.5 h-2.5 mr-1" />{selectedResume.country}
                      </Badge>
                    )}
                    {selectedResume.remote && (
                      <Badge variant="outline" className="text-[10px]">Remote</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 text-sm">
                  <p className="text-muted-foreground leading-relaxed">{selectedResume.parsedSummary}</p>
                  {selectedResume.skills && (
                    <div>
                      <p className="font-medium mb-1 text-xs uppercase tracking-wider text-muted-foreground">Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedResume.skills.split(",").map((s, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{s.trim()}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedResume.experience && (
                    <div>
                      <p className="font-medium mb-1 text-xs uppercase tracking-wider text-muted-foreground">Experience</p>
                      <div className="prose prose-xs dark:prose-invert max-w-none">
                        <ReactMarkdown>{selectedResume.experience}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Applications Kanban */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Job Applications</h2>
              <Dialog open={appDialogOpen} onOpenChange={setAppDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5" disabled={!selectedResumeId}>
                    <Plus className="w-3.5 h-3.5" />
                    Add Application
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>New Job Application</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-3 py-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">Company</label>
                      <Input value={appCompany} onChange={(e) => setAppCompany(e.target.value)}
                        placeholder="e.g. Stripe" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">Role</label>
                      <Input value={appRole} onChange={(e) => setAppRole(e.target.value)}
                        placeholder="e.g. Senior Software Engineer" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-muted-foreground">
                        Job description (optional — improves cover letter)
                      </label>
                      <Textarea value={appDesc} onChange={(e) => setAppDesc(e.target.value)}
                        placeholder="Paste the job description or key requirements…" rows={4}
                        className="text-sm resize-none" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateApp}
                      disabled={!appCompany.trim() || !appRole.trim() || createApp.isPending}
                      className="gap-2">
                      {createApp.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Generate cover letter & add
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {!selectedResumeId && (
              <p className="text-sm text-muted-foreground">Upload or select a resume above to start tracking applications.</p>
            )}

            {isLoadingApps
              ? <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
              : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {KANBAN_COLS.map(col => (
                    <div key={col.id} className="flex flex-col gap-2.5 bg-muted/30 rounded-xl p-3 border border-border min-h-32">
                      <div className="flex items-center gap-1.5 text-sm font-semibold px-1">
                        {col.icon} {col.label}
                        <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{appsInCol(col.id).length}</span>
                      </div>
                      <AnimatePresence>
                        {appsInCol(col.id).map(app => (
                          <motion.div key={app.id}
                            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-card rounded-lg border border-border p-3 shadow-sm flex flex-col gap-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-semibold text-sm leading-tight truncate">{app.company}</p>
                                <p className="text-xs text-muted-foreground truncate">{app.role}</p>
                              </div>
                              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteApp(app.id)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Select value={app.status} onValueChange={(v) => handleStatusChange(app.id, v as AppStatus)}>
                                <SelectTrigger className="h-7 text-xs flex-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="found">Found</SelectItem>
                                  <SelectItem value="applying">Applying</SelectItem>
                                  <SelectItem value="submitted">Submitted</SelectItem>
                                </SelectContent>
                              </Select>
                              {app.coverLetter && (
                                <Button variant="ghost" size="sm" className="h-7 text-xs px-2 gap-1"
                                  onClick={() => setCoverAppId(app.id === coverAppId ? null : app.id)}>
                                  <FileText className="w-3 h-3" />
                                  Letter
                                  <ChevronRight className={`w-3 h-3 transition-transform ${coverAppId === app.id ? "rotate-90" : ""}`} />
                                </Button>
                              )}
                            </div>
                            {coverAppId === app.id && app.coverLetter && (
                              <div className="text-xs bg-muted/50 rounded-lg p-2.5 border border-border leading-relaxed whitespace-pre-wrap">
                                {app.coverLetter}
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  )
}
