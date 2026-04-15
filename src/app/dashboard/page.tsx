'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ClipboardCheck, Award, ChevronRight, CheckCircle2, Lock, BookOpen, PlayCircle } from 'lucide-react'

interface ProgressData {
  videoProgress: number
  videoCompleted: boolean
  quizPassed: boolean
  quizAttempts: number
  maxAttempts: number
  quizScore: number | null
  certificateNo: string | null
  onboardingStatus: string
}

interface CourseItem {
  id: string
  title: string
  description: string | null
  steps: { 
    id: string; 
    title: string; 
    step_type: string; 
    order_num: number;
    is_required: boolean;
    completed: boolean;
    score: number | null;
  }[]
  completedSteps: number
  totalSteps: number
  courseCompleted: boolean
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [progress, setProgress] = useState<ProgressData | null>(null)
  const [courses, setCourses] = useState<CourseItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    try {
      const [progressRes, coursesRes] = await Promise.all([
        fetch('/api/driver/progress'),
        fetch('/api/driver/courses'),
      ])
      const progressData = await progressRes.json()
      const coursesData = await coursesRes.json()
      setProgress(progressData)
      setCourses(coursesData.courses || [])
    } catch (err) {
      console.error('Failed to fetch:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-ev7-500 border-t-transparent rounded-full" />
      </div>
    )
  }


  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome */}
      <div className="gradient-bg rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-1/2 w-24 h-24 rounded-full bg-white/5" />
        <div className="relative z-10">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">
            สวัสดี, {session?.user?.name} 👋
          </h1>
          <p className="text-white/80">
            {progress?.onboardingStatus === 'PASSED'
              ? 'คุณผ่านการอบรมเรียบร้อยแล้ว!'
              : 'มาเริ่มการอบรมเพื่อรับใบ Certificate กันเลย'}
          </p>
        </div>
      </div>

      {/* Multi-Step Courses Section */}
      {courses.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-ev7-600" />
            หลักสูตรอบรมของคุณ
          </h2>
          {courses.map((course) => {
            const pct = course.totalSteps > 0
              ? Math.round((course.completedSteps / course.totalSteps) * 100)
              : 0

            // Calculate unlock status sequentially
            let previousRequiredCompleted = true
            const stepsWithUnlock = course.steps.map(s => {
              const isUnlocked = s.order_num === 0 || previousRequiredCompleted
              if (s.is_required && !s.completed) {
                previousRequiredCompleted = false
              }
              return { ...s, unlocked: isUnlocked }
            })

            return (
              <div key={course.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    course.courseCompleted
                      ? 'bg-ev7-100 text-ev7-600'
                      : 'bg-blue-50 text-blue-600'
                  }`}>
                    {course.courseCompleted ? (
                      <CheckCircle2 className="w-7 h-7" />
                    ) : (
                      <BookOpen className="w-7 h-7" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg">{course.title}</h3>
                    {course.description && (
                      <p className="text-sm text-gray-500 mt-1">{course.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            course.courseCompleted ? 'bg-ev7-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">
                        {course.completedSteps}/{course.totalSteps} ขั้นตอน
                      </span>
                    </div>
                  </div>
                </div>

                {/* Steps List */}
                <div className="space-y-3 mt-6 border-t border-gray-100 pt-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">ขั้นตอนการเรียน</h4>
                  {stepsWithUnlock.map((step, idx) => {
                    const isVideo = step.step_type === 'VIDEO'
                    const StepIcon = isVideo ? PlayCircle : ClipboardCheck

                    let statusIcon
                    let statusColor = ''
                    if (step.completed) {
                      statusIcon = <CheckCircle2 className="w-5 h-5 text-ev7-600" />
                      statusColor = 'border-ev7-200 bg-ev7-50'
                    } else if (step.unlocked) {
                      statusIcon = <StepIcon className={`w-5 h-5 ${isVideo ? 'text-blue-500' : 'text-amber-500'}`} />
                      statusColor = 'border-gray-200 hover:border-gray-300 hover:shadow-sm cursor-pointer'
                    } else {
                      statusIcon = <Lock className="w-5 h-5 text-gray-300" />
                      statusColor = 'border-gray-100 bg-gray-50 opacity-60'
                    }

                    let subtitle = ''
                    if (step.completed) {
                      if (step.step_type === 'QUIZ' && step.score != null) {
                        subtitle = `ผ่านแล้ว • คะแนน ${Math.round(step.score)}%`
                      } else {
                        subtitle = 'เสร็จสิ้น ✓'
                      }
                    } else if (!step.unlocked) {
                      subtitle = 'ต้องทำขั้นตอนก่อนหน้าก่อน'
                    } else {
                      subtitle = isVideo ? 'กดเพื่อเริ่มดูวิดีโอ' : 'กดเพื่อเริ่มทำแบบทดสอบ'
                    }

                    return (
                      <Link
                        key={step.id}
                        href={step.unlocked ? `/dashboard/courses/${course.id}/steps/${step.id}` : '#'}
                        className={`block border-2 rounded-xl p-4 transition-all ${statusColor} ${!step.unlocked ? 'pointer-events-none' : ''}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            step.completed ? 'bg-ev7-100' : isVideo ? 'bg-blue-50' : 'bg-amber-50'
                          }`}>
                            {statusIcon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400 font-mono">{idx + 1}</span>
                              <h3 className="font-semibold text-gray-900 text-sm truncate">{step.title}</h3>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                                isVideo ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                              }`}>
                                {isVideo ? 'วิดีโอ' : 'แบบทดสอบ'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                          </div>
                          {step.unlocked && !step.completed && (
                            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
