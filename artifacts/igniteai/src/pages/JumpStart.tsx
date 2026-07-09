import { useState } from "react"
import { useListBoards, useCreateBoard, useGetBoard, useDeleteBoard, getListBoardsQueryKey } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Sparkles, Trash2, ArrowRight, KanbanSquare, Calendar, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"

export default function JumpStart() {
  const [prompt, setPrompt] = useState("")
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null)
  
  const queryClient = useQueryClient()
  
  const { data: boards, isLoading: isLoadingBoards } = useListBoards()
  const createBoard = useCreateBoard()
  const deleteBoard = useDeleteBoard()

  const { data: activeBoard, isLoading: isLoadingBoard } = useGetBoard(selectedBoardId!, {
    query: {
      enabled: !!selectedBoardId,
      queryKey: ["board", selectedBoardId]
    }
  })

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return
    createBoard.mutate(
      { data: { prompt } },
      {
        onSuccess: (newBoard) => {
          queryClient.invalidateQueries({ queryKey: getListBoardsQueryKey() })
          setPrompt("")
          setSelectedBoardId(newBoard.id)
        }
      }
    )
  }

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteBoard.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBoardsQueryKey() })
        if (selectedBoardId === id) setSelectedBoardId(null)
      }
    })
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
      {/* Top action bar */}
      <div className="border-b border-border bg-card p-6 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">JumpStart</h1>
          <p className="text-sm text-muted-foreground mt-1">Describe a goal, let Gemini break it down into a Kanban board instantly.</p>
        </div>
        
        <form onSubmit={handleGenerate} className="flex gap-2 w-full max-w-3xl">
          <Input 
            placeholder="e.g. Launch a new landing page for a coffee shop..." 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={createBoard.isPending}
            className="h-12 bg-background border-border text-base focus-visible:ring-primary shadow-sm"
          />
          <Button 
            type="submit" 
            size="lg" 
            disabled={!prompt.trim() || createBoard.isPending}
            className="h-12 px-6 gap-2 text-base font-semibold"
          >
            {createBoard.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            Generate
          </Button>
        </form>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar history */}
        <div className="w-full md:w-80 border-r border-border bg-muted/30 flex flex-col h-full overflow-y-auto">
          <div className="p-4 font-semibold text-sm text-muted-foreground uppercase tracking-wider">
            Generated Boards
          </div>
          <div className="px-3 pb-4 flex flex-col gap-2">
            {isLoadingBoards ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))
            ) : boards?.length === 0 ? (
              <div className="text-center p-6 text-muted-foreground flex flex-col items-center gap-2">
                <KanbanSquare className="w-8 h-8 opacity-20" />
                <p className="text-sm">No boards yet.</p>
              </div>
            ) : (
              <AnimatePresence>
                {boards?.map((board, i) => (
                  <motion.div
                    key={board.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <button
                      onClick={() => setSelectedBoardId(board.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        selectedBoardId === board.id 
                          ? "bg-card border-primary ring-1 ring-primary shadow-sm" 
                          : "bg-card/50 border-border hover:border-primary/50 hover:bg-card"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-semibold text-sm line-clamp-1 flex-1 text-foreground">{board.title}</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 -mr-2 -mt-1 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={(e) => handleDelete(board.id, e)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 mb-2">
                        "{board.prompt}"
                      </p>
                      <div className="flex items-center text-[10px] text-muted-foreground gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(board.createdAt), 'MMM d, h:mm a')}
                      </div>
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Board View */}
        <div className="flex-1 overflow-x-auto overflow-y-auto bg-background p-6">
          {!selectedBoardId ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <KanbanSquare className="w-16 h-16 mb-4 opacity-20" />
              <p>Select a board from the list to view</p>
            </div>
          ) : isLoadingBoard ? (
            <div className="flex gap-6 h-full items-start">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-80 shrink-0 flex flex-col gap-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ))}
            </div>
          ) : activeBoard ? (
            <div className="flex flex-col h-full min-w-max">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground">{activeBoard.title}</h2>
                <p className="text-muted-foreground text-sm mt-1">Generated from: "{activeBoard.prompt}"</p>
              </div>
              <div className="flex gap-6 h-full pb-4">
                {activeBoard.columns.map((col, idx) => (
                  <motion.div 
                    key={col.id} 
                    className="w-80 shrink-0 flex flex-col gap-3 bg-muted/40 rounded-xl p-3 border border-border"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <div className="font-semibold text-sm text-foreground flex items-center justify-between px-2">
                      {col.title}
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground border border-border/50">
                        {col.tasks.length}
                      </span>
                    </div>
                    <div className="flex flex-col gap-3 overflow-y-auto pr-1">
                      {col.tasks.map(task => (
                        <Card key={task.id} className="shadow-sm border-border hover:border-primary/30 transition-colors">
                          <CardContent className="p-4">
                            <h4 className="font-semibold text-sm text-foreground mb-1 leading-tight">{task.title}</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">{task.description}</p>
                          </CardContent>
                        </Card>
                      ))}
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
