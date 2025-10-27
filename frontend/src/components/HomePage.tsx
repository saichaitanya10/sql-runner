import React, { useEffect, useState } from 'react'
import { Play, Trash2, LogOut, Sun, Moon, Table as TableIcon, UserRound, ListChecks } from 'lucide-react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../lib/firebase'
import { runQuery, type QueryResult } from '../lib/api'
import { ResultsTable } from './ResultsTable'

export default function HomePage() {
  const [userName, setUserName] = useState<string>('User')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'dark')
  const [query, setQuery] = useState<string>('')
  const [sessionTables, setSessionTables] = useState<string[]>([])
  const [recent, setRecent] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<QueryResult | null>(null)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setUserName('Guest')
      return
    }
    const unsub = onAuthStateChanged(auth as any, (u) => {
      const name = (u?.displayName as string) || (u?.email as string) || 'User'
      setUserName(name)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    try { localStorage.setItem('theme', theme) } catch {}
  }, [theme])

  // recent is session-only now, no persistence

  function toggleTheme() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }

  // Clear session tables when user logs out
  useEffect(() => {
    if (!isFirebaseConfigured) return
    const unsub = onAuthStateChanged(auth as any, (u) => {
      if (!u) {
        setSessionTables([])
        setRecent([])
      }
    })
    return () => unsub()
  }, [])

  function extractCreatedTables(sql: string): string[] {
    const names: string[] = []
    const parts = sql.split(/;\s*/).map((s) => s.trim()).filter(Boolean)
    for (const stmt of parts) {
      const m = stmt.match(/^\s*create\s+table\s+(?:if\s+not\s+exists\s+)?(?:`|"|\[)?([A-Za-z_][A-Za-z0-9_]*)/i)
      if (m) names.push(m[1])
    }
    return names
  }

  async function onRun() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await runQuery(query)
      setResult(res)
      // Track any tables created in this run
      const created = extractCreatedTables(query)
      if (created.length) {
        setSessionTables((prev) => {
          const set = new Set(prev)
          for (const n of created) set.add(n)
          return Array.from(set).sort()
        })
      }
      const q = query.trim()
      if (q) {
        setRecent((prev) => {
          const next = [q, ...prev.filter((x) => x !== q)].slice(0, 20)
          return next
        })
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to run query')
    } finally {
      setLoading(false)
    }
  }

  function onClear() {
    setQuery('')
  }

  return (
    <main className="min-h-screen w-screen relative overflow-hidden" style={{ fontFamily: 'Inter, Poppins, system-ui, -apple-system, Segoe UI, Roboto, Arial' }}>
      {/* Background gradient and corner glows */}
      <div className="absolute inset-0 -z-10" style={{ background: 'linear-gradient(135deg, #0d0b1f 0%, #1a1135 50%, #221d3d 100%)' }} />
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-[28rem] w-[28rem] rounded-full" style={{ background: '#7b2ff7', filter: 'blur(120px)', opacity: 0.4 }} />
        <div className="absolute -bottom-24 -right-24 h-[28rem] w-[28rem] rounded-full" style={{ background: '#06b6d4', filter: 'blur(120px)', opacity: 0.35 }} />
      </div>

      {/* Navbar */}
      <div className="mx-auto max-w-7xl px-3 pt-3">
        <div className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xl shadow-lg px-3 py-2 grid grid-cols-[1fr_auto_1fr] items-center">
          <div className="flex items-center">
            <button onClick={() => signOut(auth as any)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-white text-xs shadow transition-all duration-300 ease-in-out" style={{ background: 'linear-gradient(90deg, #7b2ff7 0%, #f107a3 100%)' }}>
              <LogOut size={14} /> Logout
            </button>
          </div>
          <div className="text-center leading-tight">
            <div className="text-xs text-white/80">Welcome back,</div>
            <div className="text-sm font-semibold text-white">{userName}</div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button onClick={toggleTheme} className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-white/10 border border-white/15 text-xs text-white/80 hover:bg-white/15 transition-all duration-300">
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
            <div className="h-7 w-7 rounded-full bg-white/20 border border-white/25 flex items-center justify-center text-white/90">
              <UserRound size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="mx-auto max-w-7xl px-3 py-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left column 25% (1/4) */}
        <div className="lg:col-span-1 space-y-4">
          {/* Tables */}
          <div className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xl shadow-lg p-3">
            <div className="flex items-center gap-2 text-white/90 font-medium"><TableIcon size={16}/> Tables</div>
            <div className="mt-2 max-h-[36vh] overflow-auto rounded-md bg-white/5 border border-white/10 text-xs text-white/80 p-2">
              {sessionTables.length === 0 ? (
                <div className="text-white/50">No tables</div>
              ) : (
                <ul className="space-y-1">
                  {sessionTables.map((t) => (
                    <li key={t} className="px-2 py-1 rounded hover:bg-white/10 cursor-pointer transition">{t}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Recent Queries */}
          <div className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xl shadow-lg p-3">
            <div className="flex items-center gap-2 text-white/90 font-medium"><ListChecks size={16}/> Recent Queries</div>
            <div className="mt-2 max-h-[28vh] overflow-auto rounded-md bg-white/5 border border-white/10 text-xs text-white/80 p-2">
              {recent.length === 0 ? (
                <div className="text-white/50">No recent queries</div>
              ) : (
                <ul className="space-y-1">
                  {recent.map((q, i) => (
                    <li key={i} className="px-2 py-1 rounded hover:bg-white/10 cursor-pointer transition truncate">{q}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Right column 75% (3/4) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Editor */}
          <div className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xl shadow-lg">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
              <div className="text-white/90 font-medium">Editor</div>
              <div className="flex items-center gap-2">
                <button onClick={onRun} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-white text-xs shadow transition-all duration-300" style={{ background: 'linear-gradient(90deg, #7b2ff7 0%, #f107a3 100%)' }}>
                  <Play size={14}/> Run
                </button>
                <button onClick={onClear} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-white/10 border border-white/15 text-white text-xs hover:bg-white/15 transition-all duration-300">
                  <Trash2 size={14}/> Clear
                </button>
              </div>
            </div>
            <div className="p-3">
              <textarea
                value={query}
                onChange={(e)=>setQuery(e.target.value)}
                placeholder="Write your SQL here..."
                className="w-full h-56 md:h-72 resize-none rounded-xl p-3 text-sm text-white bg-gray-900/40 dark:bg-gray-900/50 border border-white/10 outline-none focus:ring-2 focus:ring-purple-500/70 caret-purple-400 placeholder-white/40"
                style={{ fontFamily: '"Fira Code", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}
              />
            </div>
          </div>

          {/* Results */}
          <div className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xl shadow-lg p-3">
            <div className="text-white/90 font-medium mb-2">Results</div>
            <div className="rounded-xl bg-white/5 border border-white/10 min-h-[8rem] p-3 text-sm text-white/80 overflow-auto">
              {error && <div className="text-red-400">{error}</div>}
              {!error && result && 'columns' in result ? (
                <ResultsTable rows={result.rows} />
              ) : !error && result ? (
                <div>{'message' in result ? result.message : 'OK'}</div>
              ) : (
                <div className="text-white/60">{loading ? 'Running…' : 'Run a query to see results'}</div>
              )}
              {result && (
                <div className="mt-2 text-xs text-white/60">
                  {('rowCount' in (result as any)) ? (result as any).rowCount : 0} rows
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
