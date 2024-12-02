import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root'
})
export class ConsultaService {
  constructor(private firestore: AngularFirestore) {}

  enviarConsulta(consulta: any) {
    return this.firestore.collection('Consultas').add({
      motivo: consulta.motivo,
      mensaje: consulta.mensaje,
      nombre: consulta.nombre,
      correo: consulta.correo,
      estado: "Pendiente",
      timestamp: new Date()
    });
  }
}
