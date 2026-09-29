import { useIsFocused } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import type { CatMood } from './types';

type Point = { x: number; y: number };

// Matriz [a b c d e f] de react-native-svg: escala y giro alrededor de un pivote, más un salto vertical.
// Se anima `matrix` directamente porque es el prop que recibe el componente nativo
// (no está en los tipos públicos de GProps, de ahí el cast).
function aroundPivot(px: number, py: number, sx: number, sy: number, deg: number, ty = 0): GProps {
  'worklet';
  const r = (deg * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  const a = sx * cos;
  const b = sx * sin;
  const c = -sy * sin;
  const d = sy * cos;
  const matrix = [a, b, c, d, px - (a * px + c * py), py - (b * px + d * py) + ty];
  return { matrix } as unknown as GProps;
}

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

const BREATH_MS = 1800;
const TAIL_MS = 1400;
const JUMP_PX = 16; // en unidades del viewBox
const EARS_BACK_DEG = -22;

// Duración de cada reacción antes de volver a idle.
export const MOOD_MS: Record<Exclude<CatMood, 'idle'>, number> = {
  feliz: 800,
  celebra: 1500,
  mimado: 900,
};

// Un salto: sube rápido y cae con un pequeño rebote.
function jump(height: number) {
  'worklet';
  return withSequence(
    withTiming(-height, { duration: 170, easing: Easing.out(Easing.quad) }),
    withTiming(0, { duration: 200, easing: Easing.in(Easing.quad) }),
    withTiming(-height * 0.15, { duration: 80 }),
    withTiming(0, { duration: 80 }),
  );
}

// Animaciones del gato.
// Idle: parpadeo, respiración, vaivén de cola y giro de oreja.
// Moods: feliz (salto), celebra (salto doble), mimado (orejas atrás y vibración de escala).
// `moodKey` cambia en cada disparo para repetir la reacción aunque el mood sea el mismo.
// Con "Reducir movimiento" o la pestaña sin foco el gato queda quieto.
export function useCatAnimation(pivot: Point, mood: CatMood, moodKey: number) {
  const reduceMotion = useReducedMotion();
  const focused = useIsFocused();
  const enabled = focused && !reduceMotion;

  const breath = useSharedValue(0); // 0..1 → escala 1..1.02
  const tail = useSharedValue(0); // grados
  const ear = useSharedValue(0); // grados, giro de la oreja naranja
  const blink = useSharedValue(0); // 0 abierto, 1 cerrado
  const jumpY = useSharedValue(0); // desplazamiento vertical
  const earsBack = useSharedValue(0); // grados, ambas orejas
  const wobble = useSharedValue(1); // escala extra al mimarlo

  // Idle continuo.
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

  // Reacciones. Los ojos (felices / cerrados) los cambia Cat según el mood.
  useEffect(() => {
    if (!enabled || mood === 'idle') return;
    if (mood === 'feliz') {
      jumpY.value = jump(JUMP_PX);
    } else if (mood === 'celebra') {
      jumpY.value = withSequence(jump(JUMP_PX * 1.3), jump(JUMP_PX));
    } else if (mood === 'mimado') {
      earsBack.value = withSequence(
        withTiming(EARS_BACK_DEG, { duration: 150 }),
        withTiming(EARS_BACK_DEG, { duration: MOOD_MS.mimado - 350 }),
        withTiming(0, { duration: 200 }),
      );
      wobble.value = withSequence(
        withTiming(1.03, { duration: 80 }),
        withTiming(0.98, { duration: 80 }),
        withTiming(1.02, { duration: 80 }),
        withTiming(0.99, { duration: 80 }),
        withTiming(1, { duration: 80 }),
      );
    }
    return () => {
      cancelAnimation(jumpY);
      cancelAnimation(earsBack);
      cancelAnimation(wobble);
      jumpY.value = 0;
      earsBack.value = 0;
      wobble.value = 1;
    };
  }, [enabled, mood, moodKey, jumpY, earsBack, wobble]);

  const root = useAnimatedProps(() => {
    const s = (1 + 0.02 * breath.value) * wobble.value;
    return aroundPivot(pivot.x, pivot.y, s, s, 0, jumpY.value);
  });
  const tailProps = useAnimatedProps(() => aroundPivot(0, 0, 1, 1, tail.value));
  // Misma rotación en local para las dos orejas: la naranja está espejada, así que ambas van hacia afuera.
  const earLeft = useAnimatedProps(() => aroundPivot(EAR_PIVOT.x, EAR_PIVOT.y, 1, 1, earsBack.value));
  const earRight = useAnimatedProps(() =>
    aroundPivot(EAR_PIVOT.x, EAR_PIVOT.y, 1, 1, ear.value + earsBack.value),
  );
  const eyes = useAnimatedProps(() => aroundPivot(0, EYES_CENTER_Y, 1, 1 - 0.9 * blink.value, 0));

  return { root, tail: tailProps, earLeft, earRight, eyes, reduceMotion };
}

export type CatAnimation = ReturnType<typeof useCatAnimation>;

// Estado de reacción para las pantallas: `trigger('feliz')` y vuelve solo a idle.
// Se esparce en <Cat {...cat.props} />.
export function useCatMood() {
  const [state, setState] = useState<{ mood: CatMood; moodKey: number }>({ mood: 'idle', moodKey: 0 });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trigger = useCallback((mood: Exclude<CatMood, 'idle'>) => {
    if (timer.current) clearTimeout(timer.current);
    setState((prev) => ({ mood, moodKey: prev.moodKey + 1 }));
    timer.current = setTimeout(() => setState((prev) => ({ ...prev, mood: 'idle' })), MOOD_MS[mood]);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { props: state, trigger };
}
