'use client'
import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { motion, AnimatePresence } from 'framer-motion'

export default function ChatPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const user = session?.user as any
  const [group, setGroup] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [aiSuggestion, setAiSuggestion] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEnd = useRef<HTMLDivElement>(null)

  // Fetch group and messages on mount
  useEffect(() => {
    const initChat = async () => {
      try {
        const gRes = await fetch('/api/chat/groups')
        const groups = await gRes.json()
        if (groups && groups.length > 0) {
          setGroup(groups[0])
          fetchMessages(groups[0].id)
        }
      } catch (e) {
        console.error('Failed to init chat', e)
      } finally {
        setLoading(false)
      }
    }
    initChat()
  }, [])

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (!group) return
    const interval = setInterval(() => {
      fetchMessages(group.id)
    }, 3000)
    return () => clearInterval(interval)
  }, [group])

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchMessages = async (groupId: string) => {
    try {
      const res = await fetch(`/api/chat/messages?groupId=${groupId}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setMessages(data)
      }
    } catch (e) {
      console.error('Failed to fetch messages', e)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || !group || sending) return
    setSending(true)
    
    const content = input
    setInput('')

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: group.id, content, messageType: 'TEXT' }),
      })
      const data = await res.json()
      
      if (data.message) {
        setMessages(prev => [...prev, data.message])
        if (data.aiExtracted) {
          setAiSuggestion(data.aiExtracted)
        }
      }
    } catch (e) {
      console.error('Failed to send message', e)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault()
      sendMessage() 
    }
  }

  const convertToMIS = async () => {
    if (!aiSuggestion) return
    const misData = {
      date: new Date().toISOString(),
      shift: 'A',
      area: aiSuggestion.area,
      equipmentName: aiSuggestion.equipmentName || 'Motor',
      tagNumber: aiSuggestion.tagMatch || '',
      workType: aiSuggestion.workType,
      description: aiSuggestion.description,
      engineerName: user?.name || 'From Chat',
    }
    await fetch('/api/mis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(misData) })
    setAiSuggestion(null)
  }

  if (loading) {
    return (
      <DashboardLayout title="Team Chat" subtitle="Internal messaging">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
          <span className="spinner" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Team Chat" subtitle="Internal communication channel">
      <div className={`chat-full-screen-container ${aiSuggestion ? 'with-suggestion' : ''}`}>
        {/* Mobile-only Full Screen Header */}
        <div className="wa-header shadow-lg">
          <div className="wa-header-content">
            <button className="back-button" onClick={() => router.push('/dashboard')}>
              <span style={{ fontSize: '24px' }}>←</span>
            </button>
            <div className="wa-avatar">
              <span style={{ fontSize: '24px' }}>💬</span>
            </div>
            <div className="wa-status">
              <div className="wa-title">{group?.name || 'Team Chat'}</div>
              <div className="wa-subtitle">
                <span className="wa-dot" /> Official Maintenance Group
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Header (Hidden on Mobile) */}
        <div className="desktop-chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '26px' }}>💬</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '18px' }}>{group?.name || 'Team Chat'}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                <span className="dot-live" style={{ marginRight: '4px' }} />Official Maintenance Channel
              </div>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="wa-messages-area" id="chat-messages-container">
          <div className="wa-encryption-notice">
            🔒 Secured team communication | <strong>{user?.name}</strong>
          </div>
          
          <div className="wa-messages-list">
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const isMine = msg.senderId === user?.id
                return (
                  <motion.div 
                    key={msg.id} 
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className={`wa-message-row ${isMine ? 'mine' : 'theirs'}`}
                  >
                    {!isMine && (
                      <div className="wa-sender-name">
                        {msg.sender?.name} <span className="wa-designation">{msg.sender?.designation}</span>
                      </div>
                    )}
                    <div className={`wa-bubble ${isMine ? 'sent' : 'received'}`}>
                      <div className="wa-content">{msg.content}</div>
                      <div className="wa-time">
                        {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        {isMine && <span style={{ marginLeft: '4px' }}>✓✓</span>}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
            <div ref={messagesEnd} />
          </div>
        </div>

        {/* AI Suggestion Banner */}
        {aiSuggestion && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="wa-ai-suggestion" 
            onClick={convertToMIS} 
          >
            <div className="wa-ai-suggestion-inner">
              <span style={{ fontSize: '20px' }}>🤖</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>AI TASK DETECTED</div>
                <div style={{ fontSize: '11px', opacity: 0.9 }}>
                  {aiSuggestion.workType} entry | Tag: {aiSuggestion.tagMatch || 'N/A'}
                </div>
              </div>
              <button className="wa-ai-btn">APPROVE MIS</button>
            </div>
          </motion.div>
        )}

        {/* WhatsApp Style Input Bar */}
        <div className="wa-input-area">
          <div className="wa-input-wrapper">
            <button className="wa-action-btn">
              <span style={{ fontSize: '20px' }}>📎</span>
            </button>
            <textarea
              className="wa-textarea"
              placeholder="Type message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button className="wa-action-btn">
              <span style={{ fontSize: '20px' }}>📷</span>
            </button>
          </div>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            className="wa-send-btn shadow-lg" 
            onClick={sendMessage} 
            disabled={sending || !input.trim()} 
          >
            {sending ? '...' : input.trim() ? '➤' : '🎤'}
          </motion.button>
        </div>
      </div>

      <style jsx global>{`
        /* Full Screen Chat Styles */
        .chat-full-screen-container {
          position: fixed;
          top: 10px;
          left: 10px;
          right: 10px;
          bottom: 10px;
          background: var(--bg-primary);
          z-index: 2000;
          display: flex;
          flex-direction: column;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        }

        /* Root scroll lock for Chat full-screen */
        :global(html:has(.chat-full-screen-container)),
        :global(body:has(.chat-full-screen-container)) {
          overflow: hidden !important;
          height: 100vh !important;
          height: 100dvh !important;
          position: fixed;
          width: 100%;
        }

        @media (min-width: 769px) {
          .chat-full-screen-container {
            position: relative;
            height: calc(100vh - 120px);
            border-radius: 24px;
            top: auto; left: auto; right: auto; bottom: auto;
            overflow: hidden;
            border: 1px solid var(--border-color);
            margin: -20px;
          }
          .wa-header { display: none !important; }
        }

        @media (max-width: 768px) {
          .desktop-chat-header { display: none !important; }
          /* Hide Sidebar and Topbar on Mobile */
          .sidebar, .topbar { display: none !important; }
          .main-content { padding: 0 !important; margin: 0 !important; }
        }

        .wa-header {
          background: #1a2235;
          padding: 10px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          z-index: 10;
        }

        .wa-header-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .wa-status { flex: 1; }
        .wa-title { font-weight: 800; font-size: 16px; color: white; }
        .wa-subtitle { font-size: 11px; color: #3b82f6; display: flex; alignItems: center; gap: 4px; }
        .wa-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 10px #10b981; }

        .desktop-chat-header {
          padding: 20px 24px;
          background: rgba(255,255,255,0.02);
          border-bottom: 1px solid var(--border-color);
        }

        .wa-messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          background-image: 
            radial-gradient(var(--bg-card) 0.5px, transparent 0.5px);
          background-size: 15px 15px;
        }

        .wa-encryption-notice {
          text-align: center;
          background: rgba(234, 179, 8, 0.1);
          color: #eab308;
          font-size: 10px;
          padding: 6px 12px;
          border-radius: 8px;
          margin: 0 auto 20px;
          width: fit-content;
        }

        .wa-message-row {
          display: flex;
          flex-direction: column;
          margin-bottom: 16px;
        }
        .wa-message-row.mine { align-items: flex-end; }
        .wa-message-row.theirs { align-items: flex-start; }

        .wa-sender-name {
          font-size: 11px;
          color: #3b82f6;
          font-weight: 700;
          margin-bottom: 4px;
          margin-left: 8px;
        }
        .wa-designation { font-weight: 400; opacity: 0.6; color: white; }

        .wa-bubble {
          max-width: 85%;
          padding: 8px 12px;
          position: relative;
        }

        .wa-bubble.sent {
          background: #075e54;
          color: white;
          border-radius: 12px 0 12px 12px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }

        .wa-bubble.received {
          background: var(--bg-card);
          color: white;
          border-radius: 0 12px 12px 12px;
          border: 1px solid var(--border-color);
        }

        .wa-time {
          font-size: 9px;
          opacity: 0.6;
          text-align: right;
          margin-top: 4px;
          display: flex;
          justify-content: flex-end;
          align-items: center;
        }

        .wa-input-area {
          padding: 10px 12px;
          display: flex;
          align-items: flex-end;
          gap: 8px;
          background: rgba(0,0,0,0.2);
          backdrop-filter: blur(10px);
        }

        .wa-input-wrapper {
          flex: 1;
          background: #202c33;
          border-radius: 24px;
          display: flex;
          align-items: center;
          padding: 4px 8px;
          min-height: 48px;
        }

        .wa-textarea {
          flex: 1;
          background: transparent;
          border: none;
          color: white;
          padding: 8px 4px;
          font-size: 15px;
          resize: none;
          outline: none;
        }

        .wa-action-btn {
          background: transparent;
          border: none;
          color: #8696a0;
          padding: 8px;
          cursor: pointer;
        }

        .wa-send-btn {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #00a884;
          border: none;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          cursor: pointer;
        }

        .wa-ai-suggestion {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.9));
          margin: 8px;
          border-radius: 12px;
          padding: 12px;
          color: white;
          box-shadow: 0 -4px 15px rgba(0,0,0,0.2);
        }
        .wa-ai-suggestion-inner { display: flex; alignItems: center; gap: 12px; }
        .wa-ai-btn {
          background: white;
          color: #2563eb;
          border: none;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 900;
          cursor: pointer;
        }
      `}</style>
    </DashboardLayout>
  )
}
