import { trigger, transition, style, query, animate, group } from '@angular/animations';

export const routeAnimations = trigger('routeAnimations', [
  // Slide horizontal
  transition('HomePage <=> LoginPage', [
    group([
      query(':enter, :leave', style({ position: 'absolute', width: '100%' }), { optional: true }),
      query(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('600ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ], { optional: true }),
      query(':leave', [
        style({ transform: 'translateX(0)', opacity: 1 }),
        animate('600ms ease-in', style({ transform: 'translateX(-100%)', opacity: 0 }))
      ], { optional: true })
    ])
  ]),

  // Slide vertical
  transition('LoginPage <=> RegisterPage', [
    group([
      query(':enter, :leave', style({ position: 'absolute', width: '100%' }), { optional: true }),
      query(':enter', [
        style({ transform: 'translateY(100%)', opacity: 0 }),
        animate('500ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ], { optional: true }),
      query(':leave', [
        style({ transform: 'translateY(0)', opacity: 1 }),
        animate('500ms ease-in', style({ transform: 'translateY(-100%)', opacity: 0 }))
      ], { optional: true })
    ])
  ]),

  // Fade in/out
  transition('RegisterPage <=> UsuariosPage', [
    group([
      query(':enter, :leave', style({ position: 'absolute', width: '100%' }), { optional: true }),
      query(':enter', [
        style({ opacity: 0 }),
        animate('400ms ease-out', style({ opacity: 1 }))
      ], { optional: true }),
      query(':leave', [
        style({ opacity: 1 }),
        animate('400ms ease-in', style({ opacity: 0 }))
      ], { optional: true })
    ])
  ]),

  // Scale effect
  transition('UsuariosPage <=> Estadisticas', [
    group([
      query(':enter, :leave', style({ position: 'absolute', width: '100%' }), { optional: true }),
      query(':enter', [
        style({ transform: 'scale(0.8)', opacity: 0 }),
        animate('400ms ease-out', style({ transform: 'scale(1)', opacity: 1 }))
      ], { optional: true }),
      query(':leave', [
        style({ transform: 'scale(1)', opacity: 1 }),
        animate('400ms ease-in', style({ transform: 'scale(0.8)', opacity: 0 }))
      ], { optional: true })
    ])
  ]),

  // Flip effect
  transition('Estadisticas <=> Pacientes', [
    group([
      query(':enter, :leave', style({ position: 'absolute', width: '100%' }), { optional: true }),
      query(':enter', [
        style({ transform: 'rotateY(90deg)', opacity: 0 }),
        animate('400ms ease-out', style({ transform: 'rotateY(0)', opacity: 1 }))
      ], { optional: true }),
      query(':leave', [
        style({ transform: 'rotateY(0)', opacity: 1 }),
        animate('400ms ease-in', style({ transform: 'rotateY(90deg)', opacity: 0 }))
      ], { optional: true })
    ])
  ]),

  // Zoom in/out
  transition('* <=> NotFoundPage', [
    group([
      query(':enter', [
        style({ transform: 'scale(0.8)', opacity: 0 }),
        animate('500ms ease-out', style({ transform: 'scale(1)', opacity: 1 }))
      ], { optional: true }),
      query(':leave', [
        style({ transform: 'scale(1)', opacity: 1 }),
        animate('500ms ease-in', style({ transform: 'scale(0.8)', opacity: 0 }))
      ], { optional: true })
    ])
  ])
]);
