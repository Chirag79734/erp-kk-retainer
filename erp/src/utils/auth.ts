import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'

export async function getSessionUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user || !user.email) {
    return null
  }

  // Fetch role and details from Prisma DB
  let dbUser = await prisma.user.findUnique({
    where: { email: user.email }
  })

  // Auto-create user record in Prisma if it's their first time logging in 
  // (Optional, better to do this via Supabase Webhooks/Triggers, but this is a fail-safe)
  if (!dbUser) {
    // Determine if admin by some logic, otherwise default to ACCOUNT_MANAGER
    // For now, if it's the owner's email, make them ADMIN
    const isAdmin = user.email === 'admin@example.com' // TODO: Set actual admin email
    
    dbUser = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        role: isAdmin ? 'ADMIN' : 'ACCOUNT_MANAGER',
        isVerified: true // Assuming email verification is handled by Supabase
      }
    })
  }

  return dbUser
}
