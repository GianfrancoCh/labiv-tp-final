import { Routes } from '@angular/router';
import { HomeComponent } from './componentes/home/home.component';
import { PageNotFoundComponent } from './componentes/page-not-found/page-not-found.component';
import { LoginComponent } from './componentes/login/login.component';
import { RegistroComponent } from './componentes/registro/registro.component';
import { ListaUsuariosComponent } from './componentes/lista-usuarios/lista-usuarios.component';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: "full" },
    { path: 'home', component: HomeComponent },
    { path: 'ingresar', component: LoginComponent },
    { path: 'registro', component: RegistroComponent},    
    { path: 'test', component: HomeComponent},
    { path: 'usuarios', component: ListaUsuariosComponent, canActivate: [AdminGuard] },
    { path: '**', component: PageNotFoundComponent },
    
];

