import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const driverId = session.user.id

  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    select: { car_model: true }
  })

  const allCourses = await prisma.course.findMany({
    where: { 
      is_active: true,
    },
    orderBy: { order_num: 'asc' },
    include: {
      steps: {
        orderBy: { order_num: 'asc' },
        select: {
          id: true,
          title: true,
          step_type: true,
          order_num: true,
          is_required: true,
        },
      },
    },
  })

  const courses = allCourses.filter(c => {
    if (!c.target_car_model) return true;
    const targets = c.target_car_model.split(',').map(s => s.trim()).filter(Boolean);
    if (targets.length === 0) return true;
    return driver?.car_model ? targets.includes(driver.car_model) : false;
  });

  // Get driver's progress for all steps
  const stepIds = courses.flatMap(c => c.steps.map(s => s.id))
  const progresses = await prisma.courseStepProgress.findMany({
    where: {
      driver_id: driverId,
      step_id: { in: stepIds },
    },
  })

  const progressMap = new Map(progresses.map(p => [p.step_id, p]))

  const coursesWithProgress = courses.map(course => {
    const stepsWithProgress = course.steps.map(step => ({
      ...step,
      completed: progressMap.get(step.id)?.completed || false,
      score: progressMap.get(step.id)?.score ?? null,
    }))

    const requiredSteps = stepsWithProgress.filter(s => s.is_required)
    const completedRequired = requiredSteps.filter(s => s.completed).length
    const totalRequired = requiredSteps.length
    const courseCompleted = totalRequired > 0 && completedRequired >= totalRequired

    return {
      ...course,
      steps: stepsWithProgress,
      completedSteps: completedRequired,
      totalSteps: totalRequired,
      courseCompleted,
      order_num: course.order_num,
    }
  })

  // Compute nextCourse for each course — the next incomplete course by order
  const coursesWithNext = coursesWithProgress.map((course, idx) => {
    const nextIncomplete = coursesWithProgress.find(
      (c, i) => i > idx && !c.courseCompleted
    )
    return {
      ...course,
      nextCourse: nextIncomplete
        ? { id: nextIncomplete.id, title: nextIncomplete.title }
        : null,
    }
  })

  const allCoursesCompleted = coursesWithProgress.every(c => c.courseCompleted)

  return NextResponse.json({ courses: coursesWithNext, allCoursesCompleted })
}
