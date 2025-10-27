import React from 'react'
import { SqlEditor } from './SqlEditor'

export function EditorSection({ value, onChange, onRun }: { value: string; onChange: (v: string) => void; onRun: () => void }) {
  return (
    <div className="rounded border">
      <SqlEditor value={value} onChange={onChange} onRun={onRun} />
    </div>
  )
}
