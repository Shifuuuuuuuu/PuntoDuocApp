export interface Notificacion {
  id: string;         // ID de la notificación
  titulo: string;     // Título de la notificación
  descripcion: string; // Descripción de la notificación
  imagen?: string;    // URL de la imagen de la notificación (opcional)
  url?: string;       // URL para redirigir en caso de ser necesario (opcional)
  leido?: boolean;    // Estado de la notificación (leído o no leído)
  fecha?: Date;       // Fecha de creación de la notificación
}
