import { useState } from "react"
import { useExplainCode } from "@workspace/api-client-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Code2, Send, Lightbulb, Sparkles, Terminal } from "lucide-react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"

const LANGUAGES = [
  "javascript", "typescript", "python", "go", "rust", "java", "css", "html"
]

export default function LiveLab() {
  const [code, setCode] = useState("")
  const [language, setLanguage] = useState("javascript")
  const [question, setQuestion] = useState("")
  const [hasExplained, setHasExplained] = useState(false)
  
  const explainCode = useExplainCode()

  const handleExplain = () => {
    if (!code.trim()) return
    setHasExplained(true)
    explainCode.mutate({
      data: { code, language, question: question.trim() || undefined }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleExplain()
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      <div className="border-b border-border bg-card px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Terminal className="w-6 h-6 text-primary" />
            LiveLab
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Paste code and have Gemini explain it.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="h-9 px-3 py-1 rounded-md border border-border bg-background text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          >
            {LANGUAGES.map(lang => (
              <option key={lang} value={lang}>{lang.charAt(0).toUpperCase() + lang.slice(1)}</option>
            ))}
          </select>
          <Button 
            onClick={handleExplain} 
            disabled={!code.trim() || explainCode.isPending}
            className="gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Explain Code
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full">
          {/* Editor Panel */}
          <Panel defaultSize={50} minSize={30} className="flex flex-col relative bg-[#0d0d0d] dark:bg-card">
            <div className="absolute top-2 right-2 text-xs font-mono text-muted-foreground bg-black/20 px-2 py-1 rounded-md pointer-events-none">
              editor
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste your code here..."
              className="flex-1 w-full p-6 font-mono text-sm bg-transparent text-[#e5e5e5] dark:text-foreground outline-none resize-none placeholder:text-muted-foreground/50"
              spellCheck={false}
            />
          </Panel>

          <PanelResizeHandle className="w-2 bg-border hover:bg-primary/50 transition-colors flex items-center justify-center cursor-col-resize group">
            <div className="w-1 h-8 rounded-full bg-muted-foreground/30 group-hover:bg-primary/80" />
          </PanelResizeHandle>

          {/* Explanation Panel */}
          <Panel defaultSize={50} minSize={30} className="bg-muted/10 flex flex-col h-full border-l border-border relative">
            <div className="flex-1 overflow-y-auto p-6 flex flex-col">
              {!hasExplained ? (
                <div className="m-auto flex flex-col items-center justify-center text-muted-foreground max-w-xs text-center">
                  <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                    <Lightbulb className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">Waiting for code</h3>
                  <p className="text-sm mt-2">Paste some code and click Explain. You can also add a specific question below.</p>
                </div>
              ) : explainCode.isPending ? (
                <div className="flex flex-col gap-4 max-w-2xl">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-32 w-full mt-4" />
                </div>
              ) : explainCode.isError ? (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
                  Error generating explanation. Please try again.
                </div>
              ) : explainCode.data ? (
                <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none font-sans">
                  {/* Basic markdown rendering of explanation */}
                  {explainCode.data.explanation.split('\n').map((line, i) => (
                    <p key={i} className="mb-2 leading-relaxed">
                      {line.startsWith('```') ? (
                        <code className="block bg-secondary p-2 rounded-md font-mono text-sm my-2 text-foreground break-words whitespace-pre-wrap border border-border">
                          {line.replace(/```\w*/g, '')}
                        </code>
                      ) : line.startsWith('#') ? (
                        <strong className="block text-lg mt-4 mb-2 text-foreground">{line.replace(/^#+\s/, '')}</strong>
                      ) : line.startsWith('-') || line.startsWith('*') ? (
                        <span className="flex gap-2">
                          <span className="text-primary">•</span>
                          <span>{line.replace(/^[-*]\s/, '')}</span>
                        </span>
                      ) : (
                        line
                      )}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Follow up question input */}
            <div className="p-4 bg-card border-t border-border shrink-0 mt-auto shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
              <div className="flex gap-2 max-w-3xl mx-auto">
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a specific question about this code..."
                  className="bg-background shadow-sm border-border"
                />
                <Button 
                  onClick={handleExplain} 
                  disabled={!code.trim() || explainCode.isPending}
                  size="icon"
                  className="shrink-0 shadow-sm"
                >
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
