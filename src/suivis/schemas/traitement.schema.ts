// Normalisation du traitement pour ordonnance et suivi
export const TraitementSchema = {
  id: String,
  name: String,
  dosage: String,       // ex: "500mg", "1 comprimé"
  posologie: String,    // ex: "1x matin, 1x soir"
  forme: String,        // ex: "comprimé", "sirop"
  voie: String,         // ex: "orale", "intraveineuse"
  instructions: String, // ex: "Avant les repas"
  startDate: Date,
  endDate: Date,
  frequency: {
    type: String,       // FREQUENCY_TYPES ("daily", "weekly", ...)
    timesPerDay: Number, // Pour daily
    daysOfWeek: Array,   // Pour weekly [1,3,5]
  },
  notificationTimes: Array, // ["08:00", "13:00", "20:00"]
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
};
