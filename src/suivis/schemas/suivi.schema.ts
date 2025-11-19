import { TraitementSchema } from "./traitement.schema";

// Suivi reprenant exactement le format du traitement
export const SuiviSchema = {
  id: String,
  patientId: Number,
  ordonanceId: Number,     // liée si existante
  traitement: TraitementSchema,  // Normalisé comme traitement
  date: Date,              // date de prise
  isTaken: Boolean,        // true si pris
  stock: Number,           // quantité disponible
  createdAt: Date,
  updatedAt: Date
};
