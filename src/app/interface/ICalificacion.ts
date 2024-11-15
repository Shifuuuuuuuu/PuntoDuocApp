export interface Calificacion {
  id_puntacion: string;
  id_evento: string;
  titulo_evento: string;
  id_usuario: string;
  nombre_completo: string;
  calificacion: number; // Valor entre 1 y 5
  fecha: Date;
}
