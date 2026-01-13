export type FicheQuestion = {
  id: string;            // UUID
  label: string;
  description?: string;
  type?: 'TEXT' | 'SELECT';
  order?: number;
  options?: {
    label: string;
    value: string;
  }[];
};
