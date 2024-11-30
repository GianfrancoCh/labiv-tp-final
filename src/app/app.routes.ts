import { Routes } from '@angular/router';
import { HomeComponent } from './componentes/home/home.component';
import { PageNotFoundComponent } from './componentes/page-not-found/page-not-found.component';
import { LoginComponent } from './componentes/login/login.component';
import { RegistroComponent } from './componentes/registro/registro.component';
import { ListaUsuariosComponent } from './componentes/lista-usuarios/lista-usuarios.component';
import { AdminGuard } from './guards/admin.guard';
import { MiPerfilComponent } from './componentes/mi-perfil/mi-perfil.component';
import { TurnosComponent } from './componentes/turnos/turnos/turnos.component';
import { TurnosGuard } from './guards/turnos.guard';
import { MisTurnosEspecialistaComponent } from './componentes/turnos/mis-turnos-especialista/mis-turnos-especialista.component';
import { MisTurnosPacienteComponent } from './componentes/turnos/mis-turnos-paciente/mis-turnos-paciente.component';
import { SolicitarTurnoComponent } from './componentes/turnos/solicitar-turno/solicitar-turno.component';
import { PacientesComponent } from './componentes/pacientes/pacientes.component';
import { EstadisticasComponent } from './componentes/estadisticas/estadisticas.component';
import { animation } from '@angular/animations';

export const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: "full" },
    { path: 'home', component: HomeComponent, data: { animation: 'HomePage' } },
    { path: 'ingresar', component: LoginComponent, data: {animation: 'LoginPage'} },
    { path: 'registro', component: RegistroComponent, data: {animation: 'RegisterPage'} },    
    { path: 'usuarios', component: ListaUsuariosComponent, canActivate: [AdminGuard], data: {animation: 'UsersPage'} },
    { path: 'mi-perfil', component: MiPerfilComponent},
    { path: 'mis-turnos', component: TurnosComponent, canActivate: [TurnosGuard]},
    { path: 'mis-turnos-paciente', component: MisTurnosPacienteComponent },
    { path: 'mis-turnos-especialista', component: MisTurnosEspecialistaComponent },  
    { path: 'solicitar-turno', component: SolicitarTurnoComponent },   
    { path: 'turnos', component: TurnosComponent, canActivate: [AdminGuard] },   
    { path: 'estadisticas', component: EstadisticasComponent, canActivate: [AdminGuard] },   
    { path: 'pacientes', component: PacientesComponent},                    
    { path: '**', component: PageNotFoundComponent },
    
];

