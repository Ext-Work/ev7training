'use client'

import { useState, useEffect, useRef } from 'react'
import { PlayCircle, Save, Loader2, CheckCircle2, Upload, FileVideo } from 'lucide-react'
import { useModal } from '@/components/ui/ModalProvider'

interface VideoData {
  id?: string
  title: string
  url: string
  required_watch_percentage: number
}

export default function VideosPage() {
  const modal = useModal()
  const [video, setVideo] = useState<VideoData>({ title: '', url: '', required_watch_percentage: 95 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchVideo()
  }, [])

  const fetchVideo = async () => {
    try {
      const res = await fetch('/api/admin/video')
      const data = await res.json()
      if (data.id) setVideo(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate on client side too
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
    if (!allowedTypes.includes(file.type)) {
      await modal.alert('รองรับเฉพาะไฟล์วิดีโอ (MP4, WebM, MOV, AVI)')
      return
    }

    if (file.size > 500 * 1024 * 1024) {
      await modal.alert('ไฟล์วิดีโอต้องไม่เกิน 500MB')
      return
    }

    setUploading(true)
    setUploadProgress(`กำลังอัปโหลด ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)...`)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/video/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        await modal.alert(data.error || 'อัปโหลดไม่สำเร็จ')
        return
      }

      // Set the URL from S3
      setVideo(prev => ({ ...prev, url: data.url }))
      setUploadProgress('✅ อัปโหลดสำเร็จ!')
      setTimeout(() => setUploadProgress(''), 3000)
    } catch (err) {
      console.error(err)
      await modal.alert('เกิดข้อผิดพลาดในการอัปโหลด')
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await fetch('/api/admin/video', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(video),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-ev7-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">จัดการวิดีโอ</h1>
        <p className="text-gray-500 text-sm">ตั้งค่าวิดีโออบรมสำหรับคนขับ</p>
      </div>

      <div className="stat-card p-6 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <PlayCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">วิดีโออบรม</h2>
            <p className="text-xs text-gray-400">ตั้งค่าวิดีโอที่คนขับจะต้องดู</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">ชื่อวิดีโอ</label>
          <input
            type="text"
            value={video.title}
            onChange={(e) => setVideo({ ...video, title: e.target.value })}
            className="input-field"
            placeholder="เช่น วิดีโออบรมการขับรถ EV7"
          />
        </div>

        {/* File Upload Section */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">อัปโหลดวิดีโอ</label>
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
              uploading ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-ev7-400 hover:bg-gray-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
              onChange={handleFileUpload}
              className="hidden"
              id="video-upload"
              disabled={uploading}
            />
            {uploading ? (
              <div className="space-y-2">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto" />
                <p className="text-sm text-blue-600 font-medium">{uploadProgress}</p>
              </div>
            ) : (
              <label htmlFor="video-upload" className="cursor-pointer space-y-2 block">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 font-medium">คลิกเพื่ออัปโหลดวิดีโอ</p>
                <p className="text-xs text-gray-400">รองรับ MP4, WebM, MOV, AVI (สูงสุด 500MB)</p>
              </label>
            )}
          </div>
          {uploadProgress && !uploading && (
            <p className="text-xs text-green-600 mt-1">{uploadProgress}</p>
          )}
        </div>

        {/* URL Display */}
        {video.url && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">URL วิดีโอ</label>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <FileVideo className="w-4 h-4 text-green-500 flex-shrink-0" />
              <p className="text-sm text-gray-700 break-all flex-1 select-all">{video.url}</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(video.url)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
                className="flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-gray-200 hover:bg-gray-100 transition-colors"
                title="คัดลอก URL"
              >
                {copied ? '✅ คัดลอกแล้ว' : '📋 คัดลอก'}
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            เปอร์เซ็นต์ที่ต้องดู (%)
          </label>
          <input
            type="number"
            min={50}
            max={100}
            value={video.required_watch_percentage}
            onChange={(e) => setVideo({ ...video, required_watch_percentage: parseInt(e.target.value) || 95 })}
            className="input-field w-32"
          />
        </div>

        {/* Preview */}
        {video.url && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">ตัวอย่าง</label>
            <video
              src={video.url}
              controls
              className="w-full rounded-xl aspect-video bg-black"
            />
          </div>
        )}

        <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3 rounded-xl">
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin inline mr-2" /> กำลังบันทึก...</>
          ) : saved ? (
            <><CheckCircle2 className="w-4 h-4 inline mr-2" /> บันทึกแล้ว!</>
          ) : (
            <><Save className="w-4 h-4 inline mr-2" /> บันทึก</>
          )}
        </button>
      </div>
    </div>
  )
}
