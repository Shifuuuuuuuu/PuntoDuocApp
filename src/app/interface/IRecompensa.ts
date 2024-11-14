export interface Recompensa {
  descripcion: string;
  fecha_creacion: string;
  puntos_requeridos: number;
  cantidad: number;
  id_recompensa?: string; // Campo opcional para el ID de la recompensa
  estudiantesReclamaron?: {
    id_estudiante: string;
    reclamado: boolean ;
    qrCode?: string;
    fechaReclamacion: string;
    estado: string;
  }[]; // Mantener este campo como un array de objetos
}
