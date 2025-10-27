import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { auth, googleProvider } from '../lib/firebase'
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'

export function LoginPage() {
  const [showPwd, setShowPwd] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  async function handleEmailLogin() {
    setError(null)
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth as any, email, password)
    } catch (e: any) {
      setError(e?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    if (!googleProvider) return
    setError(null)
    setLoading(true)
    try {
      await signInWithPopup(auth as any, googleProvider)
    } catch (e: any) {
      setError(e?.message || 'Google login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="h-screen w-screen relative overflow-hidden" style={{ fontFamily: 'Inter, Poppins, system-ui, -apple-system, Segoe UI, Roboto, Arial' }}>
      {/* Dark gradient background (improved palette) */}
      <div className="absolute inset-0 -z-10" style={{ background: 'linear-gradient(135deg, #0d0b1f 0%, #1a1135 50%, #221d3d 100%)' }} />
      {/* Corner glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-[26rem] w-[26rem] rounded-full" style={{ background: '#7b2ff7', filter: 'blur(120px)', opacity: .45 }} />
        <div className="absolute -bottom-24 -right-24 h-[26rem] w-[26rem] rounded-full" style={{ background: '#f107a3', filter: 'blur(120px)', opacity: .35 }} />
      </div>

      {/* Centered container */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="h-full w-full flex flex-col lg:flex-row justify-center items-center gap-8 px-4">
        {/* Left glass card (slightly smaller) */}
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
          className="w-full max-w-md order-2 lg:order-1">
          <div className="rounded-[20px] bg-white/5 border border-white/10 backdrop-blur-[20px] shadow-xl shadow-black/20 p-6 md:p-8 text-white/90 transition duration-300">
            <h2 className="text-2xl md:text-3xl font-semibold">Run SQL with style</h2>
            <p className="mt-2 text-sm text-white/70">Secure, fast, and beautiful. Query your data effortlessly.</p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {['SELECT','INSERT','JOIN'].map((label) => (
                <button key={label} className="rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.12)] px-4 py-3 text-sm transition duration-300">
                  {label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right auth card (primary) */}
        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
          className="w-full max-w-lg order-1 lg:order-2">
          <div className="rounded-[20px] bg-white/5 border border-white/10 backdrop-blur-[20px] shadow-2xl shadow-black/30 p-6 md:p-7 text-white/90 transition duration-300">
            <div className="text-lg font-semibold">Welcome</div>
            <div className="text-xs text-white/60 mb-3">Authenticate to continue to SQL Runner</div>

              {/* Tabs */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button onClick={() => setMode('signin')} className={`h-10 rounded-lg border ${mode==='signin' ? 'bg-white text-gray-900' : 'bg-white/10 text-white/80'} border-white/15 flex items-center justify-center text-xs gap-2 transition duration-300`}>
                  <ArrowRight size={14}/> Sign In
                </button>
                <button onClick={() => setMode('signup')} className={`h-10 rounded-lg border ${mode==='signup' ? 'bg-white text-gray-900' : 'bg-white/10 text-white/80'} border-white/15 flex items-center justify-center text-xs transition duration-300`}>
                  Sign Up
                </button>
              </div>

              {/* Email */}
              <label className="block text-xs text-white/70">Email</label>
              <div className="mt-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60"><Mail size={16}/></span>
                <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/80 text-sm transition duration-300" />
              </div>

              {/* Password */}
              <label className="block text-xs text-white/70 mt-3">Password</label>
              <div className="mt-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60"><Lock size={16}/></span>
                <input type={showPwd?'text':'password'} value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2 rounded-lg border border-white/10 bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/80 text-sm transition duration-300" />
                <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white" onClick={()=>setShowPwd(v=>!v)}>
                  {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>

              {/* Extras */}
              <div className="mt-3 flex items-center justify-between text-xs">
                <label className="inline-flex items-center gap-2 select-none">
                  <input type="checkbox" checked={remember} onChange={(e)=>setRemember(e.target.checked)} className="accent-purple-500" />
                  Remember me
                </label>
                <a href="#" className="text-white/70 hover:text-white">Forgot password?</a>
              </div>

              {/* Error */}
              {error && <div className="mt-3 text-xs text-red-400">{error}</div>}

              {/* Sign In button */}
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={handleEmailLogin} disabled={loading}
                className="mt-4 w-full h-10 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition duration-300 shadow-[0_10px_30px_rgba(123,47,247,0.35)] hover:shadow-[0_0_35px_rgba(241,7,163,0.55)]"
                style={{ background: 'linear-gradient(90deg, #7b2ff7 0%, #f107a3 100%)' }}>
                {loading ? 'Signing in…' : mode==='signin' ? 'Sign In' : 'Create account'}
              </motion.button>

              {/* or divider */}
              <div className="my-3 flex items-center gap-2 text-xs text-white/50">
                <div className="h-px bg-white/15 flex-1"/>
                <span>or</span>
                <div className="h-px bg-white/15 flex-1"/>
              </div>

              {/* Google */}
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={handleGoogle} disabled={loading || !googleProvider}
                className="w-full h-10 rounded-lg border border-white/15 bg-white/5 text-white/90 text-sm inline-flex items-center justify-center gap-2 transition duration-300 hover:bg-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 533.5 544.3" className="h-4 w-4"><path fill="#4285F4" d="M533.5 278.4c0-18.5-1.5-37-4.6-54.8H272v103.8h146.9c-6.3 34.6-25.3 63.8-54 83.4v68h87.2c51.1-47 81.4-116.2 81.4-200.4z"/><path fill="#34A853" d="M272 544.3c73.5 0 135.1-24.3 180.2-66.1l-87.2-68c-24.2 16.3-55.1 25.8-93 25.8-71.4 0-132-48.2-153.7-113.2H27.6v70.9C72.3 480.3 165.2 544.3 272 544.3z"/><path fill="#FBBC05" d="M118.3 322.8c-10.9-32.6-10.9-67.8 0-100.4v-70.9H27.6c-44.3 88.6-44.3 192.8 0 281.8l90.7-70.5z"/><path fill="#EA4335" d="M272 107.7c39.9-.6 78.2 14.3 107.5 41.7l80.2-80.2C409.9 24.4 351.5 0 272 0 165.2 0 72.3 64 27.6 159.8l90.7 70.9C139.9 155.7 200.5 107.7 272 107.7z"/></svg>
                Continue with Google
              </motion.button>

              <div className="mt-4 text-xs text-white/70 text-center">
                New here? <a href="#" onClick={(e)=>{e.preventDefault(); setMode('signup')}} className="hover:underline">Create an account</a>
              </div>
            </div>
          </motion.div>
        </motion.section>
    </main>
  )
}
