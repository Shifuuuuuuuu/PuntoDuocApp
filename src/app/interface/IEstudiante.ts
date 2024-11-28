export interface Estudiante {
  id_estudiante?: string;
  password: string;
  email: string;
  Nombre_completo: string;
  Rut: string;
  Telefono: string;
  carrera: string;
  codigoQr?: string;
  eventosInscritos?: string[];
  puntaje: number;
  tokenFCM: string | null;
  verificado: boolean;
  imagen?: string;
}

export interface EstudianteSinPassword {
  id_estudiante?: string;
  email: string;
  Nombre_completo: string;
  Rut: string;
  Telefono: string;
  carrera: string;
  codigoQr?: string;
  eventosInscritos?: string[];
  puntaje: number;
  tokenFCM: string | null;
  verificado: boolean;
}
