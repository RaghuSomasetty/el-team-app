'use client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function VoltMindWidget() {
  const router = useRouter()

  return (
    <motion.div 
      className="voltmind-widget" 
      onClick={() => router.push('/dashboard/ai-assistant')}
      title="Ask VoltMind AI"
      id="voltmind-floating-widget"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        y: [0, -10, 0] 
      }}
      whileHover={{ scale: 1.1, y: -5 }}
      whileTap={{ scale: 0.9 }}
      transition={{ 
        y: {
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        },
        scale: { type: 'spring', stiffness: 260, damping: 20 }
      }}
    >
      <span className="widget-label" style={{ fontWeight: 700, letterSpacing: '0.5px' }}>VoltMind AI 2.0</span>
      <span className="widget-icon" style={{ fontSize: '20px' }}>💡</span>
    </motion.div>
  )
}
