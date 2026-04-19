// scripts/add-balance-to-all-medecins-hopitaux.js
const { PrismaClient } = require('../generated/prisma');
const crypto = require('crypto');

const prisma = new PrismaClient();
const AMOUNT_TO_ADD = 50000; // 50,000 FCFA

// ========== MODULE DE CHIFFREMENT (indépendant) ==========
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const KEY_LENGTH = 32;
const SALT = 'solde-medecin-v1';

function getSecret() {
  const secret = process.env.BALANCE_ENCRYPTION_SECRET;
  if (!secret || secret.trim().length < 16) {
    throw new Error(
      'BALANCE_ENCRYPTION_SECRET est manquant ou trop court. Mets une valeur longue dans .env.',
    );
  }
  return secret;
}

function getKey() {
  return crypto.scryptSync(getSecret(), SALT, KEY_LENGTH);
}

function normalizeMoneyString(value) {
  const raw = String(value).trim().replace(',', '.');

  if (!/^-?\d+(\.\d{1,2})?$/.test(raw)) {
    throw new Error(
      `Montant invalide: "${value}". Utilise un nombre avec au plus 2 décimales.`,
    );
  }

  const negative = raw.startsWith('-');
  const clean = negative ? raw.slice(1) : raw;
  const [intPart, fracPart = ''] = clean.split('.');
  const normalized = `${negative ? '-' : ''}${intPart}.${(fracPart + '00').slice(0, 2)}`;

  return normalized;
}

function moneyStringToCents(value) {
  const normalized = normalizeMoneyString(value);
  const negative = normalized.startsWith('-');
  const clean = negative ? normalized.slice(1) : normalized;
  const [intPart, fracPart] = clean.split('.');

  const cents = BigInt(intPart) * 100n + BigInt(fracPart);
  return negative ? -cents : cents;
}

function centsToMoneyNumber(cents) {
  return Number(cents) / 100;
}

