import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useNavigate } from 'react-router-dom'

export function WelcomeScreen() {
  const [displayName, setDisplayName] = useState<string>('User')
  const [fadeOut, setFadeOut] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth as any, (u) => {
      const name = u?.displayName || u?.email || 'User'
      setDisplayName(name)
    })
    const t = setTimeout(() => {
      setFadeOut(true)
      setTimeout(() => navigate('/app', { replace: true }), 500)
    }, 2500)
    return () => { unsub(); clearTimeout(t) }
  }, [navigate])

  return (
    <main className="h-screen w-screen relative overflow-hidden" style={{ fontFamily: 'Inter, Poppins, system-ui, -apple-system, Segoe UI, Roboto, Arial' }}>
      {/* Dark gradient background to match login */}
      <div className="absolute inset-0 -z-10" style={{ background: 'linear-gradient(135deg, #0d0b1f 0%, #1a1135 50%, #221d3d 100%)' }} />
      {/* Corner glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-[26rem] w-[26rem] rounded-full" style={{ background: '#7b2ff7', filter: 'blur(120px)', opacity: .45 }} />
        <div className="absolute -bottom-24 -right-24 h-[26rem] w-[26rem] rounded-full" style={{ background: '#f107a3', filter: 'blur(120px)', opacity: .35 }} />
      </div>

      {/* Centered glass card */}
      <section className={`h-full w-full flex justify-center items-center px-6 transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="rounded-[20px] bg-white/5 border border-white/10 backdrop-blur-[20px] shadow-2xl shadow-black/30 px-10 py-12 text-center text-white/90 w-full max-w-xl">
          <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}
            className="text-3xl md:text-4xl font-semibold">
            Welcome back,
            <br />
            {displayName}!
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35, duration: 0.5 }}
            className="mt-3 text-sm text-white/75">
            Warming up your workspace…
          </motion.p>

          {/* Glowing loading indicator */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.55, duration: 0.4 }}
            className="mt-8 flex items-center justify-center">
            <div className="relative h-14 w-14">
              <div className="absolute inset-0 rounded-full" style={{ background: 'linear-gradient(90deg, #7b2ff7 0%, #f107a3 100%)', filter: 'blur(8px)', opacity: .9 }} />
              <div className="absolute inset-1 rounded-full border-2 border-white/20 bg-white/5" />
              <div className="absolute inset-0 animate-ping rounded-full" style={{ background: 'radial-gradient(circle, rgba(123,47,247,0.35) 0%, rgba(241,7,163,0.25) 60%, transparent 70%)' }} />
            </div>
          </motion.div>
        </motion.div>
      </section>
    </main>
  )
}

