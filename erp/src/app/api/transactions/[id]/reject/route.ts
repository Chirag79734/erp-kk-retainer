import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSessionUser } from '@/utils/auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // RBAC: Only ADMIN and COMMERCIAL can reject billing entries
  if (user.role !== 'ADMIN' && user.role !== 'COMMERCIAL') {
    return NextResponse.json(
      { error: 'Forbidden: You do not have permission to reject billing entries' }, 
      { status: 403 }
    )
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { reason } = body

    const transaction = await prisma.transaction.findUnique({
      where: { id }
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    if (transaction.status === 'REJECTED') {
      return NextResponse.json({ error: 'Transaction is already rejected' }, { status: 400 })
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: { status: 'REJECTED' }
    })

    // Log the rejection
    await prisma.approvalLog.create({
      data: {
        transactionId: id,
        actionBy: user.id,
        action: 'REJECTED',
        comments: reason || 'Rejected via dashboard'
      }
    })

    return NextResponse.json(updatedTransaction, { status: 200 })
  } catch (error) {
    console.error('Error rejecting transaction:', error)
    return NextResponse.json({ error: 'Failed to reject transaction' }, { status: 500 })
  }
}
