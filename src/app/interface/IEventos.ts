import { Inscripcion } from "./IInscripcion";

export interface Evento {
  Cupos: number;
  descripcion: string;
  estado: string;
  fecha: { seconds: number; nanoseconds: number } | string;  // Timestamp o string
  fecha_creacion: string;
  fecha_termino: { seconds: number; nanoseconds: number } | string;
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
  listaEspera?: { userId: string; userName: string; rut: string }[];
  enListaEspera?: boolean;
  timestamp: any;
  categoria: string;
  Inscripciones?: Inscripcion[];
  verificado?: boolean;
  isFavorite?: boolean;
}


