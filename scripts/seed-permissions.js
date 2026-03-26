/* prisma/scripts/seed-permissions.js */
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

/**
 * Normalise le NAME de permission:
 * - MAJUSCULE
 * - sans accents
 * - séparateurs => underscores
 */
function normalize(name) {
  if (!name) return '';
  return String(name)
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
}

/**
 * Actions (codes) -> phrases françaises (début de phrase)
 * NB: On fait simple et 100% compréhensible.
 */
const ACTION_LABEL = {
  VIEW: 'Consulter',
  LIST: 'Lister',
  GET: "Consulter le détail de",
  SEARCH: 'Rechercher',

  CREATE: 'Ajouter',
  UPDATE: 'Modifier',
  DELETE: 'Supprimer',

  EXPORT: 'Exporter',
  IMPORT: 'Importer',

  ASSIGN: 'Attribuer',
  REMOVE: 'Retirer',

  MANAGE: 'Gérer',
  TOGGLE_STATUS: 'Activer / désactiver',

  CONFIRM: 'Confirmer',
  CANCEL: 'Annuler',
  COMPLETE: 'Clôturer',
  PAY: 'Payer / encaisser',

  UPLOAD: 'Téléverser',
  DOWNLOAD: 'Télécharger',

  SEND: 'Envoyer',
  READ: 'Lire',
  MARK_READ: 'Marquer comme lu',
};

/**
 * Modules (codes) -> objet en français (singulier + pluriel)
 * -> On génère des phrases propres: "Ajouter une fiche structurée", "Lister les fiches structurées"
 */
const MODULE_LABEL = {
  USERS: { one: 'un utilisateur', many: 'les utilisateurs' },
  ROLES: { one: 'un rôle', many: 'les rôles' },
  PERMISSIONS: { one: 'une permission', many: 'les permissions' },

  USER_ROLES: { one: 'un rôle à un utilisateur', many: 'les rôles d’un utilisateur' },
  ROLE_PERMISSIONS: { one: 'une permission à un rôle', many: 'les permissions d’un rôle' },

  SPECIALITIES: { one: 'une spécialité', many: 'les spécialités' },
  PLANNINGS: { one: 'un planning', many: 'les plannings' },
  RESERVATIONS: { one: 'une réservation', many: 'les réservations' },
  ABONNEMENTS: { one: 'un abonnement', many: 'les abonnements' },
  TRANSACTIONS: { one: 'une transaction', many: 'les transactions' },

  ORDONANCES: { one: 'une ordonnance', many: 'les ordonnances' },
  PROTOCOLES_ORDONANCE: { one: 'un protocole d’ordonnance', many: 'les protocoles d’ordonnance' },
  MEDICAMENTS: { one: 'un médicament', many: 'les médicaments' },
  SUIVIS: { one: 'un suivi de traitement', many: 'les suivis de traitement' },
  SOLDE_MEDECIN: { one: 'un solde médecin', many: 'les soldes médecin' },

  FEEDBACKS: { one: 'un avis', many: 'les avis' },
  FAVORITES: { one: 'un favori', many: 'les favoris' },
  VIDEOS: { one: 'une vidéo', many: 'les vidéos' },
  CATEGORIES_VIDEO: { one: 'une catégorie de vidéos', many: 'les catégories de vidéos' },

  CATEGORIES: { one: 'une catégorie', many: 'les catégories' },
  FORMATIONS_CONTINUE: { one: 'une formation continue', many: 'les formations continues' },
  LESSONS: { one: 'une leçon', many: 'les leçons' },

  CONVERSATIONS: { one: 'une conversation', many: 'les conversations' },
  MESSAGES: { one: 'un message', many: 'les messages' },

  CAS_DIFFICILES: { one: 'un cas difficile', many: 'les cas difficiles' },

  // ✅ Ton exemple demandé
  FICHES: { one: 'une fiche structurée', many: 'les fiches structurées' },

  NOTIFICATIONS: { one: 'une notification', many: 'les notifications' },
  PASSWORD_RESET: { one: 'une demande de réinitialisation de mot de passe', many: 'les demandes de réinitialisation de mot de passe' },

  AUTH: { one: "la configuration d’authentification", many: "la configuration d’authentification" },
  SECURITY: { one: 'la configuration de sécurité', many: 'la configuration de sécurité' },

  // Hopital
  HOSPITAL: { one: 'un hôpital', many: 'les hôpitaux' },
  PACKAGE: { one: 'un package', many: 'les packages' },
  SETTINGS: { one: 'la configuration de l’application', many: 'la configuration de l’application' },
};

