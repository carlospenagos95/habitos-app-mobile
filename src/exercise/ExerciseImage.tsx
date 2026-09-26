import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { colors, radius } from '@/theme';
import { EXERCISE_IMAGES } from './images';

const FRAME_MS = 800;

/** Imagen "animada" del ejercicio: alterna sus dos fotos (inicio/fin) cada 800 ms. */
export function ExerciseImage({ exerciseId, paused }: { exerciseId: string; paused: boolean }) {
  const [frame, setFrame] = useState(0);
  const frames = EXERCISE_IMAGES[exerciseId];

  useEffect(() => {
    setFrame(0);
    if (paused) return;
    const id = setInterval(() => setFrame((f) => (f + 1) % 2), FRAME_MS);
    return () => clearInterval(id);
  }, [exerciseId, paused]);

  if (!frames) return null;

  return (
    <View style={styles.frame}>
      {/* Ambas montadas para que el cambio no parpadee mientras carga la otra. */}
      {frames.map((source, i) => (
        <Image
          key={i}
          source={source}
          resizeMode="contain"
          style={[StyleSheet.absoluteFill, { opacity: frame === i ? 1 : 0 }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    aspectRatio: 4 / 3,
    maxHeight: 260,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
});
