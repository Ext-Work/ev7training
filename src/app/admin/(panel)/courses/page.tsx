'use client'

import { useState, useEffect } from 'react'
import { Plus, BookOpen, ChevronRight, PlayCircle, ClipboardCheck, ToggleLeft, ToggleRight, Loader2, MoreVertical, X } from 'lucide-react'
import KebabMenu from './KebabMenu'

interface CourseItem {
  id: string
  title: string
  description: string | null
  target_car_model: string | null
  pass_score: number
  is_active: boolean
  is_mandatory: boolean
  order_num: number
  steps: { id: string; title: string; step_type: string; order_num: number }[]
  _count: { attempts: number }
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', pass_score: 80, target_car_model: '', is_mandatory: true })
  const [creating, setCreating] = useState(false)
  const [carModels, setCarModels] = useState<string[]>([])
  const [carInput, setCarInput] = useState('')

  useEffect(() => {
    fetchCourses()
    fetchCarModels()
  }, [])

  const fetchCarModels = async () => {
    try {
      const res = await fetch('/api/admin/drivers/car-models')
      const data = await res.json()
      setCarModels(data.models || [])
    } catch(err) {
      console.error(err)
    }
  }

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/admin/courses')
      const data = await res.json()
      setCourses(data.courses || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!form.title) return
    setCreating(true)
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setShowCreate(false)
        setForm({ title: '', description: '', pass_score: 80, target_car_model: '', is_mandatory: true })
        setCarInput('')
        fetchCourses()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCreating(false)
    }
  }

  const handleToggleActive = async (course: CourseItem) => {
    await fetch(`/api/admin/courses/${course.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !course.is_active }),
    })
    fetchCourses()
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-ev7-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการหลักสูตร</h1>
          <p className="text-gray-500 text-sm">{courses.length} หลักสูตร</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary text-sm py-2 px-4"
        >
          <Plus className="w-4 h-4" />
          สร้างหลักสูตร
        </button>
      </div>

      {/* Course Cards */}
      {courses.length === 0 ? (
        <div className="text-center py-16 stat-card">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">ยังไม่มีหลักสูตร</p>
          <p className="text-gray-400 text-sm mt-1">กดปุ่ม &quot;สร้างหลักสูตร&quot; เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {courses.map((course) => {
            const videoSteps = course.steps.filter(s => s.step_type === 'VIDEO')
            const quizSteps = course.steps.filter(s => s.step_type === 'QUIZ')
            return (
              <div
                key={course.id}
                className={`stat-card p-5 transition-all ${!course.is_active ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-gray-900 text-lg truncate">{course.title}</h3>
                      {course.is_active ? (
                        <span className="badge badge-success">เปิดใช้</span>
                      ) : (
                        <span className="badge badge-gray">ปิดอยู่</span>
                      )}
                      {course.is_mandatory ? (
                        <span className="badge border border-red-200 bg-red-50 text-red-600">บังคับ</span>
                      ) : (
                        <span className="badge border border-gray-200 bg-gray-50 text-gray-500">ไม่บังคับ</span>
                      )}
                    </div>
                    {course.description && (
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">{course.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <PlayCircle className="w-3.5 h-3.5" />
                        {videoSteps.length} วิดีโอ
                      </span>
                      <span className="flex items-center gap-1">
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        {quizSteps.length} แบบทดสอบ
                      </span>
                      <span>
                        {course.pass_score === 0 ? 'ไม่ต้องสอบ' : `คะแนนผ่าน ${course.pass_score}%`}
                      </span>
                      {course.target_car_model && (
                        <div className="flex gap-1 flex-wrap">
                          {course.target_car_model.split(',').map(m => m.trim()).filter(Boolean).map(m => (
                            <span key={m} className="bg-ev7-50 text-ev7-600 px-2 rounded-full font-medium">เฉพาะรุ่น: {m}</span>
                          ))}
                        </div>
                      )}
                      <span>{course._count.attempts} ผู้เข้าเรียน</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleToggleActive(course)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                      title={course.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                    >
                      {course.is_active ? (
                        <ToggleRight className="w-5 h-5 text-ev7-500" />
                      ) : (
                        <ToggleLeft className="w-5 h-5" />
                      )}
                    </button>
                    <KebabMenu courseId={course.id} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      </div>

      {/* Create Course Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-6">สร้างหลักสูตรใหม่</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">ชื่อหลักสูตร *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input-field"
                  placeholder="เช่น อบรมพนักงานขับรถ EV7 รุ่นที่ 1"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">คำอธิบาย</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-field min-h-[80px]"
                  rows={3}
                  placeholder="รายละเอียดหลักสูตร (ไม่บังคับ)"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">รุ่นรถที่กำหนด</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.target_car_model.split(',').map(m => m.trim()).filter(Boolean).map(m => (
                    <span key={m} className="bg-ev7-50 border border-ev7-200 text-ev7-600 px-2 py-1 rounded flex items-center gap-1 text-sm">
                      {m}
                      <button
                        type="button"
                        onClick={() => {
                          const current = form.target_car_model.split(',').map(x => x.trim()).filter(Boolean)
                          setForm({ ...form, target_car_model: current.filter(x => x !== m).join(',') })
                        }}
                        className="hover:text-ev7-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={carInput}
                    onChange={(e) => setCarInput(e.target.value)}
                    className="input-field flex-1"
                    placeholder="เช่น AION Y PLUS (พิมพ์หรือเลือกจากรายการ)"
                    list="car-models-list"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (carInput.trim()) {
                          const current = form.target_car_model.split(',').map(x => x.trim()).filter(Boolean)
                          if (!current.includes(carInput.trim())) {
                            setForm({ ...form, target_car_model: [...current, carInput.trim()].join(',') })
                          }
                          setCarInput('')
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (carInput.trim()) {
                        const current = form.target_car_model.split(',').map(x => x.trim()).filter(Boolean)
                        if (!current.includes(carInput.trim())) {
                          setForm({ ...form, target_car_model: [...current, carInput.trim()].join(',') })
                        }
                        setCarInput('')
                      }
                    }}
                    className="btn-secondary px-4 py-2"
                  >
                    เพิ่ม
                  </button>
                </div>
                <datalist id="car-models-list">
                  {carModels.map(m => <option key={m} value={m} />)}
                </datalist>
                <p className="text-xs text-gray-500 mt-2">เว้นว่างไว้หากให้เห็นทุกรุ่น (สามารถเพิ่มได้หลายรุ่น)</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">คะแนนผ่าน (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.pass_score}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setForm({ ...form, pass_score: isNaN(val) ? 0 : val })
                  }}
                  className="input-field w-32"
                />
                <p className="text-xs text-gray-500 mt-2">ใส่ 0 หากเป็นคอร์สให้ความรู้ (Knowledge) ที่ไม่ต้องมีการสอบผ่าน</p>
              </div>
              <div className="flex items-start gap-3 mt-4 mb-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  id="course-mandatory-new"
                  checked={form.is_mandatory}
                  onChange={(e) => setForm({ ...form, is_mandatory: e.target.checked })}
                  className="mt-0.5 w-4 h-4 text-ev7-600 rounded border-gray-300 focus:ring-ev7-500 cursor-pointer"
                />
                <label htmlFor="course-mandatory-new" className="text-sm text-gray-700 cursor-pointer">
                  <span className="block font-semibold">เป็นหลักสูตรบังคับเรียน (Mandatory)</span>
                  <span className="block text-xs text-gray-500 mt-0.5">สถานะคนขับจะผ่านต่อเมื่อเรียนหลักสูตรบังคับทั้งหมดครบถ้วน</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1 py-3">ยกเลิก</button>
                <button
                  onClick={handleCreate}
                  disabled={creating || !form.title}
                  className="btn-primary flex-1 py-3"
                >
                  {creating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> กำลังสร้าง...</>
                  ) : (
                    'สร้างหลักสูตร'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