/**
 * Pour éviter des descriptions bizarres, on définit les actions “pertinentes” par module.
 * -> Ça reste “sans exception” dans le sens où toutes les fonctionnalités réalistes sont couvertes.
 */
const MODULE_ACTIONS = {
  USERS: ['LIST', 'GET', 'SEARCH', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'TOGGLE_STATUS'],
  ROLES: ['LIST', 'GET', 'SEARCH', 'CREATE', 'UPDATE', 'DELETE'],
  PERMISSIONS: ['LIST', 'GET', 'SEARCH', 'CREATE', 'UPDATE', 'DELETE'],

  USER_ROLES: ['GET', 'ASSIGN', 'REMOVE'],
  ROLE_PERMISSIONS: ['GET', 'ASSIGN', 'REMOVE'],

  SPECIALITIES: ['LIST', 'GET', 'SEARCH', 'CREATE', 'UPDATE', 'DELETE'],
  PLANNINGS: ['LIST', 'GET', 'CREATE', 'UPDATE', 'DELETE'],
  RESERVATIONS: ['LIST', 'GET', 'SEARCH', 'CREATE', 'UPDATE', 'DELETE', 'CANCEL', 'COMPLETE', 'PAY'],
  ABONNEMENTS: ['LIST', 'GET', 'SEARCH', 'CREATE', 'UPDATE', 'DELETE', 'CONFIRM', 'CANCEL', 'PAY'],
  TRANSACTIONS: ['LIST', 'GET', 'SEARCH', 'CREATE', 'UPDATE', 'CANCEL', 'PAY'],

  ORDONANCES: ['LIST', 'GET', 'SEARCH', 'CREATE', 'UPDATE', 'DELETE', 'UPLOAD', 'DOWNLOAD'],
  PROTOCOLES_ORDONANCE: ['LIST', 'GET', 'SEARCH', 'CREATE', 'UPDATE', 'DELETE'],
  MEDICAMENTS: ['LIST', 'GET', 'SEARCH', 'CREATE', 'UPDATE', 'DELETE'],
  SUIVIS: ['LIST', 'GET', 'SEARCH', 'CREATE', 'UPDATE', 'DELETE', 'TOGGLE_STATUS'],
  SOLDE_MEDECIN: ['LIST', 'GET', 'SEARCH', 'UPDATE'],

  FEEDBACKS: ['LIST', 'GET', 'SEARCH', 'CREATE', 'UPDATE', 'DELETE'],
  FAVORITES: ['LIST', 'GET', 'CREATE', 'DELETE'],
  VIDEOS: ['LIST', 'GET', 'SEARCH', 'CREATE', 'UPDATE', 'DELETE', 'UPLOAD'],
  CATEGORIES_VIDEO: ['LIST', 'GET', 'SEARCH', 'CREATE', 'UPDATE', 'DELETE'],

  CATEGORIES: ['LIST', 'GET', 'SEARCH', 'CREATE', 'UPDATE', 'DELETE'],
  FORMATIONS_CONTINUE: ['LIST', 'GET', 'SEARCH', 'CREATE', 'UPDATE', 'DELETE'],
  LESSONS: ['LIST', 'GET', 'SEARCH', 'CREATE', 'UPDATE', 'DELETE', 'UPLOAD', 'DOWNLOAD'],

  CONVERSATIONS: ['LIST', 'GET', 'CREATE', 'UPDATE', 'DELETE'],
  MESSAGES: ['LIST', 'GET', 'SEARCH', 'SEND', 'READ', 'MARK_READ', 'UPLOAD', 'DOWNLOAD'],

  CAS_DIFFICILES: ['LIST', 'GET', 'SEARCH', 'CREATE', 'UPDATE', 'DELETE'],
  FICHES: ['LIST', 'GET', 'SEARCH', 'CREATE', 'UPDATE', 'DELETE', 'TOGGLE_STATUS'],

  NOTIFICATIONS: ['LIST', 'GET', 'CREATE', 'DELETE', 'MARK_READ'],
  PASSWORD_RESET: ['CREATE', 'CONFIRM'],

  // Hopital
  HOSPITAL: ['LIST', 'GET', 'SEARCH', 'CREATE', 'UPDATE', 'DELETE'],
  PACKAGE: ['LIST', 'GET', 'SEARCH', 'CREATE', 'UPDATE', 'DELETE'],
  SETTINGS: ['LIST', 'GET', 'UPDATE'],

  AUTH: ['MANAGE'],
  SECURITY: ['MANAGE'],
};

