export interface Evento {
  Cupos: number;
  descripcion: string;
  estado: string;
  fecha: string;
  fecha_creacion: string;
  id_evento: string;
  imagen: string;
  inscritos: number;
  lugar: string;
  sede: string;
  tipo: string;
  titulo: string;
  show?: boolean;
  estaInscrito?: boolean;
  listaEspera?: string[];
  enListaEspera?: boolean;
}
