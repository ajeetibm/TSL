import { Bot } from 'lucide-react'
import { motion } from 'framer-motion'

export function FloatingAIButton() {
  return (
    <motion.button
      type="button"
      className="fixed bottom-5 right-5 z-40 inline-flex min-h-13 items-center gap-3 rounded-full bg-gold px-7 text-sm font-black text-white shadow-premium md:bottom-8 md:right-8"
      whileHover={{ y: -4, scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      aria-label="Open TSL AI assistant"
    >
      <Bot size={18} />
      TSL AI
    </motion.button>
  )
}
