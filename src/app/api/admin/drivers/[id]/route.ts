import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Delete driver records safely. Prisma might cascade if defined, but doing it manually is safer if no cascade.
    await prisma.$transaction([
      prisma.videoProgress.deleteMany({ where: { driver_id: id } }),
      prisma.quizAttempt.deleteMany({ where: { driver_id: id } }),
      prisma.certificate.deleteMany({ where: { driver_id: id } }),
      prisma.courseStepProgress.deleteMany({ where: { driver_id: id } }),
      prisma.courseAttempt.deleteMany({ where: { driver_id: id } }),
      prisma.driver.delete({ where: { id } })
    ])

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Delete driver error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
