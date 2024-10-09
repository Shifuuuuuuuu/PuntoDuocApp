export interface Estudiante {
  id_estudiante?: string;
  password: string;
  email: string;
  Nombre_completo: string;
  Rut: string;
  Telefono: string;
  carrera: string; // Nuevo campo para la carrera
  codigoQr?: string;
  eventosInscritos?: string[];
  puntaje: string;
}
