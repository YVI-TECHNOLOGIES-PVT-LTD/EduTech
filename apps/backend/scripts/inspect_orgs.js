const prisma = require('../src/lib/prismaClient').default;

async function main() {
  const orgs = await prisma.organizations.findMany({
    select: { org_id: true, org_code: true, org_name: true, city: true, status: true },
  });
  console.log('=== REGISTERED ORGANIZATIONS IN DATABASE ===');
  console.log(JSON.stringify(orgs, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
