export interface HopitalResponse {
  message: string;
  messageE: string;
  data?: any;
  meta?: {
    total: number;
    page: number;
    limit: number;
    pageCount: number;
  };
}

export interface HopitalStats {
  totalMedecins: number;
  totalReservations: number;
  reservationsAujourdhui: number;
  reservationsParMois: Record<string, number>;
  revenusTotal: number;
  revenusMois: number;
  revenusParMois: Record<string, number>;
  topMedecins: Array<{
    medecinId: number;
    nom: string;
    reservations: number;
    revenus: number;
  }>;
}