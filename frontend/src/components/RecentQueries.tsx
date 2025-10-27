import React from 'react'
import { Code } from 'lucide-react'

export function RecentQueries({ items, onSelect, onClear }: { items: string[]; onSelect: (q: string) => void; onClear: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">Recent Queries</div>
        <button className="text-xs px-2 py-1 rounded border hover:bg-gray-100 dark:hover:bg-gray-800" onClick={onClear}>Clear</button>
      </div>
      <ul className="space-y-1 overflow-auto">
        {items.length === 0 && <li className="text-gray-500 dark:text-gray-400 text-sm">No recent queries</li>}
        {items.map((q, idx) => (
          <li key={idx}>
            <button 
              className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group" 
              onClick={() => onSelect(q)}
              title="Click to load in editor"
            >
              <div className="flex items-start gap-2">
                <Code size={12} className="text-indigo-500 mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                <code className="text-[11px] text-gray-700 dark:text-gray-300 line-clamp-2 flex-1">{q}</code>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
