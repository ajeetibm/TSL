import { Bot, Send, Sparkles, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import './FloatingAIButton.css'

// ── Mock AI responses keyed to quick-question chips ─────────────────────────

const QUICK_QUESTIONS = [
  'How do I register a company?',
  'What is CIPC compliance?',
  'Help with director updates',
  'Pricing information',
]

const MOCK_RESPONSES: Record<string, string> = {
  'How do I register a company?':
    'To register a company in South Africa you need to reserve a company name with CIPC, complete the CoR14.1 form, and pay the registration fee. TSL can guide you through the entire process step by step with our legal wizards.',
  'What is CIPC compliance?':
    'CIPC (Companies and Intellectual Property Commission) compliance means keeping your company\'s statutory information up to date — including annual returns, director details, and registered address. TSL helps you stay compliant automatically.',
  'Help with director updates':
    'Director updates are filed with CIPC using form CoR39. You\'ll need the new director\'s ID and consent form. Our wizard walks you through the process in under 10 minutes.',
  'Pricing information':
    'TSL offers three plans — Launchpad (R299/mo), Operator (R999/mo), and Boardroom (R2 499/mo). Each plan includes legal wizards, document storage, and counsel access. Visit our Pricing page for full details.',
}

const FALLBACK_RESPONSES = [
  'Great question! Our legal team can help with that. Would you like to book a counsel session for personalised advice?',
  'That\'s a great area to explore. TSL\'s legal wizards can guide you through the relevant compliance steps. Would you like to get started?',
  'I recommend reviewing our Playbooks & Insights section for detailed guidance on that topic. Can I help you navigate there?',
  'For specific legal advice tailored to your situation, our Counsel service connects you with experienced attorneys. Shall I tell you more?',
]

function getMockResponse(text: string): string {
  const exact = MOCK_RESPONSES[text]
  if (exact) return exact
  const lower = text.toLowerCase()
  if (lower.includes('register') || lower.includes('company')) return MOCK_RESPONSES['How do I register a company?']
  if (lower.includes('cipc') || lower.includes('compli')) return MOCK_RESPONSES['What is CIPC compliance?']
  if (lower.includes('director')) return MOCK_RESPONSES['Help with director updates']
  if (lower.includes('pric') || lower.includes('cost') || lower.includes('plan')) return MOCK_RESPONSES['Pricing information']
  return FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)]
}

// ── Types ────────────────────────────────────────────────────────────────────

type Message = { id: number; from: 'bot' | 'user'; text: string }

let _id = 1
const uid = () => _id++

const WELCOME: Message = {
  id: uid(),
  from: 'bot',
  text: "Hi! I'm TSL AI Assistant. How can I help you with your legal needs today?",
}

// ── Popup component ──────────────────────────────────────────────────────────

function TSLAIChatPopup({ onClose }: { onClose: () => void }) {
  const [messages, setMessages]   = useState<Message[]>([WELCOME])
  const [input, setInput]         = useState('')
  const [isTyping, setIsTyping]   = useState(false)
  const messagesEndRef             = useRef<HTMLDivElement>(null)
  const inputRef                   = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Focus input on open
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 120)
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const sendMessage = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isTyping) return

    setMessages((prev) => [...prev, { id: uid(), from: 'user', text: trimmed }])
    setInput('')
    setIsTyping(true)

    const delay = 800 + Math.random() * 600
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: uid(), from: 'bot', text: getMockResponse(trimmed) }])
      setIsTyping(false)
    }, delay)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <div className="tsl-ai-popup" role="dialog" aria-modal="true" aria-label="TSL AI Assistant">
      {/* Header */}
      <div className="tsl-ai-popup__header">
        <div className="tsl-ai-popup__header-icon">
          <Sparkles size={22} />
        </div>
        <div className="tsl-ai-popup__header-text">
          <h3>TSL AI Assistant</h3>
          <p>Always here to help</p>
        </div>
      </div>

      {/* Messages */}
      <div className="tsl-ai-popup__messages" role="log" aria-live="polite">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`tsl-ai-popup__bubble tsl-ai-popup__bubble--${msg.from}`}
          >
            {msg.text}
          </div>
        ))}
        {isTyping && (
          <div className="tsl-ai-popup__typing" aria-label="TSL AI is typing">
            <span /><span /><span />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick questions */}
      <div className="tsl-ai-popup__quick">
        <p className="tsl-ai-popup__quick-label">Quick questions:</p>
        <div className="tsl-ai-popup__chips">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              className="tsl-ai-popup__chip"
              onClick={() => sendMessage(q)}
              disabled={isTyping}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input row */}
      <form className="tsl-ai-popup__input-row" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          className="tsl-ai-popup__input"
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-label="Message input"
        />
        <button
          type="submit"
          className="tsl-ai-popup__send"
          disabled={!input.trim() || isTyping}
          aria-label="Send message"
        >
          <Send size={17} />
        </button>
      </form>
    </div>
  )
}

// ── Floating button + popup wrapper ─────────────────────────────────────────

export function FloatingAIButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {isOpen && <TSLAIChatPopup onClose={() => setIsOpen(false)} />}

      <motion.button
        type="button"
        className="fixed bottom-5 right-5 z-50 inline-flex min-h-13 items-center gap-3 rounded-full bg-gold px-7 text-sm font-black text-white shadow-premium md:bottom-8 md:right-8"
        whileHover={{ y: -4, scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        aria-label={isOpen ? 'Close TSL AI assistant' : 'Open TSL AI assistant'}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {isOpen ? <X size={18} /> : <Bot size={18} />}
        {isOpen ? 'Close' : 'TSL AI'}
      </motion.button>
    </>
  )
}
