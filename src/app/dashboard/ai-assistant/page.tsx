'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DashboardLayout from '@/components/layout/DashboardLayout'
import FadeIn from '@/components/animations/FadeIn'
import BulbLoading from '@/components/animations/BulbLoading'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant'
  content: string
  type?: string
  actions?: string[]
}

const SUGGESTED_QUERIES = [
  'What is the bearing of motor 24.04.04?',
  'Show maintenance history of motor 21.68',
  "Give me today's maintenance statistics",
  'Show spare parts stock',
  'Show this month MIS summary',
]

// ── Voice Recognition Hook ───────────────────────────────────────────────────
function useVoiceRecognition(onFinish: (text: string) => void) {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)
  const [hasSupport, setHasSupport] = useState(false)

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      setHasSupport(true)
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      
      recognitionRef.current.onstart = () => setIsListening(true)
      recognitionRef.current.onend = () => setIsListening(false)
      recognitionRef.current.onresult = (event: any) => {
        const text = event.results[0][0].transcript
        if (text) onFinish(text)
      }
    }
  }, [onFinish])

  const startListening = useCallback(() => {
    try {
      recognitionRef.current?.start()
    } catch (e) {
      console.error('Speech recognition error:', e)
      setIsListening(false)
    }
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  return { isListening, startListening, stopListening, hasSupport }
}

// ── Markdown & Action Card Component ──────────────────────────────────────────
function ChatContent({ msg }: { msg: Message }) {
  const lines = msg.content.split('\n')
  const elements: React.ReactNode[] = []
  let tableRows: string[][] = []
  let tableHeader: string[] | null = null
  let i = 0

  const flushTable = () => {
    if (!tableHeader) return
    elements.push(
      <div key={`tbl-${i}`} className="glass-panel" style={{ overflowX: 'auto', margin: '12px 0', padding: '1px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>{tableHeader.map((h, ci) => <th key={ci} style={{ padding: '10px 14px', background: 'rgba(59,130,246,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: 'var(--accent-blue)', whiteSpace: 'nowrap' }}>{h.trim()}</th>)}</tr>
          </thead>
          <tbody>
            {tableRows.map((row, ri) => (
              <tr key={ri} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {row.map((cell, ci) => <td key={ci} style={{ padding: '8px 14px' }}>{inlineMd(cell.trim())}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
    tableHeader = null
    tableRows = []
  }

  const inlineMd = (s: string): React.ReactNode => {
    const parts = s.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g)
    return parts.map((p, idx) => {
      if (p.startsWith('**') && p.endsWith('**')) return <strong key={idx} style={{ color: 'var(--accent-blue)' }}>{p.slice(2, -2)}</strong>
      if (p.startsWith('*') && p.endsWith('*')) return <em key={idx}>{p.slice(1, -1)}</em>
      if (p.startsWith('`') && p.endsWith('`')) return <code key={idx} style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>{p.slice(1, -1)}</code>
      return p
    })
  }

  while (i < lines.length) {
    const line = lines[i]
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const cells = line.split('|').slice(1, -1)
      if (!tableHeader) tableHeader = cells
      else if (!line.match(/^\|[-| :]+\|$/)) tableRows.push(cells)
      i++; continue
    } else { flushTable() }

    if (line.startsWith('> ')) {
      elements.push(<blockquote key={i} style={{ borderLeft: '3px solid var(--accent-purple)', paddingLeft: '14px', margin: '10px 0', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{inlineMd(line.slice(2))}</blockquote>)
      i++; continue
    }

    const hm = line.match(/^(#{1,3})\s+(.+)/)
    if (hm) {
      const size = hm[1].length === 1 ? '1.2rem' : hm[1].length === 2 ? '1.1rem' : '1rem'
      elements.push(<div key={i} style={{ fontWeight: 800, fontSize: size, marginTop: '16px', marginBottom: '8px', color: 'var(--accent-cyan)', letterSpacing: '0.5px' }}>{inlineMd(hm[2])}</div>)
      i++; continue
    }

    if (line.match(/^[-*•]\s/)) {
      elements.push(<div key={i} style={{ display: 'flex', gap: '10px', margin: '4px 0', paddingLeft: '4px' }}><span style={{ color: 'var(--accent-blue)', flexShrink: 0 }}>✦</span><span>{inlineMd(line.replace(/^[-*•]\s/, ''))}</span></div>)
      i++; continue
    }

    if (!line.trim()) { i++; continue }
    elements.push(<div key={i} style={{ margin: '6px 0' }}>{inlineMd(line)}</div>)
    i++
  }
  flushTable()

  return (
    <div>
      <div style={{ lineHeight: 1.7 }}>{elements}</div>
      {msg.actions && msg.actions.length > 0 && (
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {msg.actions.map((act, ai) => (
            <div key={ai} className="glass-panel" style={{ padding: '8px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '3px solid var(--accent-green)' }}>
              <span>⚙️</span> {act}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Page Component ───────────────────────────────────────────────────────
export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "👋 Hello! I'm **VoltMind AI 2.0**, your neural plant intelligence assistant.\n\nI've been upgraded with **GPT-4o** for advanced industrial reasoning, vision analysis, and **Multilingual support**.\n\nYou can now:\n- Speak to me in any language (Hindi, Telugu, etc.)\n- Upload equipment photos for analysis\n- Ask for complex electrical calculations\n- Update plant data directly via chat\n\nHow can I help you today?",
      type: 'welcome',
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [attachments, setAttachments] = useState<{ type: 'image' | 'file', data: string, name: string, mimeType: string }[]>([])
  const messagesEnd = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleVoiceFinish = useCallback((text: string) => {
    ask(text)
  }, [])

  const { isListening, startListening, stopListening, hasSupport } = useVoiceRecognition(handleVoiceFinish)

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      if (file.type.startsWith('image/')) {
        reader.onload = () => {
          const img = new Image(); img.src = reader.result as string
          img.onload = () => {
            const canvas = document.createElement('canvas'); const MAX_WIDTH = 1200; const scale = Math.min(MAX_WIDTH / img.width, 1)
            canvas.width = img.width * scale; canvas.height = img.height * scale
            const ctx = canvas.getContext('2d'); ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
            setAttachments(prev => [...prev, { type: 'image', data: canvas.toDataURL('image/jpeg', 0.8), name: file.name, mimeType: file.type }])
          }
        }; reader.readAsDataURL(file)
      } else {
        reader.onload = () => setAttachments(prev => [...prev, { type: 'file', data: reader.result as string, name: file.name, mimeType: file.type }])
        reader.readAsDataURL(file)
      }
    })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const ask = async (question: string) => {
    if ((!question.trim() && attachments.length === 0) || loading) return
    let displayContent = question
    if (attachments.length > 0) displayContent += `\n\n*📎 Attached ${attachments.length} file(s)*`
    setMessages(prev => [...prev, { role: 'user', content: displayContent }])
    setInput(''); const currentAtt = [...attachments]; setAttachments([]); setLoading(true)
    try {
      const history = messages.slice(1).map(m => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/ai', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ question, attachments: currentAtt, history }) 
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer, type: data.type, actions: data.actions }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.', type: 'error' }])
    }
    setLoading(false)
  }

  return (
    <DashboardLayout title="VoltMind AI 2.0" subtitle="Neural Plant Intelligence">
      <div className="ai-chat-full-screen">
        {/* WhatsApp-Style Header */}
        <div className="ai-header-nav glass-panel">
          <Link href="/dashboard" className="back-arrow-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </Link>
          <div className="header-info">
            <h2 className="header-name">VoltMind AI 2.0</h2>
            <p className="header-status"><span className="dot-live" /> Online</p>
          </div>
          <div className="header-actions">
            {SUGGESTED_QUERIES.slice(0, 1).map(q => (
              <button key={q} className="suggested-query-pill mobile-hide" onClick={() => ask(q)}>{q}</button>
            ))}
          </div>
        </div>

        {/* Messaging Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="ai-messages" style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div 
                   key={i} 
                   className="ai-message" 
                   style={{ flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', marginBottom: '16px' }}
                   initial={{ opacity: 0, y: 10, scale: 0.98 }}
                   animate={{ opacity: 1, y: 0, scale: 1 }}
                >
                  <div className="ai-avatar glass-panel" style={{ 
                    background: msg.role === 'user' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                    fontSize: '16px', width: '36px', height: '36px'
                  }}>
                    {msg.role === 'user' ? '👤' : '🧠'}
                  </div>
                  <div className={`ai-bubble-premium ${msg.role === 'user' ? 'user' : 'assistant'}`}>
                    <ChatContent msg={msg} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {loading && (
              <div className="ai-message">
                <div className="ai-avatar glass-panel" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', width: '36px', height: '36px' }}>🧠</div>
                <div className="ai-bubble-premium assistant" style={{ minWidth: '120px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <div className="ai-typing-dot" style={{ animationDelay: '0s' }} />
                    <div className="ai-typing-dot" style={{ animationDelay: '0.2s' }} />
                    <div className="ai-typing-dot" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEnd} />
          </div>

          {/* WhatsApp-Style Action Bar */}
          <div className="wa-input-container">
            <div className="wa-input-bubble glass-panel">
              <button className="wa-btn wa-attach-btn" onClick={() => fileInputRef.current?.click()}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
              </button>
              <input type="file" multiple style={{ display: 'none' }} ref={fileInputRef} onChange={handleAttach} />
              
              <input
                type="text"
                className="wa-input"
                placeholder={isListening ? "Listening..." : "Message"}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && ask(input)}
              />

              {hasSupport && !input.trim() && (
                <button 
                  className={`wa-btn wa-mic-btn ${isListening ? 'listening' : ''}`} 
                  onClick={isListening ? stopListening : startListening}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                </button>
              )}
            </div>
            
            <button 
              className="wa-send-btn" 
              onClick={() => ask(input)}
              disabled={loading || (!input.trim() && attachments.length === 0)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>

          {attachments.length > 0 && (
            <div className="wa-attachment-preview">
              {attachments.map((att, i) => (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} key={i} className="wa-att-pill">
                  {att.type === 'image' ? <img src={att.data} style={{ width: '20px', height: '20px' }} /> : '📄'}
                  <span className="wa-att-name">{att.name}</span>
                  <button className="wa-att-close" onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}>✕</button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
