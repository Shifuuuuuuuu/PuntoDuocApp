export interface UsuarioId {
  userId: string;
  leido: boolean;
  token?: string;
}

export interface Notificacion {
  id: string;
  titulo: string;
  descripcion: string;
  imagen?: string;
  url?: string;
  fecha?: Date;
  fechaTermino?: Date;
  usuarioIds: UsuarioId[];
}

export interface NotificacionesDirectas {
  id: string;
  titulo: string;
  cuerpo: string;
  timestampt: Date;
  usuarioIds: { userId: string; leido: boolean }[];
  tipo?: string; // Nuevo campo para tipo de usuario
  destinatario: string;
}
