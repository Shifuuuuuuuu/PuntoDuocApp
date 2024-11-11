export interface Inscripcion2 {
  inscripcionId?: string;
  eventoId: string;
  userId: string;
  timestamp: any; // Puedes ajustar el tipo según tu implementación
}
export interface Inscripcion {
  id_estudiante?: string;
  id_invitado?: string;
  Nombre_completo: string;
  Rut: string;
  verificado?: boolean;
  puntaje?: number;
  carrera: string;
}
