export interface Comentario {
  id_comentario: string;
  id_evento: string;
  titulo_evento: string;
  id_usuario: string;
  nombre_completo: string;
  descripcion: string;
  fecha: Date;
  calificacion: number;
}
