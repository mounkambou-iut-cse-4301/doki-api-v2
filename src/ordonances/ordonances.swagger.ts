import { CreateOrdonanceDto } from './dto/create-ordonance.dto';

// Données fictives pour la documentation, à adapter avant toute création réelle.
const traitementModele = {
  name: 'Médicament exemple A',
  dosage: 'Dosage à renseigner par le médecin',
  forme: 'comprimé',
  voie: 'orale',
  posologie: 'Posologie à renseigner par le médecin',
  instructions: 'Instructions à renseigner par le médecin',
  startDate: '2026-10-15',
  endDate: '2026-10-22',
  frequency: { type: 'daily', timesPerDay: 2 },
  notificationTimes: ['08:00', '20:00'],
  isActive: true,
};

const ordonnanceManuelle: CreateOrdonanceDto = {
  reservationId: 30,
  medecinId: 10,
  patientId: 20,
  name: 'Ordonnance exemple',
  dureeTraitement: 'Une semaine',
  traitement: [{ ...traitementModele }],
  comment: 'Exemple technique : adapter les identifiants et le traitement.',
};

export const ordonnanceExamples = {
  manuelle: {
    summary: '1. Saisie manuelle — un traitement quotidien',
    description:
      'Un suivi est créé pour ce traitement actif. Remplacer les IDs, les dates et les données du traitement avant exécution.',
    value: ordonnanceManuelle,
  },
  plusieursTraitements: {
    summary: '2. Plusieurs traitements — quotidien et hebdomadaire',
    description:
      'Un suivi par traitement actif. Pour weekly, daysOfWeek utilise 1 = lundi à 7 = dimanche ; notificationTimes contient les heures HH:mm.',
    value: {
      ...ordonnanceManuelle,
      traitement: [
        ...ordonnanceManuelle.traitement,
        {
          ...traitementModele,
          name: 'Médicament exemple B',
          frequency: { type: 'weekly', daysOfWeek: [1, 3, 5] },
          notificationTimes: ['09:00'],
        },
      ],
    },
  },
  depuisProtocole: {
    summary: '3. Envoyer un protocole adapté au patient',
    description:
      'Lire GET /protocoles-ordonance/{id}, copier item.traitement et compléter tous les champs requis. Adapter les dates et les prises, puis envoyer ce corps à POST /ordonances avec patientId uniquement au niveau principal. protocoleId seul ne suffit pas.',
    value: {
      ...ordonnanceManuelle,
      name: 'Protocole exemple adapté au patient',
      comment:
        'Traitements copiés depuis un protocole et adaptés par le médecin.',
    },
  },
  avecLien: {
    summary: '4. Traitements avec pièce jointe par URL',
    description:
      'Les liens HTTP(S) sont conservés tels quels. Les pièces jointes complètent les traitements ; elles ne créent pas de suivis à elles seules.',
    value: {
      ...ordonnanceManuelle,
      images: ['https://example.com/ordonnance.png'],
    },
  },
  avecBase64: {
    summary: '5. Traitements avec pièce jointe base64',
    description:
      'Une Data URL image ou PDF est envoyée sur Cloudinary, puis remplacée par son URL. Le base64 brut sans préfixe ne convient pas au champ images. Cet exemple contient un PNG de 1 pixel.',
    value: {
      ...ordonnanceManuelle,
      images: [
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=',
      ],
    },
  },
  sansSuivi: {
    summary: '6. Traitement inactif — sans suivi automatique',
    description:
      'isActive: false conserve le traitement dans l’ordonnance sans créer de suivi pour cet élément. Ses champs restent obligatoires. Cela ne désactive pas la notification de nouvelle ordonnance.',
    value: {
      ...ordonnanceManuelle,
      traitement: [{ ...ordonnanceManuelle.traitement[0], isActive: false }],
    },
  },
};

export const createOrdonnanceDescription = `
Crée une ordonnance pour une réservation et la rend consultable dans l’application.
Choisir un corps complet dans la liste **Examples**. Les IDs et traitements sont fictifs : les adapter avant d’exécuter la requête.

### Saisie manuelle
Fournir reservationId, medecinId, patientId et au moins un élément dans traitement.
Une seule ordonnance est autorisée par réservation. name, dureeTraitement, comment et images sont facultatifs.

### À partir d’un protocole
1. Chercher un modèle via GET /protocoles-ordonance?q=nom, puis lire GET /protocoles-ordonance/{id}.
2. Copier item.traitement dans traitement. Le modèle est stocké comme JSON : compléter les champs éventuellement manquants.
3. Adapter les dates, les prises et isActive au patient. Aucun patientId n’est nécessaire dans les traitements.
4. Fournir reservationId, medecinId et patientId uniquement au niveau principal. Reprendre si nécessaire item.name et item.images, puis appeler POST /ordonances.

Cette route ne résout pas de protocoleId et n’accepte pas un protocole seul comme substitut au tableau traitement.
POST /protocoles-ordonance enregistre uniquement un modèle réutilisable : cette opération n’envoie rien au patient et ne crée aucun suivi.

### Champs des traitements
Chaque élément doit contenir name, dosage, forme, voie, posologie, instructions, startDate, endDate, frequency, notificationTimes et isActive.
Les six champs name, dosage, forme, voie, posologie et instructions doivent être des chaînes non vides pour cette route, même si certains sont facultatifs dans le DTO partagé des suivis.
Utiliser des dates ISO 8601, frequency.type = daily ou weekly, et au moins une heure au format HH:mm.
Pour daily, renseigner timesPerDay ; pour weekly, renseigner daysOfWeek (1 = lundi, 7 = dimanche).
dureeTraitement est un libellé : il ne calcule pas les dates des traitements.
Ne pas fournir patientId ou ordonanceId dans les traitements : le serveur lie les suivis au patient principal et à l’ordonnance créée. Si un ancien client envoie ces champs dans un traitement, ils sont ignorés par la validation HTTP.

### Pièces jointes
images accepte des URL HTTP(S) ou des Data URL data:image/...;base64,... et data:application/pdf;base64,..., y compris un mélange des deux.
Les URL sont conservées ; les Data URL sont envoyées sur Cloudinary. Une image ou un PDF seul ne remplace pas traitement et ne fait pas l’objet d’une extraction automatique des médicaments.

### Suivis et notifications
Un suivi est créé automatiquement pour chaque traitement avec isActive = true ; aucun pour isActive = false.
L’ordonnance et ses suivis sont créés dans une seule transaction. Si un suivi échoue, tout est annulé et aucune notification n’est envoyée.
Après validation, la création de notifications dans l’application est lancée pour le patient et le médecin, ainsi qu’un push si leur token Expo est reconnu.
HTTP 201 confirme la création de l’ordonnance et des suivis actifs, pas la livraison du push : les notifications sont lancées sans attendre leur résultat.
Consulter ensuite GET /ordonances/{id} (champ Suivi) ou GET /suivis?patientId=20&ordonanceId=40 avec les IDs réels.
`;

export const protocoleExample = {
  name: 'Protocole exemple réutilisable',
  description:
    'Modèle à compléter et à adapter au patient avant création d’une ordonnance.',
  traitement: [traitementModele],
};
