import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { environment } from './environments/environment'; // Importa la configuración de los entornos

// Inicializa Firebase
const app = initializeApp(environment.firebaseConfig);
export const auth = getAuth(app);
