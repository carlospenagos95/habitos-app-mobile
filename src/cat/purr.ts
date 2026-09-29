import { useCallback, useRef } from 'react';
import { useAudioPlayer } from 'expo-audio';

const PURR_SOUND = require('../../assets/sounds/ronroneo.wav');

// El clip dura ≤ 2 s: con este intervalo nunca se solapa.
const MIN_INTERVAL_MS = 2000;

/** Ronroneo al tocar al gato. Como máximo uno cada 2 s; los toques de en medio se ignoran. */
export function usePurr() {
  const player = useAudioPlayer(PURR_SOUND);
  const lastPlayed = useRef(0);

  return useCallback(() => {
    const now = Date.now();
    if (now - lastPlayed.current < MIN_INTERVAL_MS) return;
    lastPlayed.current = now;
    player.seekTo(0).catch(() => {});
    player.play();
  }, [player]);
}
