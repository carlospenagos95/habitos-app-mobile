import { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { Alert, AppState, BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { getExercise, getRoutine, getWorkoutHabit } from '@/db/exercise';
import { markHabitDone } from '@/db/logs';
import { todayLocal } from '@/date';
import { buildSteps, formatClock } from '@/exercise/steps';
import { useSessionTimer } from '@/exercise/useSessionTimer';
import { AREA_STYLE, colors, fontSize, radius, spacing } from '@/theme';
import type { Exercise, RoutineId, SessionStep } from '@/types';

const WORK_COLOR = AREA_STYLE.fisica.color;
const REST_COLOR = colors.primary;

export default function SesionScreen() {
  const { routineId } = useLocalSearchParams<{ routineId: string }>();
  const routine = useMemo(() => getRoutine(routineId as RoutineId), [routineId]);
  const steps = useMemo(() => (routine ? buildSteps(routine) : []), [routine]);

  if (routine == null || steps.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>Rutina no encontrada.</Text>
        <Pressable style={[styles.secondaryButton, styles.backButton]} onPress={() => router.back()}>
          <Text style={styles.secondaryText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  return <Session steps={steps} />;
}

function Session({ steps }: { steps: SessionStep[] }) {
  const timer = useSessionTimer(steps);
  useKeepAwake();
  // Fecha en que empezó la sesión: es la que se registra aunque termine pasada la medianoche.
  const [startDate] = useState(todayLocal);
  // null = aún no terminó; true/false = al terminar, si se registró en el hábito vinculado.
  const [registered, setRegistered] = useState<boolean | null>(null);

  useEffect(() => {
    if (!timer.finished || registered !== null) return;
    const habit = getWorkoutHabit();
    if (habit) markHabitDone(habit.id, startDate);
    setRegistered(habit != null);
  }, [timer.finished, registered, startDate]);

  // Al salir de primer plano la sesión se pausa; el usuario reanuda a mano al volver.
  const { pause } = timer;
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') pause();
    });
    return () => sub.remove();
  }, [pause]);

  const exercises = useMemo(() => {
    const map = new Map<string, Exercise>();
    for (const s of steps) {
      if (s.exerciseId && !map.has(s.exerciseId)) {
        const exercise = getExercise(s.exerciseId);
        if (exercise) map.set(s.exerciseId, exercise);
      }
    }
    return map;
  }, [steps]);

  const confirmExit = () => {
    Alert.alert('Salir de la sesión', 'Perderás el progreso de esta sesión y no se registrará.', [
      { text: 'Seguir entrenando', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  // El botón atrás de Android pide la misma confirmación que "Salir".
  useEffect(() => {
    if (timer.finished) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      confirmExit();
      return true;
    });
    return () => sub.remove();
  });

  if (timer.finished || timer.step == null) {
    return (
      <View style={styles.centered}>
        <Ionicons name="trophy-outline" size={64} color={WORK_COLOR} />
        <Text style={styles.completedTitle}>¡Rutina completada!</Text>
        {registered === true && (
          <View style={styles.registeredRow}>
            <Ionicons name="checkmark-circle" size={20} color={WORK_COLOR} />
            <Text style={styles.message}>Registrado en Hoy</Text>
          </View>
        )}
        {registered === false && (
          <>
            <Text style={styles.message}>
              Agrega el hábito 'Rutina de ejercicio en casa 1 hora' en Física para registrar tus sesiones.
            </Text>
            <Pressable
              style={[styles.primaryButton, styles.backButton, { backgroundColor: WORK_COLOR }]}
              onPress={() => router.replace({ pathname: '/area/[id]', params: { id: 'fisica' } })}
            >
              <Text style={styles.primaryText}>Ir a Física</Text>
            </Pressable>
          </>
        )}
        <Pressable style={[styles.secondaryButton, styles.backButton]} onPress={() => router.back()}>
          <Text style={styles.secondaryText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const step = timer.step;
  const isWork = step.kind === 'work';
  const phaseColor = isWork ? WORK_COLOR : REST_COLOR;
  const exercise = isWork && step.exerciseId ? exercises.get(step.exerciseId) : undefined;
  const nextWork = steps.slice(timer.index + 1).find((s) => s.kind === 'work');
  const nextExercise = nextWork?.exerciseId ? exercises.get(nextWork.exerciseId) : undefined;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.muted}>
          {step.sectionName}
          {step.totalRounds > 1 ? ` · Ronda ${step.round} de ${step.totalRounds}` : ''}
        </Text>
        <Text style={styles.muted}>
          Paso {timer.index + 1} de {steps.length}
        </Text>
      </View>

      <View style={styles.main}>
        <Text style={[styles.phase, { color: phaseColor }]}>{isWork ? 'Trabajo' : 'Descanso'}</Text>
        <Text style={[styles.countdown, { color: phaseColor }]}>{formatClock(timer.remainingSec)}</Text>
        {timer.paused && <Text style={styles.pausedLabel}>En pausa</Text>}

        {isWork ? (
          <>
            <Text style={styles.exerciseName}>{exercise?.name ?? step.exerciseId}</Text>
            <Text style={styles.instructions}>{exercise?.instructions}</Text>
          </>
        ) : (
          <Text style={styles.exerciseName}>Descanso</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.muted}>Siguiente</Text>
        <Text style={styles.nextName}>{nextExercise?.name ?? 'Fin de la rutina'}</Text>
        <Text style={styles.muted}>Tiempo restante total: {formatClock(timer.totalRemainingSec)}</Text>
      </View>

      <View style={styles.controls}>
        <Pressable style={styles.secondaryButton} onPress={confirmExit}>
          <Ionicons name="close" size={20} color={colors.text} />
          <Text style={styles.secondaryText}>Salir</Text>
        </Pressable>
        <Pressable
          style={[styles.primaryButton, { backgroundColor: phaseColor }]}
          onPress={timer.paused ? timer.resume : timer.pause}
        >
          <Ionicons name={timer.paused ? 'play' : 'pause'} size={20} color={colors.surface} />
          <Text style={styles.primaryText}>{timer.paused ? 'Reanudar' : 'Pausar'}</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={timer.skip}>
          <Ionicons name="play-skip-forward" size={20} color={colors.text} />
          <Text style={styles.secondaryText}>Saltar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  message: { fontSize: fontSize.lg, color: colors.text, textAlign: 'center' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between' },
  muted: { fontSize: fontSize.sm, color: colors.textMuted },
  main: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  phase: { fontSize: fontSize.lg, fontWeight: '700', textTransform: 'uppercase' },
  countdown: { fontSize: 72, fontWeight: '700', fontVariant: ['tabular-nums'] },
  pausedLabel: { fontSize: fontSize.md, color: colors.textMuted },
  exerciseName: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text, textAlign: 'center' },
  instructions: { fontSize: fontSize.md, color: colors.text, textAlign: 'center' },
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  nextName: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  controls: { flexDirection: 'row', gap: spacing.sm },
  primaryButton: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  primaryText: { fontSize: fontSize.md, fontWeight: '700', color: colors.surface },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  secondaryText: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  backButton: { flex: 0, paddingHorizontal: spacing.lg },
  completedTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  registeredRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
