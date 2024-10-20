export interface QRCodeData {
  qrData: string; // Asegúrate de que esto refleje la estructura real de tus datos
  userId: string;
  eventosInscritos: string[];
}
export interface QRCodeData2 {
  qrData: string; // Asegúrate de que esto refleje la estructura real de tus datos
  id_estudiante?: string; // Ahora es opcional
  id_Invitado?: string; // Ahora es opcional
  eventosInscritos: string[];
  Nombre_completo?: string; // Ahora es opcional
  tipo: string; // Asegúrate de tener este campo
}
