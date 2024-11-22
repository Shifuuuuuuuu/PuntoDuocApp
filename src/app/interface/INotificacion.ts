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
