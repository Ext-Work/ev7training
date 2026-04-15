'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { MoreVertical, Settings, Users } from 'lucide-react'

export default function KebabMenu({ courseId }: { courseId: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 animate-fade-in">
          <Link 
            href={`/admin/courses/${courseId}`} 
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-ev7-600 w-full"
          >
            <Settings className="w-4 h-4" />
            จัดการหลักสูตร
          </Link>
          <Link 
            href={`/admin/courses/${courseId}/attendees`} 
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-ev7-600 w-full"
          >
            <Users className="w-4 h-4" />
            ผู้เข้าอบรม
          </Link>
        </div>
      )}
    </div>
  )
}
