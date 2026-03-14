'use client'

import { motion } from 'framer-motion'

export default function BulbLoading() {
  return (
    <div className="bulb-loading-container">
      <motion.div
        className="bulb"
        animate={{
          filter: [
            'drop-shadow(0 0 10px rgba(250, 204, 21, 0.4))',
            'drop-shadow(0 0 25px rgba(250, 204, 21, 0.9)) drop-shadow(0 0 40px rgba(255, 255, 255, 0.5))',
            'drop-shadow(0 0 10px rgba(250, 204, 21, 0.4))'
          ],
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        💡
      </motion.div>

      <style jsx>{`
        .bulb-loading-container {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 15px;
        }

        .bulb {
          font-size: 48px;
        }
      `}</style>
    </div>
  )
}
