import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateCertificateNo } from '@/lib/utils'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: courseId } = await params
  const { driver_id, passed } = await request.json()

  try {
    const attempt = await prisma.courseAttempt.findFirst({
      where: { driver_id, course_id: courseId }
    })
    
    if (attempt) {
      await prisma.courseAttempt.update({
        where: { id: attempt.id },
        data: { passed, completed_at: passed ? new Date() : null }
      })
    } else {
      await prisma.courseAttempt.create({
        data: { driver_id, course_id: courseId, passed, score: passed ? 100 : 0, completed_at: passed ? new Date() : null }
      })
    }
    
    if (passed) {
      const existingCert = await prisma.certificate.findFirst({
        where: { driver_id }
      })
      if (!existingCert) {
        await prisma.certificate.create({
          data: { certificate_no: generateCertificateNo(), driver_id, score: 100 }
        })
      }
      await prisma.driver.update({
        where: { id: driver_id },
        data: { onboarding_status: 'PASSED' }
      })
    } else {
      await prisma.driver.update({
        where: { id: driver_id },
        data: { onboarding_status: 'WATCHING' }
      })
    }
    
    return NextResponse.json({ success: true, passed })
  } catch (err: any) {
    console.error('Update status error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
