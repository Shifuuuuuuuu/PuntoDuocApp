import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';


const routes: Routes = [
  {
    path: '',
    redirectTo: 'iniciar-sesion',
    pathMatch: 'full'
  },
  {
    path: 'folder/:id',
    loadChildren: () => import('./folder/folder.module').then( m => m.FolderPageModule),canActivate: [AuthGuard]
  },
  {
    path: 'perfil-usuario',
    loadChildren: () => import('./perfil-usuario/perfil-usuario.module').then( m => m.PerfilUsuarioPageModule),canActivate: [AuthGuard]
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
    path: 'historial-eventos',
    loadChildren: () => import('./historial-eventos/historial-eventos.module').then( m => m.HistorialEventosPageModule),canActivate: [AuthGuard]
  },
  {
    path: 'estadistica-usuario',
    loadChildren: () => import('./estadistica-usuario/estadistica-usuario.module').then( m => m.EstadisticaUsuarioPageModule),canActivate: [AuthGuard]
  },
  {
    path: 'folder-ventas',
    loadChildren: () => import('./folder-ventas/folder-ventas.module').then( m => m.FolderVentasPageModule),canActivate: [AuthGuard]
  },
  {
    path: 'folder-gestor-eventos',
    loadChildren: () => import('./folder-gestor-eventos/folder-gestor-eventos.module').then( m => m.FolderGestorEventosPageModule),canActivate: [AuthGuard]
  },
  {
    path: 'detalles-evento/:id',
    loadChildren: () => import('./detalles-evento/detalles-evento.module').then( m => m.DetallesEventoPageModule),canActivate: [AuthGuard]
  },
  { path: 'subir-recompensa',
    loadChildren: () => import('./subir-recompensa/subir-recompensa.module').then(m => m.SubirRecompensaPageModule),canActivate: [AuthGuard]
  },
  {
    path: 'ver-recompensas',
    loadChildren: () => import('./ver-recompensas/ver-recompensas.module').then( m => m.VerRecompensasPageModule),canActivate: [AuthGuard]
  },
  {
    path: 'perfil-gestor',
    loadChildren: () => import('./perfil-gestor/perfil-gestor.module').then( m => m.PerfilGestorPageModule),canActivate: [AuthGuard]
  },
  {
    path: 'perfil-ventas',
    loadChildren: () => import('./perfil-ventas/perfil-ventas.module').then(m => m.PerfilVentasPageModule),canActivate: [AuthGuard]
  },
  {
    path: 'dashboard-vendedor',
    loadChildren: () => import('./dashboard-vendedor/dashboard-vendedor.module').then(m => m.DashboardVendedorPageModule),canActivate: [AuthGuard]
  },
  {
    path: 'events-category/:category',
    loadChildren: () => import('./events-category/events-category.module').then( m => m.EventsCategoryPageModule),canActivate: [AuthGuard]
  },
  {
    path: 'event-details/:id_evento',
    loadChildren: () => import('./event-details/event-details.module').then( m => m.EventDetailsPageModule),canActivate: [AuthGuard]
  },
  {
    path: 'consultas',
    loadChildren: () => import('./consultas/consultas.module').then( m => m.ConsultasPageModule),canActivate: [AuthGuard]
  },
  {
    path: 'notifications',
    loadChildren: () => import('./notifications/notifications.module').then( m => m.NotificationsPageModule),canActivate: [AuthGuard]
  },
  {
    path: 'graficos-evento/:id',
    loadChildren: () => import('./graficos-evento/graficos-evento.module').then( m => m.GraficosEventoPageModule),canActivate: [AuthGuard]
  },

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
