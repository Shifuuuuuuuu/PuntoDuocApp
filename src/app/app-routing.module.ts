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
  },
  {
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
  },
  {
    path: 'estadistica-usuario',
    loadChildren: () => import('./estadistica-usuario/estadistica-usuario.module').then( m => m.EstadisticaUsuarioPageModule)
  },
  {
    path: 'centro-ayuda',
    loadChildren: () => import('./centro-ayuda/centro-ayuda.module').then( m => m.CentroAyudaPageModule)
  },
  {
    path: 'accesibilidad',
    loadChildren: () => import('./accesibilidad/accesibilidad.module').then( m => m.AccesibilidadPageModule)
  },
  {
    path: 'permisos-dispositivo',
    loadChildren: () => import('./permisos-dispositivo/permisos-dispositivo.module').then( m => m.PermisosDispositivoPageModule)
  },
  {
    path: 'folder-ventas',
    loadChildren: () => import('./folder-ventas/folder-ventas.module').then( m => m.FolderVentasPageModule)
  },
  {
    path: 'folder-gestor-eventos',
    loadChildren: () => import('./folder-gestor-eventos/folder-gestor-eventos.module').then( m => m.FolderGestorEventosPageModule)
  },
  {
    path: 'detalles-evento/:id',
    loadChildren: () => import('./detalles-evento/detalles-evento.module').then( m => m.DetallesEventoPageModule)
  },
  { path: 'subir-recompensa',
    loadChildren: () => import('./subir-recompensa/subir-recompensa.module').then(m => m.SubirRecompensaPageModule)
  },
  {
    path: 'ver-recompensas',
    loadChildren: () => import('./ver-recompensas/ver-recompensas.module').then( m => m.VerRecompensasPageModule)
  },
  {
    path: 'escanear-qr',
    loadChildren: () => import('./escanear-qr/escanear-qr.module').then( m => m.EscanearQrPageModule)
  },
  {
    path: 'perfil-gestor',
    loadChildren: () => import('./perfil-gestor/perfil-gestor.module').then( m => m.PerfilGestorPageModule)
  },
  {
    path: 'events-category/:category',
    loadChildren: () => import('./events-category/events-category.module').then( m => m.EventsCategoryPageModule)
  },
  {
    path: 'event-details/:id_evento',
    loadChildren: () => import('./event-details/event-details.module').then( m => m.EventDetailsPageModule)
  },  {
    path: 'consultas',
    loadChildren: () => import('./consultas/consultas.module').then( m => m.ConsultasPageModule)
  },
  {
    path: 'recomendacion',
    loadChildren: () => import('./recomendacion/recomendacion.module').then( m => m.RecomendacionPageModule)
  },




];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
