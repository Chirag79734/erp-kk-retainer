import { getSessionUser } from '@/utils/auth'
import { redirect } from 'next/navigation'
import DashboardApp from '@/components/DashboardApp'
import prisma from '@/lib/prisma'

export default async function Home() {
  const user = await getSessionUser()
  
  if (!user) {
    redirect('/login')
  }

  // Fetch initial data to pass to the client component
  const clients = await prisma.client.findMany({
    include: { lobs: true },
    orderBy: { name: 'asc' }
  })

  const transactions = await prisma.transaction.findMany({
    include: {
      businessUnit: {
        include: { client: true }
      },
      createdBy: {
        select: { email: true, role: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <DashboardApp 
      user={user} 
      initialClients={clients} 
      initialTransactions={transactions} 
    />
  )
}
