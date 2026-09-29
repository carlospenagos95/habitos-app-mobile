import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius } from '@/theme';
import { PawIcon } from './PawIcon';

const HEIGHT = 14;
const PAW = 24;

type Props = {
  // Proporción completada, de 0 a 1.
  value: number;
  color?: string;
  pawColor?: string;
  style?: StyleProp<ViewStyle>;
};

// Barra de progreso con una huella en el extremo del relleno.
export function PawProgressBar({ value, color = colors.accent, pawColor = '#E08A3C', style }: Props) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <View
      style={[styles.track, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: pct }}
    >
      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      <PawIcon
        size={PAW}
        color={pawColor}
        style={[styles.paw, { left: `${pct}%`, marginLeft: -PAW / 2 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: HEIGHT, borderRadius: radius.pill, backgroundColor: colors.track },
  fill: { height: HEIGHT, borderRadius: radius.pill },
  paw: { position: 'absolute', top: (HEIGHT - PAW) / 2 },
});
