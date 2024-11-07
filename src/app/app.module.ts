import { LOCALE_ID, NgModule } from '@angular/core';
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
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { TabBarModule } from './tab-bar/tab-bar.module';
import { TabBarAdminModule } from './tab-bar-admin/tab-bar-admin.module';
import { QRCodeModule } from 'angularx-qrcode';
import { TabUsuarioModule } from './tab-usuario/tab-usuario.module';
import { RecompensasModalComponent } from './recompensas-modal-component/recompensas-modal-component.component';
import { RecompensasReclamadasModalComponent } from './recompensas-reclamadas-modal-component/recompensas-reclamadas-modal-component.component';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { AngularFireMessagingModule } from '@angular/fire/compat/messaging';


registerLocaleData(localeEs);


@NgModule({
  declarations: [AppComponent, RecompensasModalComponent,
    RecompensasReclamadasModalComponent],
  imports: [AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireAuthModule ,BrowserModule, IonicModule.forRoot(), AppRoutingModule,FormsModule,AngularFirestoreModule,TabBarModule,TabBarAdminModule,TabUsuarioModule,AngularFireMessagingModule ],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy },{ provide: LOCALE_ID, useValue: 'es' },InvitadoService,QRCodeModule ],
  bootstrap: [AppComponent],


})
export class AppModule {
  static forChild(): any[] | import("@angular/core").Type<any> | import("@angular/core").ModuleWithProviders<{}> {
    throw new Error('Method not implemented.');
  }
}
