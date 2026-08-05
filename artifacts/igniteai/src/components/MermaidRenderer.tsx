import { useEffect, useRef, useState } from "react"
import mermaid from "mermaid"

let initialized = false

function ensureInit() {
  if (!initialized) {
    mermaid.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "loose" })
    initialized = true
  }
}

interface MermaidRendererProps {
  chart: string
}

export function MermaidRenderer({ chart }: MermaidRendererProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const idRef = useRef(`mermaid-${Math.random().toString(36).slice(2)}`)

  useEffect(() => {
    ensureInit()
    setError(null)
    mermaid
      .render(idRef.current, chart)
      .then(({ svg }) => {
        if (ref.current) ref.current.innerHTML = svg
      })
      .catch((err) => {
        setError(String(err))
      })
  }, [chart])

  if (error) {
    return (
      <pre className="text-xs text-destructive bg-destructive/10 rounded p-3 overflow-x-auto">
        {chart}
      </pre>
    )
  }

  return <div ref={ref} className="my-4 overflow-x-auto" />
}
