import { useEffect, useMemo, useState } from 'react';
import type { SessionStep } from '../types';

const TICK_MS = 250;

// endAt: timestamp (ms) en que termina el paso actual mientras corre.
// pausedRemainingMs: ms restantes del paso actual si está en pausa; null = corriendo.
type TimerState = { index: number; endAt: number; pausedRemainingMs: number | null };

/** Avanza los pasos vencidos. Encadena desde endAt (no desde "ahora") para no acumular deriva. */
function advance(state: TimerState, steps: SessionStep[], now: number): TimerState {
  if (state.pausedRemainingMs !== null || state.index >= steps.length || now < state.endAt) {
    return state;
  }
  let { index, endAt } = state;
  while (index < steps.length && now >= endAt) {
    index++;
    if (index < steps.length) endAt += steps[index].durationSec * 1000;
  }
  return { ...state, index, endAt };
}

/**
 * Temporizador de la sesión guiada basado en timestamps (Date.now()).
 * El intervalo solo refresca; la cuenta se calcula siempre desde endAt.
 */
export function useSessionTimer(steps: SessionStep[]) {
  const [state, setState] = useState<TimerState>(() => ({
    index: 0,
    endAt: Date.now() + steps[0].durationSec * 1000,
    pausedRemainingMs: null,
  }));
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      setState((s) => advance(s, steps, t));
    }, TICK_MS);
    return () => clearInterval(id);
  }, [steps]);

  // secondsAfter[i] = suma de duraciones de los pasos posteriores a i.
  const secondsAfter = useMemo(() => {
    const result = new Array<number>(steps.length).fill(0);
    for (let i = steps.length - 2; i >= 0; i--) result[i] = result[i + 1] + steps[i + 1].durationSec;
    return result;
  }, [steps]);

  const finished = state.index >= steps.length;
  const paused = state.pausedRemainingMs !== null;
  const remainingMs = paused ? state.pausedRemainingMs! : Math.max(0, state.endAt - now);
  const remainingSec = finished ? 0 : Math.ceil(remainingMs / 1000);

  return {
    index: state.index,
    step: finished ? null : steps[state.index],
    finished,
    paused,
    remainingSec,
    totalRemainingSec: finished ? 0 : remainingSec + secondsAfter[state.index],
    pause: () =>
      setState((s) =>
        s.pausedRemainingMs !== null ? s : { ...s, pausedRemainingMs: Math.max(0, s.endAt - Date.now()) }
      ),
    resume: () =>
      setState((s) =>
        s.pausedRemainingMs === null ? s : { ...s, endAt: Date.now() + s.pausedRemainingMs, pausedRemainingMs: null }
      ),
    /** Termina la fase actual y empieza la siguiente con su duración completa. Respeta la pausa. */
    skip: () =>
      setState((s) => {
        const index = s.index + 1;
        if (index >= steps.length) return { index, endAt: Date.now(), pausedRemainingMs: null };
        const durationMs = steps[index].durationSec * 1000;
        return s.pausedRemainingMs !== null
          ? { index, endAt: s.endAt, pausedRemainingMs: durationMs }
          : { index, endAt: Date.now() + durationMs, pausedRemainingMs: null };
      }),
  };
}
