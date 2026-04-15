import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/driver/questions?ids=id1,id2,id3
 * Returns questions by their IDs (for quiz steps)
 * Only returns id, question_text, options (no correct_answer!)
 */
export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get('ids')

  if (!idsParam) {
    return NextResponse.json({ questions: [] })
  }

  const ids = idsParam.split(',').filter(Boolean)

  const questions = await prisma.question.findMany({
    where: {
      id: { in: ids },
      is_active: true,
    },
    select: {
      id: true,
      question_text: true,
      options: true,
      // NOT returning correct_answer to prevent cheating
    },
    orderBy: { order_num: 'asc' },
  })

  // Parse options and maintain the order of ids
  const parsed = ids
    .map(id => questions.find(q => q.id === id))
    .filter(Boolean)
    .map((q: any) => ({
      id: q.id,
      question_text: q.question_text,
      options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
    }))

  return NextResponse.json({ questions: parsed })
}
