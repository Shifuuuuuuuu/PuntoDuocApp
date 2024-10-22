// IRecompensa.ts
export interface Recompensa {
  descripcion: string;
  fecha_actualizacion: string;
  fecha_creacion: string;
  nombre: string;
  puntos_requeridos: number;
  tema: string;
  id_recompensa?: string; // Campo opcional para el ID de la recompensa
}
