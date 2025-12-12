// scripts/seed-roles.js
const { PrismaClient } = require('../generated/prisma'); // adapte le chemin si besoin

const prisma = new PrismaClient();

const RAW_ROLES = [
  'SUPERADMIN',
  'manage_patient',
  'manage_medecin',
  'manage_abonement',
  'manage_rendezvous',
  'manage_transaction',
  'manage_protocoleordonance',
  'managefichestructurees',
  'manage_formation_cntinue',
  'manage_video_educative',
];

function normalizeRoleName(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .toUpperCase();
}

async function main() {
  for (const raw of RAW_ROLES) {
    const name = normalizeRoleName(raw);
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    console.log(`Role seeded: ${name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
