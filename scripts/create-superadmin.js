/* prisma/scripts/create-superadmin.js
 *
 * ✅ Objectif:
 * - Si un user avec ce phone existe => lui attribuer DIRECTEMENT le rôle SUPERADMIN (et stop)
 * - Sinon:
 *    - Créer le rôle SUPERADMIN s'il n'existe pas
 *    - Créer un utilisateur SUPER ADMIN (UserType = SUPERADMIN)
 *    - Attribuer automatiquement le rôle SUPERADMIN à cet utilisateur
 * - Script idempotent: tu peux le relancer sans doublons
 *
 * 📌 Exécution:
 *   node prisma/scripts/create-superadmin.js
 *
 * 📌 Variables d’environnement (recommandé):
 *   SUPERADMIN_PHONE=699000000
 *   SUPERADMIN_EMAIL=superadmin@app.com
 *   SUPERADMIN_PASSWORD=StrongPassword123!
 *   SUPERADMIN_FIRSTNAME=Super
 *   SUPERADMIN_LASTNAME=Admin
 *   SUPERADMIN_SEX=OTHER   // MALE | FEMALE | OTHER
 *
 * Optionnel:
 *   FORCE_PASSWORD_UPDATE=true   // si l'utilisateur n'existe pas, ou si tu veux forcer update quand on le crée
 */

const { PrismaClient } = require('../generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function env(name, fallback = '') {
  return (process.env[name] ?? fallback).toString().trim();
}

function normalizeRoleName(name) {
  if (!name) return '';
  return String(name)
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
}

async function ensureRole(roleName) {
  const normalized = normalizeRoleName(roleName);

  let role = await prisma.role.findUnique({ where: { name: normalized } });

  if (!role) {
    role = await prisma.role.create({
      data: {
        name: normalized,
        description: 'Rôle Super Administrateur (accès total).',
      },
    });
    console.log(`✅ Rôle créé: ${role.name}`);
  } else {
    console.log(`ℹ️ Rôle existant: ${role.name}`);
  }

  return role;
}

async function assignRoleToUser(userId, roleId, roleName) {
  await prisma.userRole.createMany({
    data: [{ userId, roleId }],
    skipDuplicates: true,
  });
  console.log(`✅ Rôle ${roleName} attribué à userId=${userId}`);
}

async function main() {
  const phone = env('SUPERADMIN_PHONE', '+237692473511');
  const email = env('SUPERADMIN_EMAIL', 'mounkambou@gmail.com');
  const passwordPlain = env('SUPERADMIN_PASSWORD', '1234');
  const firstName = env('SUPERADMIN_FIRSTNAME', 'Super');
  const lastName = env('SUPERADMIN_LASTNAME', 'Admin');
  const sex = env('SUPERADMIN_SEX', 'OTHER'); // MALE | FEMALE | OTHER
  const forcePasswordUpdate =
    env('FORCE_PASSWORD_UPDATE', 'false').toLowerCase() === 'true';

  if (!phone) throw new Error('SUPERADMIN_PHONE est requis');

  // ✅ 0) Vérifier d'abord si le phone existe déjà
  const existingUser = await prisma.user.findUnique({
    where: { phone },
    select: { userId: true, phone: true },
  });

  // ✅ 1) Créer/récupérer le rôle SUPERADMIN (on en a besoin dans tous les cas)
  const role = await ensureRole('SUPERADMIN');

  // ✅ Si user existe => on attribue juste le rôle et on s'arrête
  if (existingUser) {
    await assignRoleToUser(existingUser.userId, role.roleId, role.name);

    const userWithRoles = await prisma.user.findUnique({
      where: { userId: existingUser.userId },
      include: { roles: { include: { role: true } } },
    });

    const roleNames = (userWithRoles?.roles || [])
      .map((x) => x.role?.name)
      .filter(Boolean);

    console.log(
      `🎯 Rôles actuels du user: ${roleNames.join(', ') || '(aucun)'}`,
    );
    console.log('✅ Script terminé (user existant).');
    return;
  }

  // ✅ 2) Sinon => on crée l'utilisateur + on attribue le rôle
  if (!email) throw new Error('SUPERADMIN_EMAIL est requis');
  if (!passwordPlain) throw new Error('SUPERADMIN_PASSWORD est requis');

  const passwordHash = await bcrypt.hash(passwordPlain, 10);

  // sécurité email unique
  const emailUsed = await prisma.user.findUnique({ where: { email } });
  if (emailUsed) {
    throw new Error(
      `SUPERADMIN_EMAIL "${email}" est déjà utilisé par un autre utilisateur (userId=${emailUsed.userId}).`,
    );
  }

  let user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      sex, // 'MALE' | 'FEMALE' | 'OTHER'
      email,
      phone,
      password: passwordHash,
      userType: 'SUPERADMIN',
      acceptPrivacy: true,
      isBlock: false,
      isVerified: true,
    },
  });

  console.log(
    `✅ Utilisateur SUPERADMIN créé: userId=${user.userId} phone=${user.phone}`,
  );

  // Optionnel: si tu veux “forcer update” après create (peu utile, mais on respecte le flag)
  if (forcePasswordUpdate) {
    await prisma.user.update({
      where: { userId: user.userId },
      data: { password: passwordHash },
    });
  }

  await assignRoleToUser(user.userId, role.roleId, role.name);

  const userWithRoles = await prisma.user.findUnique({
    where: { userId: user.userId },
    include: { roles: { include: { role: true } } },
  });

  const roleNames = (userWithRoles?.roles || [])
    .map((x) => x.role?.name)
    .filter(Boolean);

  console.log(`🎯 Rôles actuels du user: ${roleNames.join(', ') || '(aucun)'}`);
  console.log('✅ Script terminé avec succès.');
}

main()
  .catch((e) => {
    console.error('❌ Erreur create-superadmin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });