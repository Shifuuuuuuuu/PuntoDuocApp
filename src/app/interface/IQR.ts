export interface QRCodeData {
  qrData: string; // Asegúrate de que esto refleje la estructura real de tus datos
  userId: string;
  eventosInscritos: string[];
}
export interface QRCodeData2 {
  qrData: string;
  id_estudiante?: string;
  id_Invitado?: string;
  eventosInscritos: string[];
  Nombre_completo?: string;
  tipo: string;
}
