import type { Routine, SessionStep } from '../types';

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

export function totalDurationSec(steps: SessionStep[]): number {
  return steps.reduce((sum, step) => sum + step.durationSec, 0);
}
