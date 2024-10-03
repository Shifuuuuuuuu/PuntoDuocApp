import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AngularFireModule } from '@angular/fire/compat';
import { environment } from 'src/environments/environment.prod';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { FormsModule } from '@angular/forms';

import { InvitadoService } from './services/invitado.service'; // Importa el nuevo servicio
import { QRCodeModule } from 'angularx-qrcode';
import { PerfilUsuarioPage } from './perfil-usuario/perfil-usuario.page';

@NgModule({
  declarations: [AppComponent, ],
  imports: [AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireAuthModule ,BrowserModule, IonicModule.forRoot(), AppRoutingModule,FormsModule],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy },InvitadoService],
  bootstrap: [AppComponent],
})
export class AppModule {}
