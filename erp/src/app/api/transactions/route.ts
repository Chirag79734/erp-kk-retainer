import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSessionUser } from '@/utils/auth'

export async function GET(request: Request) {
  const user = await getSessionUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        businessUnit: {
          include: {
            client: true
          }
        },
        createdBy: {
          select: { email: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // RBAC: Only ADMIN and FINANCE can create new billing entries
  if (user.role !== 'ADMIN' && user.role !== 'FINANCE') {
    return NextResponse.json(
      { error: 'Forbidden: You do not have permission to create billing entries' }, 
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { 
      invoiceNumber, 
      poNumber, 
      billingMonth, 
      brandName, 
      retainerAmount, 
      commissionAmount, 
      totalAmount,
      businessUnitId 
    } = body
    
    // Create new transaction (default status is PENDING per schema)
    const newTransaction = await prisma.transaction.create({
      data: {
        invoiceNumber,
        poNumber,
        billingMonth,
        brandName,
        retainerAmount,
        commissionAmount,
        totalAmount,
        businessUnitId,
        createdById: user.id
      }
    })

    // Log the creation
    await prisma.approvalLog.create({
      data: {
        transactionId: newTransaction.id,
        actionBy: user.id,
        action: 'CREATED',
        comments: 'Initial submission'
      }
    })

    return NextResponse.json(newTransaction, { status: 201 })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json({ error: 'Failed to log billing entry' }, { status: 500 })
  }
}
