/* prisma/scripts/create-superadmin.js
 *
 * ✅ Objectif:
 * - Créer un utilisateur SUPER ADMIN (UserType = SUPERADMIN)
 * - Si le rôle SUPERADMIN n'existe pas => le créer
 * - Attribuer automatiquement le rôle SUPERADMIN à cet utilisateur
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
 *   FORCE_PASSWORD_UPDATE=true   // si l'utilisateur existe, on met à jour son password
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
    .replace(/[\u0300-\u036f]/g, '') // supprime accents
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
}

async function main() {
  const phone = env('SUPERADMIN_PHONE', '+237692473511');
  const email = env('SUPERADMIN_EMAIL', 'superadmin@gmail.com');
  const passwordPlain = env('SUPERADMIN_PASSWORD', '1234');
  const firstName = env('SUPERADMIN_FIRSTNAME', 'Super');
  const lastName = env('SUPERADMIN_LASTNAME', 'Admin');
  const sex = env('SUPERADMIN_SEX', 'OTHER'); // MALE | FEMALE | OTHER
  const forcePasswordUpdate = env('FORCE_PASSWORD_UPDATE', 'false').toLowerCase() === 'true';

  if (!phone) throw new Error('SUPERADMIN_PHONE est requis');
  if (!email) throw new Error('SUPERADMIN_EMAIL est requis');
  if (!passwordPlain) throw new Error('SUPERADMIN_PASSWORD est requis');

  // 1) Créer ou récupérer le rôle SUPERADMIN
  const roleName = normalizeRoleName('SUPERADMIN');

  let role = await prisma.role.findUnique({
    where: { name: roleName },
  });

  if (!role) {
    role = await prisma.role.create({
      data: {
        name: roleName,
        description: 'Rôle Super Administrateur (accès total).',
      },
    });
    console.log(`✅ Rôle créé: ${role.name}`);
  } else {
    console.log(`ℹ️ Rôle existant: ${role.name}`);
  }

  // 2) Créer ou récupérer l'utilisateur par phone (unique)
  let user = await prisma.user.findUnique({
    where: { phone },
  });

  const passwordHash = await bcrypt.hash(passwordPlain, 10);

  if (!user) {
    // IMPORTANT: les champs requis dans ton schema User:
    // firstName, lastName, sex, email, phone, password, userType
    user = await prisma.user.create({
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

    console.log(`✅ Utilisateur SUPERADMIN créé: userId=${user.userId} phone=${user.phone}`);
  } else {
    // Si l'utilisateur existe, on s'assure qu'il est bien SUPERADMIN, vérifié, non bloqué
    const dataToUpdate = {
      userType: 'SUPERADMIN',
      isBlock: false,
      isVerified: true,
      acceptPrivacy: true,
    };

    if (forcePasswordUpdate) {
      dataToUpdate.password = passwordHash;
    }

    // ⚠️ email/firstName/lastName: tu peux choisir de mettre à jour ou non.
    // Ici on met à jour l'email si différent (attention conflit unique).
    // On reste safe: update seulement si email est identique ou non utilisé.
    if (user.email !== email) {
      const emailUsed = await prisma.user.findUnique({ where: { email } });
      if (!emailUsed || emailUsed.userId === user.userId) {
        dataToUpdate.email = email;
      } else {
        console.log(`⚠️ Email "${email}" déjà utilisé par un autre user. On ne modifie pas l'email.`);
      }
    }

    await prisma.user.update({
      where: { userId: user.userId },
      data: dataToUpdate,
    });

    user = await prisma.user.findUnique({ where: { userId: user.userId } });

    console.log(`ℹ️ Utilisateur existant mis à jour: userId=${user.userId} phone=${user.phone}`);
  }

  // 3) Attribuer le rôle SUPERADMIN à l'utilisateur (sans doublon)
  await prisma.userRole.createMany({
    data: [
      {
        userId: user.userId,
        roleId: role.roleId,
      },
    ],
    skipDuplicates: true,
  });

  console.log(`✅ Rôle ${role.name} attribué à userId=${user.userId}`);

  // 4) (Optionnel mais utile) Afficher les rôles actuels du user
  const userWithRoles = await prisma.user.findUnique({
    where: { userId: user.userId },
    include: {
      roles: { include: { role: true } },
    },
  });

  const roleNames = (userWithRoles?.roles || []).map((x) => x.role?.name).filter(Boolean);
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
