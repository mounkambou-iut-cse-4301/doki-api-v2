/* prisma/scripts/create-superadmin.js
 *
 * ✅ Objectif:
 * - Si un user SUPERADMIN avec ce phone existe => lui attribuer DIRECTEMENT le rôle SUPERADMIN (et stop)
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
 *   FORCE_PASSWORD_UPDATE=true   // force la mise à jour du mot de passe
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
  try {
    await prisma.userRole.createMany({
      data: [{ userId, roleId }],
      skipDuplicates: true,
    });
    console.log(`✅ Rôle ${roleName} attribué à userId=${userId}`);
  } catch (error) {
    console.error(`❌ Erreur lors de l'attribution du rôle: ${error.message}`);
    throw error;
  }
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

  console.log(`📞 Recherche d'un super admin avec le téléphone: ${phone}`);

  // ✅ 0) Vérifier d'abord si un user SUPERADMIN avec ce phone existe
  const existingSuperAdmin = await prisma.user.findFirst({
    where: { 
      phone,
      userType: 'SUPERADMIN'
    },
    select: { userId: true, phone: true, email: true, firstName: true, lastName: true }
  });

  // ✅ 1) Créer/récupérer le rôle SUPERADMIN (on en a besoin dans tous les cas)
  const role = await ensureRole('SUPERADMIN');

  // ✅ Si un super admin existe déjà => on attribue juste le rôle si pas déjà fait
  if (existingSuperAdmin) {
    console.log(`👤 Super admin existant trouvé: userId=${existingSuperAdmin.userId}`);
    
    // Vérifier si le rôle est déjà attribué
    const existingUserRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId: existingSuperAdmin.userId,
          roleId: role.roleId
        }
      }
    });
    
    if (!existingUserRole) {
      await assignRoleToUser(existingSuperAdmin.userId, role.roleId, role.name);
    } else {
      console.log(`ℹ️ Le rôle ${role.name} est déjà attribué à cet utilisateur`);
    }

    // Optionnel: mettre à jour le mot de passe si forcé
    if (forcePasswordUpdate) {
      const passwordHash = await bcrypt.hash(passwordPlain, 10);
      await prisma.user.update({
        where: { userId: existingSuperAdmin.userId },
        data: { password: passwordHash }
      });
      console.log(`✅ Mot de passe mis à jour pour userId=${existingSuperAdmin.userId}`);
    }

    const userWithRoles = await prisma.user.findUnique({
      where: { userId: existingSuperAdmin.userId },
      include: { roles: { include: { role: true } } },
    });

    const roleNames = (userWithRoles?.roles || [])
      .map((x) => x.role?.name)
      .filter(Boolean);

    console.log(`🎯 Rôles actuels du user: ${roleNames.join(', ') || '(aucun)'}`);
    console.log('✅ Script terminé (super admin existant).');
    return;
  }

  // ✅ 2) Vérifier si un user avec ce phone existe mais n'est pas SUPERADMIN
  const existingUserOtherType = await prisma.user.findFirst({
    where: { phone },
    select: { userId: true, phone: true, userType: true, email: true }
  });

  if (existingUserOtherType) {
    console.log(`⚠️ Un utilisateur avec ce téléphone existe déjà mais avec le type: ${existingUserOtherType.userType}`);
    console.log(`👉 Pour créer un super admin, veuillez utiliser un autre numéro de téléphone`);
    console.log(`👉 Ou modifiez le type de l'utilisateur existant manuellement`);
    throw new Error(`Le téléphone ${phone} est déjà utilisé par un ${existingUserOtherType.userType}`);
  }

  // ✅ 3) Vérifier si un user avec ce email existe
  if (email) {
    const existingEmail = await prisma.user.findFirst({
      where: { email },
      select: { userId: true, email: true, userType: true }
    });
    
    if (existingEmail) {
      console.log(`⚠️ Un utilisateur avec cet email existe déjà avec le type: ${existingEmail.userType}`);
      throw new Error(`L'email ${email} est déjà utilisé par un ${existingEmail.userType}`);
    }
  }

  // ✅ 4) Créer le super admin
  if (!email) throw new Error('SUPERADMIN_EMAIL est requis');
  if (!passwordPlain) throw new Error('SUPERADMIN_PASSWORD est requis');

  const passwordHash = await bcrypt.hash(passwordPlain, 10);

  const user = await prisma.user.create({
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

  console.log(`✅ Utilisateur SUPERADMIN créé: userId=${user.userId} phone=${user.phone} email=${user.email}`);

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