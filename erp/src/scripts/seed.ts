import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const initialClients = [
    {
        name: "Airtel",
        contactName: "Anil Kapoor",
        email: "billing@airtel.com",
        phone: "+91 98100 12345",
        status: "Active",
        lobs: [
            { name: "Broadband", billingModel: "SplitRetainer", totalRetainer: 1000000, fixedSharePercent: 85, variableSharePercent: 15 },
            { name: "Mobility", billingModel: "SplitRetainer", totalRetainer: 1000000, fixedSharePercent: 85, variableSharePercent: 15 },
            { name: "Finance", billingModel: "SplitRetainer", totalRetainer: 200000, fixedSharePercent: 85, variableSharePercent: 15 },
            { name: "Branding", billingModel: "SplitRetainer", totalRetainer: 1000000, fixedSharePercent: 85, variableSharePercent: 15 },
            { name: "Airtel Thanks", billingModel: "SplitRetainer", totalRetainer: 400000, fixedSharePercent: 85, variableSharePercent: 15 },
            { name: "Airtel Xstream", billingModel: "SplitRetainer", totalRetainer: 211000, fixedSharePercent: 85, variableSharePercent: 15 },
            { name: "Airtel Payment Bank", billingModel: "SplitRetainer", totalRetainer: 50000, fixedSharePercent: 85, variableSharePercent: 15 }
        ]
    },
    {
        name: "ITC",
        contactName: "Sanjiv Puri",
        email: "finance@itc.in",
        phone: "+91 98200 54321",
        status: "Active",
        lobs: [
            { name: "FMCG", billingModel: "Retainer", totalRetainer: 500000 },
            { name: "Hotels", billingModel: "Retainer", totalRetainer: 750000 },
            { name: "Agri Business", billingModel: "Retainer", totalRetainer: 300000 },
            { name: "Paperboards", billingModel: "Retainer", totalRetainer: 450000 }
        ]
    }
]

async function main() {
  console.log('Seeding Database with legacy mockData...')
  
  for (const client of initialClients) {
    const existingClient = await prisma.client.findFirst({ where: { name: client.name } })
    
    if (!existingClient) {
      console.log(`Creating client: ${client.name}`)
      await prisma.client.create({
        data: {
          name: client.name,
          contactName: client.contactName,
          email: client.email,
          phone: client.phone,
          status: client.status,
          lobs: {
            create: client.lobs
          }
        }
      })
    } else {
      console.log(`Client ${client.name} already exists, skipping.`)
    }
  }
  
  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
