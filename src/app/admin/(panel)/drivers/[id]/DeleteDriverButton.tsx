'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { useModal } from '@/components/ui/ModalProvider'

export default function DeleteDriverButton({ driverId }: { driverId: string }) {
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  const modal = useModal()

  const handleDelete = async () => {
    const isConfirm = await modal.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบคนขับคนนี้? ข้อมูลการเรียนและการสอบทั้งหมดจะถูกลบด้วย และไม่สามารถกู้คืนได้', 'ลบข้อมูลคนขับ')
    if (!isConfirm) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/drivers/${driverId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        throw new Error('Failed to delete')
      }
      router.push('/admin/drivers')
    } catch (err) {
      console.error(err)
      await modal.alert('เกิดข้อผิดพลาดในการลบคนขับ')
      setDeleting(false)
    }
  }

  return (
    <button onClick={handleDelete} disabled={deleting} className="btn-danger text-sm py-2 px-4 shadow-sm w-full sm:w-auto flex items-center justify-center gap-2">
      {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      {deleting ? 'กำลังลบ...' : 'ลบคนขับ'}
    </button>
  )
}
