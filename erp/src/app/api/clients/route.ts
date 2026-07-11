import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSessionUser } from '@/utils/auth'

export async function GET() {
  const user = await getSessionUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // All authenticated users can view clients and their LOBs for the dropdowns
  try {
    const clients = await prisma.client.findMany({
      include: {
        lobs: true
      },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(clients)
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only ADMIN can create new clients
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { name, contactName, email, phone, lobs } = body
    
    if (!name) {
      return NextResponse.json({ error: 'Client name is required' }, { status: 400 })
    }

    const newClient = await prisma.client.create({
      data: {
        name,
        contactName,
        email,
        phone,
        lobs: {
          create: lobs || []
        }
      },
      include: {
        lobs: true
      }
    })

    return NextResponse.json(newClient, { status: 201 })
  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}