function encryptRaw(plainText) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKey();

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decryptRaw(payload) {
  const parts = payload.split(':');
  if (parts.length !== 3) {
    throw new Error('Format de solde chiffré invalide.');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const key = getKey();

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

function encryptBalance(value) {
  const cents = moneyStringToCents(value);
  return encryptRaw(cents.toString());
}

function decryptBalance(payload) {
  if (!payload) return 0;
  const centsAsString = decryptRaw(payload);
  const cents = BigInt(centsAsString);
  return centsToMoneyNumber(cents);
}

function addToEncryptedBalance(currentEncryptedValue, increment) {
  const currentCents = currentEncryptedValue
    ? BigInt(decryptRaw(currentEncryptedValue))
    : 0n;

  const incrementCents = moneyStringToCents(increment);
  const nextCents = currentCents + incrementCents;

  return {
    encrypted: encryptRaw(nextCents.toString()),
    balance: centsToMoneyNumber(nextCents),
  };
}

function subtractFromEncryptedBalance(currentEncryptedValue, decrement) {
  const currentCents = currentEncryptedValue
    ? BigInt(decryptRaw(currentEncryptedValue))
    : 0n;

  const decrementCents = moneyStringToCents(decrement);
  const nextCents = currentCents - decrementCents;

  if (nextCents < 0n) {
    throw new Error('Solde insuffisant.');
  }

  return {
    encrypted: encryptRaw(nextCents.toString()),
    balance: centsToMoneyNumber(nextCents),
  };
}
// ========== FIN DU MODULE DE CHIFFREMENT ==========

async function main() {
  console.log('🚀 Début de l\'ajout de solde pour tous les médecins et hôpitaux...');
  console.log(`💰 Montant à ajouter : ${AMOUNT_TO_ADD.toLocaleString()} FCFA\n`);
  console.log('🔐 Vérification de la clé de chiffrement...');
  
  // Vérifier que la clé existe
  try {
    getSecret();
    console.log('✅ Clé de chiffrement trouvée\n');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('\n💡 Solution: Ajoute BALANCE_ENCRYPTION_SECRET dans ton fichier .env');
    process.exit(1);
  }

  // Récupérer tous les médecins et hôpitaux
  const users = await prisma.user.findMany({
    where: {
      userType: {
        in: ['MEDECIN', 'HOPITAL']
      }
    },
    select: {
      userId: true,
      firstName: true,
      lastName: true,
      userType: true,
      email: true
    }
  });

  console.log(`📊 ${users.length} utilisateur(s) trouvé(s)\n`);

  let createdCount = 0;
  let updatedCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const user of users) {
    try {
      // Chercher un solde existant
      const existingSolde = await prisma.soldeMedecin.findFirst({
        where: { medecinId: user.userId }
      });

      const userLabel = `${user.firstName} ${user.lastName} (${user.userType})`;

      if (existingSolde) {
        // Afficher l'ancien solde
        const oldBalance = decryptBalance(existingSolde.solde);
        
        // Mettre à jour le solde existant
        const { encrypted: newEncryptedBalance, balance: newBalance } = addToEncryptedBalance(
          existingSolde.solde,
          AMOUNT_TO_ADD
        );

        await prisma.soldeMedecin.update({
          where: { soldeMedecinId: existingSolde.soldeMedecinId },
          data: { 
            solde: newEncryptedBalance,
            updatedAt: new Date()
          }
        });

        console.log(`✅ MIS À JOUR - ${userLabel}`);
        console.log(`   Ancien solde: ${oldBalance.toLocaleString()} FCFA`);
        console.log(`   Nouveau solde: ${newBalance.toLocaleString()} FCFA (+${AMOUNT_TO_ADD.toLocaleString()} FCFA)\n`);
        updatedCount++;
      } else {
        // Créer un nouveau solde
        const encryptedBalance = encryptBalance(AMOUNT_TO_ADD);

        await prisma.soldeMedecin.create({
          data: {
            medecinId: user.userId,
            solde: encryptedBalance
          }
        });

        console.log(`✨ CRÉÉ - ${userLabel} : Solde initial = ${AMOUNT_TO_ADD.toLocaleString()} FCFA\n`);
        createdCount++;
      }
    } catch (error) {
      console.error(`❌ ERREUR pour ${user.firstName} ${user.lastName} (ID: ${user.userId}):`, error.message);
      errorCount++;
      errors.push({
        userId: user.userId,
        name: `${user.firstName} ${user.lastName}`,
        error: error.message
      });
    }
  }

  // Afficher le résumé
  console.log('\n' + '='.repeat(60));
  console.log('📋 RÉSUMÉ DE L\'OPÉRATION');
  console.log('='.repeat(60));
  console.log(`👥 Total utilisateurs traités : ${users.length}`);
  console.log(`✨ Nouveaux soldes créés : ${createdCount}`);
  console.log(`🔄 Soldes mis à jour : ${updatedCount}`);
  console.log(`❌ Erreurs : ${errorCount}`);
  console.log(`💰 Montant ajouté par utilisateur : ${AMOUNT_TO_ADD.toLocaleString()} FCFA`);
  
  // Vérification finale
  const totalSoldes = await prisma.soldeMedecin.count();
  console.log(`\n📊 Total des enregistrements SoldeMedecin après opération : ${totalSoldes}`);
  
  // Afficher quelques exemples de soldes pour vérification
  if (totalSoldes > 0) {
    const sampleSoldes = await prisma.soldeMedecin.findMany({
      take: 3,
      include: {
        medecin: {
          select: {
            firstName: true,
            lastName: true,
            userType: true
          }
        }
      }
    });
    
    console.log('\n🔍 Exemples de soldes (vérification):');
    for (const solde of sampleSoldes) {
      const balance = decryptBalance(solde.solde);
      console.log(`   - ${solde.medecin.firstName} ${solde.medecin.lastName} (${solde.medecin.userType}): ${balance.toLocaleString()} FCFA`);
    }
  }
  
  if (errors.length > 0) {
    console.log('\n⚠️ Détail des erreurs:');
    errors.forEach(err => {
      console.log(`   - ${err.name} (ID: ${err.userId}): ${err.error}`);
    });
  }
  
  console.log('\n✅ Opération terminée avec succès !');
}

// Exécuter le script
main()
  .catch((e) => {
    console.error('\n💥 Erreur fatale:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });