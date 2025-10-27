import React from 'react'

export function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow p-4 w-80">
        <div className="font-medium mb-2">Login</div>
        <div className="text-sm text-gray-600 mb-3">Connect your account to continue.</div>
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1.5 rounded border" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
