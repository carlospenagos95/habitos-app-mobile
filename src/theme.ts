import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

import type { AreaId } from './types';

export type IoniconName = ComponentProps<typeof Ionicons>['name'];

export const colors = {
  primary: '#208AEF',
  background: '#F5F6F8',
  surface: '#FFFFFF',
  text: '#1C1C1E',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  error: '#CC0000',
  warning: '#B06500',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24 };

export const radius = { md: 12 };

export const fontSize = { sm: 14, md: 16, lg: 18, xl: 24 };

export const AREA_STYLE: Record<AreaId, { icon: IoniconName; color: string }> = {
  espiritual: { icon: 'sparkles-outline', color: '#7C5CFF' },
  fisica: { icon: 'barbell-outline', color: '#E4572E' },
  intelectual: { icon: 'book-outline', color: '#2A7FFF' },
  familiar: { icon: 'people-outline', color: '#F2A541' },
  laboral: { icon: 'briefcase-outline', color: '#2E9E6B' },
  emocional: { icon: 'heart-outline', color: '#E0527E' },
};
