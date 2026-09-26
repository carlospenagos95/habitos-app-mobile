import type { Routine, RoutineSection, SessionStep } from '../types';

/** Duración de una sección con todas sus rondas, en segundos. */
export function sectionDurationSec(section: RoutineSection): number {
  const perRound = section.items.reduce((sum, item) => sum + item.workSec + item.restSec, 0);
  return section.rounds * perRound + (section.rounds - 1) * section.roundRestSec;
}

/** Expande una rutina a la lista plana de pasos que recorre la sesión guiada. */
export function buildSteps(routine: Routine): SessionStep[] {
  const steps: SessionStep[] = [];
  for (const section of routine.sections) {
    for (let round = 1; round <= section.rounds; round++) {
      const base = { sectionName: section.name, round, totalRounds: section.rounds };
      for (const item of section.items) {
        steps.push({ ...base, kind: 'work', durationSec: item.workSec, exerciseId: item.exerciseId });
        if (item.restSec > 0) {
          steps.push({ ...base, kind: 'rest', durationSec: item.restSec, exerciseId: item.exerciseId });
        }
      }
      if (round < section.rounds && section.roundRestSec > 0) {
        steps.push({ ...base, kind: 'rest', durationSec: section.roundRestSec, exerciseId: null });
      }
    }
  }
  return steps;
}

/** Segundos a "m:ss" (o "h:mm:ss" desde una hora). */
export function formatClock(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = String(totalSec % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

export function totalDurationSec(steps: SessionStep[]): number {
  return steps.reduce((sum, step) => sum + step.durationSec, 0);
}
