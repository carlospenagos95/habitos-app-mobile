import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { PawIcon } from '@/ui/PawIcon';
import { catPalette } from './palette';

type Particle = { kind: 'paw' | 'heart'; x: number; drift: number; size: number; color: string; delay: number };

// 8 partículas: posición horizontal (0..1 del ancho), deriva lateral y retraso escalonado.
const PARTICLES: Particle[] = [
  { kind: 'heart', x: 0.12, drift: -10, size: 18, color: catPalette.nose, delay: 0 },
  { kind: 'paw', x: 0.28, drift: 8, size: 20, color: catPalette.orange, delay: 90 },
  { kind: 'heart', x: 0.44, drift: -6, size: 16, color: catPalette.collar, delay: 180 },
  { kind: 'paw', x: 0.6, drift: 10, size: 18, color: catPalette.collar, delay: 40 },
  { kind: 'heart', x: 0.76, drift: 6, size: 20, color: catPalette.nose, delay: 140 },
  { kind: 'paw', x: 0.9, drift: -8, size: 16, color: catPalette.orange, delay: 230 },
  { kind: 'paw', x: 0.2, drift: 12, size: 14, color: catPalette.gray, delay: 300 },
  { kind: 'heart', x: 0.68, drift: -12, size: 14, color: catPalette.cheek, delay: 340 },
];

const DURATION = 1150; // + el mayor retraso ≈ 1.5 s

function Rising({ p, rise }: { p: Particle; rise: number }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(p.delay, withTiming(1, { duration: DURATION, easing: Easing.out(Easing.quad) }));
  }, [t, p.delay]);

  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.15 ? t.value / 0.15 : 1 - (t.value - 0.15) / 0.85,
    transform: [
      { translateY: -rise * t.value },
      { translateX: p.drift * Math.sin(t.value * Math.PI) },
      { scale: 0.6 + 0.4 * Math.min(1, t.value * 3) },
    ],
  }));

  return (
    <Animated.View style={[styles.particle, { left: `${p.x * 100}%`, marginLeft: -p.size / 2 }, style]}>
      {p.kind === 'paw' ? (
        <PawIcon size={p.size} color={p.color} />
      ) : (
        <Ionicons name="heart" size={p.size} color={p.color} />
      )}
    </Animated.View>
  );
}

// Huellitas y corazones que suben desde la base del gato y se desvanecen.
// Se monta en cada celebración (con `key`) para que la animación empiece de cero.
export function Celebration({ height }: { height: number }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {PARTICLES.map((p, i) => (
        <Rising key={i} p={p} rise={height * 0.9} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: { position: 'absolute', bottom: 0 },
});
