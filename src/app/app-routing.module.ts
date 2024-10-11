import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'iniciar-sesion',
    pathMatch: 'full'
  },
  {
    path: 'folder/:id',
    loadChildren: () => import('./folder/folder.module').then( m => m.FolderPageModule)
  },
  {
    path: 'perfil-usuario',
    loadChildren: () => import('./perfil-usuario/perfil-usuario.module').then( m => m.PerfilUsuarioPageModule)
  },
  {
    path: 'iniciar-sesion',
    loadChildren: () => import('./iniciar-sesion/iniciar-sesion.module').then( m => m.IniciarSesionPageModule)
  },
  {
    path: 'registrar-usuarios',
    loadChildren: () => import('./registrar-usuarios/registrar-usuarios.module').then( m => m.RegistrarUsuariosPageModule)
  },  {
    path: 'registrar-invitado',
    loadChildren: () => import('./registrar-invitado/registrar-invitado.module').then( m => m.RegistrarInvitadoPageModule)
  },
  {
    path: 'registrar-invitado',
    loadChildren: () => import('./registrar-invitado/registrar-invitado.module').then( m => m.RegistrarInvitadoPageModule)
  },
  {
    path: 'historial-eventos',
    loadChildren: () => import('./historial-eventos/historial-eventos.module').then( m => m.HistorialEventosPageModule)
  }


];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
