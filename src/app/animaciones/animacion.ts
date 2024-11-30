import { trigger, transition, style, query, animate, group } from '@angular/animations';

export const routeAnimations = trigger('routeAnimations', [
  transition('HomePage <=> LoginPage, LoginPage <=> RegisterPage, RegisterPage <=> UsuariosPage', [
    query(':enter, :leave', style({ position: 'absolute', width: '100%' }), { optional: true }),
    group([
      query(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('600ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ], { optional: true }),
      query(':leave', [
        style({ transform: 'translateX(0)', opacity: 1 }),
        animate('600ms ease-in', style({ transform: 'translateX(-100%)', opacity: 0 }))
      ], { optional: true })
    ]),
  ]),

  transition('UsuariosPage <=> ProfilePage, AppointmentsPage <=> UsuariosPage', [
    query(':enter, :leave', style({ position: 'absolute', width: '100%' }), { optional: true }),
    group([
      query(':enter', [
        style({ transform: 'translateY(100%)', opacity: 0 }),
        animate('500ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ], { optional: true }),
      query(':leave', [
        style({ transform: 'translateY(0)', opacity: 1 }),
        animate('500ms ease-in', style({ transform: 'translateY(-100%)', opacity: 0 }))
      ], { optional: true })
    ]),
  ]),

  transition('* <=> UsuariosPage', [
    query(':enter, :leave', style({ position: 'absolute', width: '100%' }), { optional: true }),
    group([
      query(':enter', [
        style({ transform: 'translateY(100%)', opacity: 0 }),
        animate('500ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ], { optional: true }),
      query(':leave', [
        style({ transform: 'translateY(0)', opacity: 1 }),
        animate('500ms ease-in', style({ transform: 'translateY(-100%)', opacity: 0 }))
      ], { optional: true }),
    ]),
  ]),

  transition('* <=> Estadisticas', [
    query(':enter, :leave', style({ position: 'absolute', width: '100%' }), { optional: true }),
    group([
      query(':enter', [
        style({ transform: 'translateY(100%)', opacity: 0 }),
        animate('500ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ], { optional: true }),
      query(':leave', [
        style({ transform: 'translateY(0)', opacity: 1 }),
        animate('500ms ease-in', style({ transform: 'translateY(-100%)', opacity: 0 }))
      ], { optional: true }),
    ]),
  ]),
  transition('* <=> *', [
    query(':enter, :leave', style({ position: 'absolute', width: '100%' }), { optional: true }),
    group([
      query(':enter', [
        style({ opacity: 0 }),
        animate('400ms ease-out', style({ opacity: 1 }))
      ], { optional: true }),
      query(':leave', [
        style({ opacity: 1 }),
        animate('400ms ease-in', style({ opacity: 0 }))
      ], { optional: true })
    ]),
  ]),

  transition('* <=> NotFoundPage', [
    query(':enter', [
      style({ transform: 'scale(0.8)', opacity: 0 }),
      animate('400ms ease-out', style({ transform: 'scale(1)', opacity: 1 }))
    ], { optional: true }),
    query(':leave', [
      style({ transform: 'scale(1)', opacity: 1 }),
      animate('300ms ease-in', style({ transform: 'scale(0.8)', opacity: 0 }))
    ], { optional: true })
  ])
]);
