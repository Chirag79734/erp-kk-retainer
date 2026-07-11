import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSessionUser } from '@/utils/auth'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // RBAC: Only ADMIN and COMMERCIAL can approve billing entries
  if (user.role !== 'ADMIN' && user.role !== 'COMMERCIAL') {
    return NextResponse.json(
      { error: 'Forbidden: You do not have permission to approve billing entries' }, 
      { status: 403 }
    )
  }

  try {
    const { id } = await params
    const transaction = await prisma.transaction.findUnique({
      where: { id }
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    if (transaction.status === 'APPROVED') {
      return NextResponse.json({ error: 'Transaction is already approved' }, { status: 400 })
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: { status: 'APPROVED' }
    })

    // Log the approval
    await prisma.approvalLog.create({
      data: {
        transactionId: id,
        actionBy: user.id,
        action: 'APPROVED',
        comments: 'Approved via dashboard'
      }
    })

    return NextResponse.json(updatedTransaction, { status: 200 })
  } catch (error) {
    console.error('Error approving transaction:', error)
    return NextResponse.json({ error: 'Failed to approve transaction' }, { status: 500 })
  }
}