/**
 * Génère une description claire:
 * - LIST => "Lister les fiches structurées"
 * - GET  => "Consulter le détail d’une fiche structurée"
 * - CREATE => "Ajouter une fiche structurée"
 * etc.
 */
function makeDescription(action, module) {
  const a = ACTION_LABEL[action] || action;
  const m = MODULE_LABEL[module] || { one: `le module ${module}`, many: `le module ${module}` };

  // actions orientées "liste"
  if (action === 'LIST') return `${a} ${m.many}`;
  if (action === 'SEARCH') return `${a} dans ${m.many}`;
  if (action === 'VIEW') return `${a} ${m.many}`;
  if (action === 'GET') return `${a} ${m.one}`;

  // actions orientées "objet"
  if (['CREATE', 'UPDATE', 'DELETE', 'CONFIRM', 'CANCEL', 'COMPLETE', 'PAY', 'TOGGLE_STATUS', 'UPLOAD', 'DOWNLOAD', 'SEND', 'READ', 'MARK_READ', 'IMPORT', 'EXPORT', 'MANAGE'].includes(action)) {
    // certains verbes s’expriment mieux au pluriel
    if (action === 'EXPORT') return `${a} ${m.many}`;
    if (action === 'IMPORT') return `${a} ${m.many}`;
    if (action === 'MARK_READ') return `${a} ${m.one}`;
    return `${a} ${m.one}`;
  }

  // assign/remove déjà explicites
  if (action === 'ASSIGN' || action === 'REMOVE') return `${a} ${m.one}`;

  return `${a} ${m.one}`;
}

function makePermission(action, module) {
  const name = normalize(`${action}_${module}`);
  const description = makeDescription(action, module);
  return { name, description };
}

/**
 * Permissions spéciales
 */
const SPECIAL = [
  { name: 'ALL_PERMISSIONS', description: 'Accès total à toutes les permissions' },
  { name: 'ADMIN_PANEL', description: 'Accès au panneau d’administration' },
];

async function main() {
  // 1) Construire la liste complète
  const list = [];

  for (const module of Object.keys(MODULE_ACTIONS)) {
    for (const action of MODULE_ACTIONS[module]) {
      list.push(makePermission(action, module));
    }
  }

  // 2) Ajouter les permissions spéciales
  for (const sp of SPECIAL) {
    list.push({ name: normalize(sp.name), description: sp.description || null });
  }

  // 3) Dédupliquer
  const uniq = new Map();
  for (const p of list) {
    if (!p.name) continue;
    uniq.set(p.name, p);
  }
  const permissions = Array.from(uniq.values()).sort((a, b) => a.name.localeCompare(b.name));

  // 4) Upsert (sécurisé)
  let created = 0;
  let updated = 0;

  for (const p of permissions) {
    const existing = await prisma.permission.findUnique({
      where: { name: p.name },
      select: { permissionId: true, description: true },
    });

    if (!existing) {
      await prisma.permission.create({ data: p });
      created++;
    } else if ((existing.description || null) !== (p.description || null)) {
      await prisma.permission.update({
        where: { permissionId: existing.permissionId },
        data: { description: p.description || null },
      });
      updated++;
    }
  }

  console.log('✅ Permissions seed terminé.');
  console.log(`➡️ Total: ${permissions.length}`);
  console.log(`🟢 Créées: ${created}`);
  console.log(`🟡 Mises à jour: ${updated}`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed permissions:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
