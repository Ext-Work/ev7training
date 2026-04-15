'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, XCircle, Search, Trophy } from 'lucide-react'
import { useModal } from '@/components/ui/ModalProvider'
import { formatDate } from '@/lib/utils'

export default function AttendeesPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id: courseId } = use(params)
  const modal = useModal()
  
  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchCourse()
  }, [])

  const fetchCourse = async () => {
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`)
      const data = await res.json()
      setCourse(data)
    } finally {
      setLoading(false)
    }
  }

  const togglePassedStatus = async (driverId: string, currentPassed: boolean) => {
    if (!(await modal.confirm('ยืนยันการเปลี่ยนสถานะ', `ต้องการเปลี่ยนสถานะเป็น "${currentPassed ? 'กำลังเรียน' : 'ผ่านแล้ว'}" ใช่หรือไม่?`))) return
    
    try {
      await fetch(`/api/admin/courses/${courseId}/attendees`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driver_id: driverId, passed: !currentPassed }),
      })
      fetchCourse() // refresh list
    } catch (err) {
      console.error(err)
      await modal.alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ")
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-ev7-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!course) return <div>ไม่พบหลักสูตร</div>

  const attempts = course.attempts || []
  const filtered = attempts.filter((a: any) => 
    a.driver.full_name.toLowerCase().includes(search.toLowerCase()) ||
    a.driver.national_id.includes(search)
  )

  return (
    <div className="space-y-6 animate-fade-in relative pb-16">
      <Link href="/admin/courses" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-5 h-5" />
        กลับไปจัดการหลักสูตร
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">ผู้เข้าอบรมหลักสูตร</h1>
        <h2 className="text-xl text-ev7-600 font-semibold">{course.title}</h2>
      </div>

      <div className="stat-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อผู้เข้าอบรม หรือ เลขบัตรประชาชน..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="text-sm font-semibold text-gray-600">
            รวม {attempts.length} คน
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-gray-500 py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            ไม่พบผู้เข้าเรียน
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-sm text-gray-500">
                  <th className="pb-3 font-medium">ชื่อคนขับ</th>
                  <th className="pb-3 font-medium">สถานะ</th>
                  <th className="pb-3 font-medium">คะแนน</th>
                  <th className="pb-3 font-medium">เข้าเรียนล่าสุด</th>
                  <th className="pb-3 font-medium text-right">อัปเดตสถานะ</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700">
                {filtered.map((a: any) => (
                  <tr key={a.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="py-4">
                      <div className="font-semibold text-gray-900">{a.driver.full_name}</div>
                      <div className="text-xs text-gray-500">{a.driver.national_id}</div>
                    </td>
                    <td className="py-4">
                      <span className={`badge ${a.passed ? 'badge-success' : 'bg-amber-100 text-amber-700'}`}>
                        {a.passed ? 'ผ่านแล้ว' : 'กำลังเรียน'}
                      </span>
                    </td>
                    <td className="py-4 font-semibold">{a.score}%</td>
                    <td className="py-4 text-xs text-gray-400">
                      {formatDate(a.updated_at)}
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => togglePassedStatus(a.driver.id, a.passed)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all shadow-sm ${
                          a.passed 
                            ? 'bg-amber-100 hover:bg-amber-200 text-amber-700' 
                            : 'bg-ev7-500 hover:bg-ev7-600 text-white'
                        }`}
                      >
                        {a.passed ? 'ปรับเป็น "กำลังเรียน"' : 'ให้ "ผ่าน" ทันที'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
