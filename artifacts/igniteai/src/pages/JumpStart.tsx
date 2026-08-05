import { useState } from "react"
import { useListBoards, useCreateBoard, useGetBoard, useDeleteBoard, useDelegateTask, getListBoardsQueryKey } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, Trash2, KanbanSquare, Calendar, Loader2, Bot, ChevronRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { useLanguage } from "@/lib/i18n"
import ReactMarkdown from "react-markdown"

export default function JumpStart() {
  const [prompt, setPrompt] = useState("")
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null)
  const [delegatingTaskId, setDelegatingTaskId] = useState<string | null>(null)
  const [activeColTab, setActiveColTab] = useState<string>("0")

  const queryClient = useQueryClient()
  const { t, language } = useLanguage()

  const { data: boards, isLoading: isLoadingBoards } = useListBoards()
  const createBoard = useCreateBoard()
  const deleteBoard = useDeleteBoard()
  const delegateTask = useDelegateTask()

  const { data: activeBoard, isLoading: isLoadingBoard } = useGetBoard(selectedBoardId!, {
    query: {
      enabled: !!selectedBoardId,
      queryKey: ["board", selectedBoardId],
    },
  })

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return
    createBoard.mutate(
      { data: { prompt, language } },
      {
        onSuccess: (newBoard) => {
          queryClient.invalidateQueries({ queryKey: getListBoardsQueryKey() })
          setPrompt("")
          setSelectedBoardId(newBoard.id)
          setActiveColTab("0")
        },
      }
    )
  }

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteBoard.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBoardsQueryKey() })
        if (selectedBoardId === id) setSelectedBoardId(null)
      },
    })
  }

  const handleDelegate = (taskId: string) => {
    if (!selectedBoardId) return
    setDelegatingTaskId(taskId)
    delegateTask.mutate(
      { id: selectedBoardId, taskId },
      {
        onSuccess: (updated) => {
          queryClient.setQueryData(["board", selectedBoardId], updated)
        },
        onSettled: () => setDelegatingTaskId(null),
      }
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
      {/* Top bar */}
      <div className="border-b border-border bg-card p-4 md:p-6 flex flex-col gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("jumpstart.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("jumpstart.subtitle")}</p>
        </div>
        <form onSubmit={handleGenerate} className="flex gap-2 w-full max-w-3xl">
          <Input
            placeholder={t("jumpstart.promptPlaceholder")}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={createBoard.isPending}
            className="h-11 bg-background text-base shadow-sm"
          />
          <Button type="submit" size="lg" disabled={!prompt.trim() || createBoard.isPending}
            className="h-11 px-5 gap-2 font-semibold shrink-0">
            {createBoard.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {t("jumpstart.generate")}
          </Button>
        </form>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar */}
        <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-border bg-muted/20 flex flex-col shrink-0 md:h-full overflow-y-auto max-h-48 md:max-h-none">
          <div className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider">
            {t("jumpstart.generatedBoards")}
          </div>
          <div className="px-3 pb-4 flex flex-col gap-2">
            {isLoadingBoards ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
            ) : boards?.length === 0 ? (
              <div className="text-center p-6 text-muted-foreground flex flex-col items-center gap-2">
                <KanbanSquare className="w-8 h-8 opacity-20" />
                <p className="text-sm">{t("jumpstart.noBoards")}</p>
              </div>
            ) : (
              <AnimatePresence>
                {boards?.map((board, i) => (
                  <motion.div key={board.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.04 }}>
                    <div
                      role="button" tabIndex={0}
                      onClick={() => { setSelectedBoardId(board.id); setActiveColTab("0") }}
                      onKeyDown={(e) => { if (e.key === "Enter") { setSelectedBoardId(board.id); setActiveColTab("0") } }}
                      className={`w-full cursor-pointer text-left p-3 rounded-xl border transition-all ${
                        selectedBoardId === board.id
                          ? "bg-card border-primary ring-1 ring-primary shadow-sm"
                          : "bg-card/50 border-border hover:border-primary/50 hover:bg-card"
                      }`}>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-semibold text-sm line-clamp-1 flex-1">{board.title}</h3>
                        <button
                          className="h-6 w-6 -mr-1 -mt-1 shrink-0 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          onClick={(e) => handleDelete(board.id, e)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">"{board.prompt}"</p>
                      <div className="flex items-center text-[10px] text-muted-foreground gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(board.createdAt), "MMM d, h:mm a")}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Board View */}
        <div className="flex-1 overflow-hidden bg-background flex flex-col">
          {!selectedBoardId ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
              <KanbanSquare className="w-16 h-16 mb-4 opacity-20" />
              <p>{t("jumpstart.selectBoard")}</p>
            </div>
          ) : isLoadingBoard ? (
            <div className="p-6 flex gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-72 shrink-0 flex flex-col gap-3">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-28 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          ) : activeBoard ? (
            <div className="flex flex-col h-full">
              <div className="px-4 md:px-6 pt-4 pb-2 shrink-0">
                <h2 className="text-xl font-bold">{activeBoard.title}</h2>
                <p className="text-muted-foreground text-sm mt-0.5">
                  {t("jumpstart.generatedFrom")}: &ldquo;{activeBoard.prompt}&rdquo;
                </p>
              </div>

              {/* ── Mobile: tab per column ── */}
              <div className="md:hidden flex-1 overflow-hidden flex flex-col">
                <Tabs value={activeColTab} onValueChange={setActiveColTab} className="flex-1 flex flex-col overflow-hidden">
                  <TabsList className="mx-4 shrink-0 overflow-x-auto flex w-auto justify-start h-auto gap-1 bg-muted/40 p-1">
                    {activeBoard.columns.map((col, idx) => (
                      <TabsTrigger key={col.id} value={String(idx)}
                        className="text-xs px-2.5 py-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                        {col.title.split(" ")[0]}
                        <span className="ml-1 text-[10px] bg-muted rounded-full px-1">{col.tasks.length}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {activeBoard.columns.map((col, idx) => (
                    <TabsContent key={col.id} value={String(idx)} className="flex-1 overflow-y-auto p-4 mt-0 flex flex-col gap-3">
                      <TaskList col={col} delegatingTaskId={delegatingTaskId} onDelegate={handleDelegate} t={t} />
                    </TabsContent>
                  ))}
                </Tabs>
              </div>

              {/* ── Desktop: horizontal scroll kanban ── */}
              <div className="hidden md:flex flex-1 overflow-x-auto overflow-y-auto p-6 gap-5 items-start">
                {activeBoard.columns.map((col, idx) => (
                  <motion.div key={col.id}
                    className="w-72 shrink-0 flex flex-col gap-3 bg-muted/30 rounded-xl p-3 border border-border"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.08 }}>
                    <div className="font-semibold text-sm flex items-center justify-between px-1">
                      {col.title}
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground border border-border/50">
                        {col.tasks.length}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2.5 overflow-y-auto">
                      <TaskList col={col} delegatingTaskId={delegatingTaskId} onDelegate={handleDelegate} t={t} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

interface Column { id: string; title: string; tasks: Array<{ id: string; title: string; description: string; agentNotes?: string }> }

function TaskList({ col, delegatingTaskId, onDelegate, t }: {
  col: Column
  delegatingTaskId: string | null
  onDelegate: (taskId: string) => void
  t: (key: Parameters<ReturnType<typeof useLanguage>["t"]>[0]) => string
}) {
  return (
    <>
      {col.tasks.map((task) => (
        <TaskCard key={task.id} task={task} delegatingTaskId={delegatingTaskId} onDelegate={onDelegate} t={t} />
      ))}
    </>
  )
}

function TaskCard({ task, delegatingTaskId, onDelegate, t }: {
  task: { id: string; title: string; description: string; agentNotes?: string }
  delegatingTaskId: string | null
  onDelegate: (taskId: string) => void
  t: (key: Parameters<ReturnType<typeof useLanguage>["t"]>[0]) => string
}) {
  const [expanded, setExpanded] = useState(false)
  const isDelegating = delegatingTaskId === task.id

  return (
    <Card className="shadow-sm border-border hover:border-primary/30 transition-colors">
      <CardContent className="p-3.5">
        <h4 className="font-semibold text-sm leading-tight">{task.title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed mt-1">{task.description}</p>

        {task.agentNotes && (
          <div className="mt-2">
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1 text-[11px] text-primary font-medium hover:underline"
            >
              <Bot className="w-3 h-3" />
              Agent notes
              <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`} />
            </button>
            {expanded && (
              <div className="mt-2 text-xs bg-muted/50 rounded-lg p-2 border border-border prose prose-xs dark:prose-invert max-w-none">
                <ReactMarkdown>{task.agentNotes}</ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {!task.agentNotes && (
          <Button variant="outline" size="sm"
            className="mt-2 h-7 text-xs gap-1.5 w-full"
            disabled={isDelegating || delegatingTaskId !== null}
            onClick={() => onDelegate(task.id)}>
            {isDelegating
              ? <><Loader2 className="w-3 h-3 animate-spin" />{t("jumpstart.delegating")}</>
              : <><Bot className="w-3 h-3" />{t("jumpstart.delegate")}</>}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
