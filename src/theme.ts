import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

import type { AreaId } from './types';

export type IoniconName = ComponentProps<typeof Ionicons>['name'];

// Idea 1 "Michi compañero" del canvas de diseño.
export const colors = {
  background: '#FFF8EE', // crema
  surface: '#FFFFFF',
  sky: '#8ECDEB', // cabeceras
  skyInk: '#13354A', // títulos sobre cielo
  skyInkSoft: '#1F4E6B', // subtítulos sobre cielo
  accent: '#6E3B8C', // morado collar: progreso, botón principal, pestaña activa
  accentSoft: '#EFE3F6', // píldora de pestaña activa
  text: '#2B2523',
  textMuted: '#6B625C',
  textDone: '#8A817A', // hábito hecho (tachado)
  track: '#F1EADF', // fondo de barras
  border: '#EFE6D8',
  error: '#CC0000',
  warning: '#B06500',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24 };

export const radius = { sm: 14, md: 18, lg: 22, xl: 26, pill: 99 };

export const fontSize = { sm: 14, md: 16, lg: 18, xl: 24 };

export const fonts = {
  display: 'Fredoka_600SemiBold',
  displayBold: 'Fredoka_700Bold',
  body: 'Nunito_500Medium',
  bodyBold: 'Nunito_700Bold',
  bodyHeavy: 'Nunito_800ExtraBold',
};

// `soft`: fondo claro de tarjeta/ícono. `ink`: texto legible (≥ 4.5:1) sobre `soft`.
export const AREA_STYLE: Record<
  AreaId,
  { icon: IoniconName; color: string; soft: string; ink: string }
> = {
  espiritual: { icon: 'sparkles-outline', color: '#7C5CFF', soft: '#EFEAFF', ink: '#5B45C9' },
  fisica: { icon: 'barbell-outline', color: '#E4572E', soft: '#FDE7DF', ink: '#B33C1B' },
  intelectual: { icon: 'book-outline', color: '#2A7FFF', soft: '#E3EEFF', ink: '#1F5FC4' },
  familiar: { icon: 'people-outline', color: '#F2A541', soft: '#FFE3B8', ink: '#8A5209' },
  laboral: { icon: 'briefcase-outline', color: '#2E9E6B', soft: '#E0F3EA', ink: '#1E7550' },
  emocional: { icon: 'heart-outline', color: '#E0527E', soft: '#FCE3EB', ink: '#B8325C' },
};
