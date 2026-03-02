// src/fiches/types/fiche.types.ts (à créer si nécessaire)
export type FicheQuestion = {
  id: string;
  label: string;
    description?: string;
  type: 'TEXT' | 'SELECT';
  order: number;
  multiple?: boolean;  // 👈 NOUVEAU : pour SELECT multi-choix
  options?: {
    label: string;
    value: string;
  }[];
};