import { useIsFocused } from 'expo-router';
import { useEffect } from 'react';
import {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { GProps } from 'react-native-svg';

import { EAR_PIVOT, EYES_CENTER_Y } from './parts';

type Point = { x: number; y: number };

// Matriz [a b c d e f] de react-native-svg: escala y giro alrededor de un pivote.
// Se anima `matrix` directamente porque es el prop que recibe el componente nativo
// (no está en los tipos públicos de GProps, de ahí el cast).
function aroundPivot(px: number, py: number, sx: number, sy: number, deg: number): GProps {
  'worklet';
  const r = (deg * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  const a = sx * cos;
  const b = sx * sin;
  const c = -sy * sin;
  const d = sy * cos;
  const matrix = [a, b, c, d, px - (a * px + c * py), py - (b * px + d * py)];
  return { matrix } as unknown as GProps;
}

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

const BREATH_MS = 1800;
const TAIL_MS = 1400;

// Animaciones idle del gato: parpadeo, respiración, vaivén de cola y giro de oreja.
// `pivot` es el punto de apoyo de la pose (centro inferior) para la respiración.
// Con "Reducir movimiento" o la pestaña sin foco el gato queda quieto.
export function useCatAnimation(pivot: Point) {
  const reduceMotion = useReducedMotion();
  const focused = useIsFocused();
  const enabled = focused && !reduceMotion;

  const breath = useSharedValue(0); // 0..1 → escala 1..1.02
  const tail = useSharedValue(0); // grados
  const ear = useSharedValue(0); // grados
  const blink = useSharedValue(0); // 0 abierto, 1 cerrado

  useEffect(() => {
    if (!enabled) return;

    const inOut = Easing.inOut(Easing.sin);
    breath.value = withRepeat(withTiming(1, { duration: BREATH_MS, easing: inOut }), -1, true);
    tail.value = withRepeat(
      withSequence(
        withTiming(8, { duration: TAIL_MS, easing: inOut }),
        withTiming(-6, { duration: TAIL_MS, easing: inOut }),
      ),
      -1,
    );

    // Parpadeo y oreja con intervalos aleatorios para que no se vea mecánico.
    const timers: ReturnType<typeof setTimeout>[] = [];
    const scheduleBlink = () => {
      timers[0] = setTimeout(() => {
        blink.value = withSequence(withTiming(1, { duration: 70 }), withTiming(0, { duration: 110 }));
        scheduleBlink();
      }, randomBetween(3000, 6000));
    };
    const scheduleEar = () => {
      timers[1] = setTimeout(() => {
        ear.value = withSequence(
          withTiming(-14, { duration: 90 }),
          withTiming(4, { duration: 110 }),
          withTiming(0, { duration: 140 }),
        );
        scheduleEar();
      }, randomBetween(5000, 9000));
    };
    scheduleBlink();
    scheduleEar();

    return () => {
      timers.forEach(clearTimeout);
      for (const v of [breath, tail, ear, blink]) {
        cancelAnimation(v);
        v.value = 0;
      }
    };
  }, [enabled, breath, tail, ear, blink]);

  const root = useAnimatedProps(() => {
    const s = 1 + 0.02 * breath.value;
    return aroundPivot(pivot.x, pivot.y, s, s, 0);
  });
  const tailProps = useAnimatedProps(() => aroundPivot(0, 0, 1, 1, tail.value));
  const earProps = useAnimatedProps(() => aroundPivot(EAR_PIVOT.x, EAR_PIVOT.y, 1, 1, ear.value));
  const eyes = useAnimatedProps(() => aroundPivot(0, EYES_CENTER_Y, 1, 1 - 0.9 * blink.value, 0));

  return { root, tail: tailProps, ear: earProps, eyes };
}

export type CatAnimation = ReturnType<typeof useCatAnimation>;
