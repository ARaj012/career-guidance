'use client'

// apps/web/src/components/ChatWidget.tsx
//
// Floating chat bubble, available site-wide. Add <ChatWidget /> once in
// your root layout (apps/web/src/app/layout.tsx), inside <body>, after
// {children}.

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react'

type Message = { role: 'user' | 'assistant'; content: string }

// Lightweight markdown rendering — just bold (**text**) and bullet lines
// (- text). Avoids pulling in a full markdown library for a chat bubble
// that only ever needs these two things.
function renderContent(text: string) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    const trimmed = line.trimStart()
    const isBullet = trimmed.startsWith('- ')
    const lineText = isBullet ? trimmed.slice(2) : line

    // Split on **bold** segments, keeping the delimiters via capture group
    const parts = lineText.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j}>{part.slice(2, -2)}</strong>
      }
      return part
    })

    return (
      <span key={i} className="block">
        {isBullet && <span className="mr-1.5">•</span>}
        {parts}
      </span>
    )
  })
}

const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content:
    "Hi! I'm the CareerGuide Assistant. Ask me about any college, entrance exam, or career path — cutoffs, placements, fees, eligibility, anything on the site.",
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    const nextMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(nextMessages)
    setInput('')
    setError(null)
    setLoading(true)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 25_000)

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setError(data?.error ?? "Couldn't get a response — please try again.")
        return
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError("That's taking longer than expected — please try again in a moment.")
      } else {
        console.error('Chat widget error:', err)
        setError("Couldn't get a response — please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close chat' : 'Open chat'}
        className="fixed bottom-5 right-5 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[92vw] max-w-sm h-[70vh] max-h-[560px] bg-white rounded-2xl border border-gray-200 shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white px-4 py-3.5 flex items-center gap-2 flex-shrink-0">
            <Sparkles className="w-5 h-5" />
            <div>
              <p className="text-sm font-semibold leading-tight">CareerGuide Assistant</p>
              <p className="text-xs text-indigo-100 leading-tight">Ask about colleges, exams, careers</p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed space-y-1 ${
                    m.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                  }`}
                >
                  {renderContent(m.content)}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-400 border border-gray-200 rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-sm flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Looking that up...
                </div>
              </div>
            )}
            {error && <p className="text-xs text-red-500 text-center">{error}</p>}
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-3 flex items-end gap-2 flex-shrink-0 bg-white">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about a college, exam, or career..."
              rows={1}
              className="flex-1 resize-none text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 max-h-24"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className="flex-shrink-0 w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center disabled:opacity-40 hover:bg-indigo-700 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
