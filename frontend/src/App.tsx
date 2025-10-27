import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { SqlEditor } from './components/SqlEditor'
import { ResultsTable } from './components/ResultsTable'
import { TablesPanel } from './components/TablesPanel'
import { RecentQueries } from './components/RecentQueries'
import { getTables, getTableInfo, runQuery, type QueryResult, type TableInfo } from './lib/api'
import { toCSV, downloadCSV } from './lib/csv'
import { Sun, Moon, LogOut, Search, Play, Save, Trash2, Table as TableIcon, User } from 'lucide-react'
import { auth, isFirebaseConfigured } from './lib/firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'

export default function App() {
  const [query, setQuery] = useState<string>('SELECT * FROM Customers LIMIT 5;')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [tables, setTables] = useState<string[]>([])
  const [activeTable, setActiveTable] = useState<string | null>(null)
  const [tableInfo, setTableInfo] = useState<TableInfo | null>(null)
  const [tableSearch, setTableSearch] = useState('')
  const [recent, setRecent] = useState<string[]>([])
  const [logs, setLogs] = useState<string[]>([])
  const [tab, setTab] = useState<'results' | 'recent' | 'logs'>('results')
  const [userName, setUserName] = useState<string>('User')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as any) || 'light')

  useEffect(() => {
    // Fetch table list on load
    getTables()
      .then((t) => setTables(t))
      .catch(() => setTables([]))
    // Load recent
    try { const raw = localStorage.getItem('recentQueries'); if (raw) setRecent(JSON.parse(raw)) } catch {}
    // Watch auth for user name only if Firebase is configured
    if (!isFirebaseConfigured) return
    const unsub = onAuthStateChanged(auth as any, (u) => {
      if (u) setUserName(u.displayName || u.email || 'User')
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!activeTable) return
    getTableInfo(activeTable)
      .then((info) => setTableInfo(info))
      .catch(() => setTableInfo(null))
  }, [activeTable])

  const canRun = useMemo(() => query.trim().length > 0, [query])
  const filteredTables = useMemo(() => {
    const q = tableSearch.trim().toLowerCase()
    if (!q) return tables
    return tables.filter((t) => t.toLowerCase().includes(q))
  }, [tableSearch, tables])

  async function onRun() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      setLogs((l) => [`[${new Date().toLocaleTimeString()}] ▶ Running…`, ...l])
      const res = await runQuery(query)
      setResult(res)
      setTab('results')
      const q = query.trim()
      if (q) {
        setRecent((prev) => {
          const next = [q, ...prev.filter((x) => x !== q)].slice(0, 20)
          try { localStorage.setItem('recentQueries', JSON.stringify(next)) } catch {}
          return next
        })
      }
      setLogs((l) => [`[${new Date().toLocaleTimeString()}] ✓ Done`, ...l])
    } catch (e: any) {
      setError(e?.message || 'Failed to run query')
      setLogs((l) => [`[${new Date().toLocaleTimeString()}] ✗ ${e?.message || 'Error'}`, ...l])
    } finally {
      setLoading(false)
    }
  }

  function onClear() {
    setQuery('')
  }

  function onSaveQuery() {
    const q = query.trim()
    if (!q) return
    setRecent((prev) => {
      const next = [q, ...prev.filter((x) => x !== q)].slice(0, 20)
      try { localStorage.setItem('recentQueries', JSON.stringify(next)) } catch {}
      return next
    })
  }

  function onExportCSV() {
    if (!result || !('columns' in result)) return
    const csv = toCSV(result.columns, result.rows)
    downloadCSV('results.csv', csv)
  }

  function onToggleTheme() {
    setTheme((p) => {
      const n = p === 'dark' ? 'light' : 'dark'
      const root = document.documentElement
      if (n === 'dark') root.classList.add('dark'); else root.classList.remove('dark')
      try { localStorage.setItem('theme', n) } catch {}
      return n
    })
  }

  async function onLogout() { try { await signOut(auth as any) } catch {} }

  return (
    <div className="relative min-h-screen w-screen text-sm text-gray-900 dark:text-gray-100" style={{ fontFamily: 'Inter, Poppins, system-ui, -apple-system, Segoe UI, Roboto, Arial' }}>
      {/* Animated background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute h-80 w-80 rounded-full blur-3xl opacity-40 bg-gradient-to-br from-fuchsia-500 via-indigo-500 to-cyan-400 left-10 top-10 animate-pulse" />
        <div className="absolute right-16 bottom-10 h-72 w-72 rounded-full blur-3xl opacity-30 bg-gradient-to-br from-cyan-400 via-sky-500 to-purple-500" />
      </div>

      {/* Navbar */}
      <div className="sticky top-0 z-20">
        <motion.div whileHover={{ scale: 1.002 }} className="mx-auto max-w-7xl px-3 pt-3">
          <div className="rounded-2xl p-[1px] bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#06B6D4]">
            <div className="rounded-2xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border border-white/30 dark:border-white/10 px-3 py-2 flex items-center justify-between">
              <div className="font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-fuchsia-500">SQL Runner</div>
              <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Welcome back, {userName} 🚀</div>
              <div className="flex items-center gap-2">
                <button className="inline-flex items-center gap-1 px-2 py-1 rounded border text-xs hover:bg-gray-100 dark:hover:bg-gray-800" onClick={onToggleTheme}>
                  {theme === 'dark' ? <Sun size={14}/> : <Moon size={14}/>}
                  <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
                </button>
                <button className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs shadow-md hover:shadow-lg" onClick={onLogout}>
                  <LogOut size={14}/> Logout
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="mx-auto max-w-7xl px-3 py-3 grid grid-cols-1 lg:grid-cols-[18rem_1fr_22rem] gap-4 lg:gap-6">
        {/* Left: Tables */}
        <motion.div whileHover={{ scale: 1.01 }} className="rounded-2xl p-[1px] bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#06B6D4]">
          <div className="rounded-2xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border border-white/30 dark:border-white/10 p-3 h-[38vh] lg:h-[76vh] flex flex-col">
            <div className="flex items-center gap-2 font-semibold"><TableIcon size={16}/> Tables</div>
            <div className="mt-2 relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500"><Search size={14}/></span>
              <input value={tableSearch} onChange={(e) => setTableSearch(e.target.value)} placeholder="Search tables" className="w-full pl-7 pr-2 py-1.5 rounded border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-gray-900/60 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
            </div>
            <div className="mt-2 flex-1 overflow-auto rounded">
              <TablesPanel tables={filteredTables} activeTable={activeTable} onSelect={(t) => setActiveTable(t)} />
            </div>
          </div>
        </motion.div>

        {/* Center: Editor */}
        <motion.div whileHover={{ scale: 1.01 }} className="rounded-2xl p-[1px] bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#06B6D4]">
          <div className="rounded-2xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border border-white/30 dark:border-white/10 h-[38vh] lg:h-[76vh] flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200/60 dark:border-white/10">
              <div className="text-sm font-medium">Editor</div>
              <div className="flex items-center gap-2">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs shadow-md hover:shadow-lg" onClick={onRun} disabled={!canRun || loading}>
                  <Play size={14}/> {loading ? 'Running…' : 'Run'}
                </motion.button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="inline-flex items-center gap-1 px-2 py-1 rounded border text-xs hover:bg-gray-100 dark:hover:bg-gray-800" onClick={onClear}>
                  <Trash2 size={14}/> Clear
                </motion.button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="inline-flex items-center gap-1 px-2 py-1 rounded border text-xs hover:bg-gray-100 dark:hover:bg-gray-800" onClick={onSaveQuery}>
                  <Save size={14}/> Save
                </motion.button>
              </div>
            </div>
            <div className="p-2 flex-1 overflow-hidden" style={{ fontFamily: '"Fira Code", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}>
              <div className="rounded overflow-hidden h-full">
                <SqlEditor value={query} onChange={setQuery} onRun={onRun} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right: Results / Recent / Logs */}
        <motion.div whileHover={{ scale: 1.01 }} className="rounded-2xl p-[1px] bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#06B6D4]">
          <div className="rounded-2xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border border-white/30 dark:border-white/10 h-[38vh] lg:h-[76vh] flex flex-col">
            <div className="px-2 pt-2">
              <div className="inline-flex items-center rounded bg-white/70 dark:bg-gray-900/60 border border-gray-200 dark:border-white/10 p-0.5">
                {(['results','recent','logs'] as const).map((t) => (
                  <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 text-xs rounded ${tab===t? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow' : 'text-gray-700 dark:text-gray-300'}`}>{t[0].toUpperCase()+t.slice(1)}</button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-auto p-2">
              {tab === 'results' && (
                <div>
                  {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
                  {result && 'columns' in result ? (
                    <>
                      <ResultsTable rows={result.rows} />
                      <div className="text-xs text-gray-600 dark:text-gray-300 mt-2">{result.rowCount} rows • {result.elapsedMs} ms</div>
                      <div className="mt-2">
                        <button className="px-3 py-1.5 rounded bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900 text-xs" onClick={onExportCSV}>Export CSV</button>
                      </div>
                    </>
                  ) : !result ? (
                    <div className="text-gray-500 text-sm">Run a query to see results</div>
                  ) : (
                    <div className="rounded border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-800 p-2 text-sm">{'message' in result ? result.message : 'OK'}</div>
                  )}
                </div>
              )}
              {tab === 'recent' && (
                <RecentQueries items={recent} onSelect={(q) => setQuery(q)} onClear={() => { setRecent([]); try { localStorage.removeItem('recentQueries') } catch {} }} />
              )}
              {tab === 'logs' && (
                <ul className="text-xs space-y-1">
                  {logs.map((l, i) => <li key={i} className="px-2 py-1 rounded bg-white/70 dark:bg-gray-900/60 border border-gray-200 dark:border-white/10">{l}</li>)}
                  {logs.length===0 && <li className="text-gray-500">No logs yet</li>}
                </ul>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
