import type { ReactNode } from 'react';
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';
import { PawIcon } from './PawIcon';

type Paw = { left: DimensionValue; top: DimensionValue; size: number; rotate: number };

// Huellitas decorativas, en posiciones relativas para que escalen con el ancho.
const DEFAULT_PAWS: Paw[] = [
  { left: '6%', top: '48%', size: 32, rotate: -18 },
  { left: '40%', top: '78%', size: 24, rotate: 14 },
  { left: '84%', top: '10%', size: 28, rotate: 22 },
];

type Props = {
  children: ReactNode;
  paws?: Paw[];
  style?: StyleProp<ViewStyle>;
};

// Cabecera azul cielo con huellitas y esquinas inferiores redondeadas.
export function SkyHeader({ children, paws = DEFAULT_PAWS, style }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.md }, style]}>
      {paws.map((paw, i) => (
        <PawIcon
          key={i}
          size={paw.size}
          opacity={0.35}
          style={[styles.paw, { left: paw.left, top: paw.top, transform: [{ rotate: `${paw.rotate}deg` }] }]}
        />
      ))}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.sky,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    overflow: 'hidden',
  },
  paw: { position: 'absolute' },
});
