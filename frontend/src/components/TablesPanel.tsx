import { useState, useEffect } from 'react'
import clsx from 'clsx'
import { Database, ChevronDown, ChevronRight } from 'lucide-react'
import { getTableInfo, type TableInfo } from '../lib/api'

export function TablesPanel({ tables, activeTable, onSelect }: {
  tables: string[]
  activeTable: string | null
  onSelect: (t: string) => void
}) {
  const [expandedTable, setExpandedTable] = useState<string | null>(null)
  const [tableInfoCache, setTableInfoCache] = useState<Record<string, TableInfo>>({})
  const [loadingInfo, setLoadingInfo] = useState<string | null>(null)

  const toggleExpand = async (tableName: string) => {
    if (expandedTable === tableName) {
      setExpandedTable(null)
      return
    }
    
    setExpandedTable(tableName)
    onSelect(tableName)
    
    // Fetch table info if not cached
    if (!tableInfoCache[tableName]) {
      setLoadingInfo(tableName)
      try {
        const info = await getTableInfo(tableName)
        setTableInfoCache(prev => ({ ...prev, [tableName]: info }))
      } catch (e) {
        console.error('Failed to load table info:', e)
      } finally {
        setLoadingInfo(null)
      }
    }
  }

  return (
    <div className="flex-1 overflow-auto rounded border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-1">
      {tables.length === 0 && (
        <div className="text-gray-500 dark:text-gray-300 text-sm p-2 mt-2">No tables</div>
      )}
      <ul className="space-y-1">
        {tables.map((t) => {
          const isExpanded = expandedTable === t
          const info = tableInfoCache[t]
          const isLoading = loadingInfo === t
          
          return (
            <li key={t} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
              <button
                className={clsx(
                  'w-full text-left px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 inline-flex items-center gap-2 transition-colors',
                  activeTable === t && 'bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                )}
                onClick={() => toggleExpand(t)}
              >
                {isExpanded ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-500" />}
                <Database size={14} className="text-indigo-500"/>
                <span className="flex-1">{t}</span>
              </button>
              
              {isExpanded && (
                <div className="ml-6 mt-1 mb-2 text-xs">
                  {isLoading ? (
                    <div className="text-gray-500 dark:text-gray-400 px-2 py-1">Loading...</div>
                  ) : info ? (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded p-2 space-y-1">
                      <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Columns:</div>
                      {info.columns.map((col, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <span className="font-mono text-[10px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded">
                            {col.type}
                          </span>
                          <span className="font-medium">{col.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 dark:text-gray-400 px-2 py-1">No info available</div>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
