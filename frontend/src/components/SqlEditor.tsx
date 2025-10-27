import Editor, { OnMount } from '@monaco-editor/react'
import { useEffect, useRef } from 'react'

export function SqlEditor({ value, onChange, onRun, isDark }: {
  value: string
  onChange: (v: string) => void
  onRun: () => void
  isDark?: boolean
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes('mac')
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        onRun()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onRun])

  const monacoRef = useRef<any>(null)

  const handleMount: OnMount = (editor, monaco) => {
    monacoRef.current = monaco
    monaco.editor.defineTheme('neutral-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '3f3f46' },
        { token: 'type', foreground: '3f3f46' },
        { token: 'number', foreground: '52525b' },
        { token: 'string', foreground: '52525b' },
        { token: 'operator', foreground: '3f3f46' },
      ],
      colors: {
        'editor.foreground': '#111827',
        'editor.background': '#ffffff',
        'editorLineNumber.foreground': '#9ca3af',
        'editorCursor.foreground': '#374151',
        'editor.selectionBackground': '#e5e7eb',
        'editor.lineHighlightBackground': '#f3f4f6',
      },
    })
    monaco.editor.defineTheme('neutral-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'd1d5db' },
        { token: 'type', foreground: 'd1d5db' },
        { token: 'number', foreground: 'a1a1aa' },
        { token: 'string', foreground: 'a1a1aa' },
        { token: 'operator', foreground: 'd1d5db' },
      ],
      colors: {
        'editor.foreground': '#e5e7eb',
        'editor.background': '#111827',
        'editorLineNumber.foreground': '#6b7280',
        'editorCursor.foreground': '#e5e7eb',
        'editor.selectionBackground': '#374151',
        'editor.lineHighlightBackground': '#1f2937',
      },
    })
    monaco.editor.setTheme(isDark ? 'neutral-dark' : 'neutral-light')
  }

  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(isDark ? 'neutral-dark' : 'neutral-light')
    }
  }, [isDark])

  return (
    <div className="rounded border overflow-hidden editor-container">
      <Editor
        height="100%"
        defaultLanguage="sql"
        value={value}
        onChange={(v) => onChange(v || '')}
        onMount={handleMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  )
}
