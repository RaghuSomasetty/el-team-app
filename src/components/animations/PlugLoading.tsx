'use client'

import { motion } from 'framer-motion'

export default function PlugLoading() {
  const phases = [
    { name: 'R', color: '#ef4444', angle: 0 },
    { name: 'Y', color: '#facc15', angle: 120 },
    { name: 'B', color: '#3b82f6', angle: 240 },
  ]

  return (
    <div className="plug-loading-container">
      <div className="circular-socket-scene">
        {/* The Round Socket Outer Ring */}
        <div className="socket-ring">
          {/* Phase Points (RYB) */}
          {phases.map((p) => (
            <motion.div
              key={p.name}
              className="phase-light"
              style={{ 
                background: p.color,
                boxShadow: `0 0 10px ${p.color}`,
                transform: `rotate(${p.angle}deg) translateY(-22px)` 
              }}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: p.angle / 120 * 0.5,
              }}
            />
          ))}
        </div>

        {/* The Rotating Synchronizer (Plug Action) */}
        <motion.div 
          className="sync-hub"
          animate={{ rotate: 360 }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        >
          <div className="sync-connector red" />
          <div className="sync-connector yellow" />
          <div className="sync-connector blue" />
        </motion.div>

        {/* Central Core */}
        <motion.div 
          className="socket-core"
          animate={{
            boxShadow: [
              '0 0 10px rgba(59, 130, 246, 0.2)',
              '0 0 25px rgba(59, 130, 246, 0.6)',
              '0 0 10px rgba(59, 130, 246, 0.2)',
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="inner-bolt">⚡</div>
        </motion.div>
      </div>

      <style jsx>{`
        .plug-loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 15px;
        }

        .circular-socket-scene {
          position: relative;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .socket-ring {
          position: absolute;
          width: 60px;
          height: 60px;
          border: 3px solid rgba(255,255,255,0.05);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .phase-light {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .sync-hub {
          position: absolute;
          width: 70px;
          height: 70px;
          border-radius: 50%;
          z-index: 10;
        }

        .sync-connector {
          position: absolute;
          top: 0;
          left: 50%;
          width: 4px;
          height: 12px;
          margin-left: -2px;
          border-radius: 2px;
        }

        .sync-connector.red { background: #ef4444; transform: rotate(0deg); transform-origin: 2px 35px; }
        .sync-connector.yellow { background: #facc15; transform: rotate(120deg); transform-origin: 2px 35px; }
        .sync-connector.blue { background: #3b82f6; transform: rotate(240deg); transform-origin: 2px 35px; }

        .socket-core {
          width: 34px;
          height: 34px;
          background: #1e293b;
          border: 2px solid #334155;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 5;
        }

        .inner-bolt {
          font-size: 16px;
          color: #60a5fa;
        }
      `}</style>
    </div>
  )
}
