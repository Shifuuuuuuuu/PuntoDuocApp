export interface Invitado {
    id_Invitado?: string;
    password: string;
    email: string;
    Nombre_completo: string;
    Rut: string;
    Telefono: string;
    codigoQr?: string;
    eventosInscritos?: string[];
  }
