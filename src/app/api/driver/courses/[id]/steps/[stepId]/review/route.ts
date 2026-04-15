import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { stepId } = await params
  const driverId = session.user.id

  // Check if step is completed
  const progress = await prisma.courseStepProgress.findFirst({
    where: { driver_id: driverId, step_id: stepId, completed: true }
  })

  if (!progress) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get question IDs
  const step = await prisma.courseStep.findUnique({ where: { id: stepId } })
  if (!step || !step.question_ids) {
    return NextResponse.json({ questions: [] })
  }

  const stepQIds = typeof step.question_ids === 'string'
    ? JSON.parse(step.question_ids as unknown as string)
    : step.question_ids

  if (!Array.isArray(stepQIds) || stepQIds.length === 0) {
    return NextResponse.json({ questions: [] })
  }

  // Fetch full questions with correct answers
  const questions = await prisma.question.findMany({
    where: { id: { in: stepQIds } }
  })

  // Parse options
  const parsed = stepQIds
    .map(id => questions.find(q => q.id === id))
    .filter(Boolean)
    .map((q: any) => ({
      ...q,
      options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
    }))

  return NextResponse.json({ questions: parsed, score: progress.score })
}
