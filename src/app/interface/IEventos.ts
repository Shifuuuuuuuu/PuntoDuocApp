import { Inscripcion } from "./IInscripcion";

export interface Evento {
  id?: string;
  Cupos: number;
  descripcion: string;
  estado: string;
  fecha: { seconds: number; nanoseconds: number } | Date | null;  // Timestamp o string
  fecha_creacion: string;
  fecha_termino: { seconds: number; nanoseconds: number } | Date | null;
  fechaInicio: Date | null; // Cambiado a Date | null
  fechaFin: Date | null;
  id_evento: string;
  imagen: string;
  inscritos: number;
  lugar: string;
  sede: string;
  tipo: string;
  titulo: string;
  show?: boolean;
  estaInscrito?: boolean;
  listaEspera?: { userId: string; userName: string; rut: string, id_Invitado?: string; id_estudiante?: string;  Nombre_completo?: string; Rut?: string; }[];
  enListaEspera?: boolean;
  timestamp: any;
  categoria: string;
  Inscripciones?: Inscripcion[];
  verificado?: boolean;
  isFavorite?: boolean;
  verificados?: number; // Agrega esta propiedad para contar los verificados
  puntaje: number;
  favoritos: boolean;
  gestorAsignadoId: string;
  tipo_usuario: string
}


