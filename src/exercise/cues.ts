import { useCallback } from 'react';
import { Vibration } from 'react-native';
import { useAudioPlayer, type AudioPlayer } from 'expo-audio';
import type { SessionStep } from '../types';

const WORK_SOUND = require('../../assets/sounds/trabajo.wav');
const REST_SOUND = require('../../assets/sounds/descanso.wav');

const WORK_VIBRATION = 400;
const REST_VIBRATION = [0, 150, 100, 150]; // patrón doble

function replay(player: AudioPlayer) {
  player.seekTo(0).catch(() => {});
  player.play();
}

/** Aviso de inicio de fase: sonido + vibración. Los reproductores se liberan al desmontar. */
export function usePhaseCue() {
  const workPlayer = useAudioPlayer(WORK_SOUND);
  const restPlayer = useAudioPlayer(REST_SOUND);

  return useCallback(
    (kind: SessionStep['kind']) => {
      if (kind === 'work') {
        replay(workPlayer);
        Vibration.vibrate(WORK_VIBRATION);
      } else {
        replay(restPlayer);
        Vibration.vibrate(REST_VIBRATION);
      }
    },
    [workPlayer, restPlayer]
  );
}
