export type CatScreen = 'hoy' | 'areas' | 'progreso' | 'ejercicio';

export type CatState =
  | { screen: 'hoy'; kind: 'sin-habitos' | 'cero' | 'progreso' | 'completo'; done: number; total: number }
  | { screen: 'areas'; kind: 'foco' | 'todo-hecho' | 'sin-habitos'; areaName?: string; pending?: number }
  | { screen: 'progreso'; kind: 'con-racha' | 'sin-racha'; streak?: number; habitName?: string }
  | { screen: 'ejercicio'; kind: 'pendiente' | 'hecho' | 'sin-rutina'; routineName?: string };

type Phrases = {
  [S in CatState as S['screen']]: Record<S['kind'], string[]>;
};

// Frases fijas por (pantalla, estado). Marcadores:
// {done} {total} {areaName} {habitName} {routineName}
// {quedan} → "Queda 1" / "Quedan N" (pendientes); {dias} → "1 día" / "N días".
// En Hoy, las de 'cero', 'progreso' y 'completo' incluyen "X de Y" para cuadrar con la tarjeta.
const PHRASES: Phrases = {
  hoy: {
    'sin-habitos': [
      'Aún no tienes hábitos. ¿Vamos a Áreas a elegir unos?',
      'Mi plato de hábitos está vacío. ¡Llénalo en Áreas!',
      'Sin hábitos no hay mimos… Agrega uno en Áreas.',
    ],
    cero: [
      'Llevas {done} de {total}. ¡Empecemos con uno pequeñito!',
      '{done} de {total} por ahora. Yo ya me estiré, ¿y tú?',
      '{done} de {total}: el primero es el más rico.',
    ],
    progreso: [
      'Ya llevas {done} de {total}. Voy a ronronear hasta que termines.',
      '{done} de {total}. ¡Tus patitas van rápido!',
      'Vas {done} de {total}. {quedan}, ¡tú puedes!',
    ],
    completo: [
      '¡{done} de {total}! Día perfecto, me gané una siesta.',
      '¡Todo hecho, {done} de {total}! Miau de orgullo.',
      '¡{done} de {total}! Hoy te ganaste mil ronroneos.',
    ],
  },
  areas: {
    foco: [
      'Cada área es un rincón de la casa. Hoy olfateo el de {areaName}.',
      'El rincón {areaName} espera tus patitas. {quedan} ahí.',
      'Hoy me asomo a {areaName}: {quedan} por hacer.',
    ],
    'todo-hecho': [
      '¡Todos los rincones en orden! Hoy no hay nada que olfatear.',
      'Seis rincones limpiecitos. ¡Qué casa tan feliz!',
    ],
    'sin-habitos': [
      'Tus 6 rincones están vacíos. Toca uno y elige hábitos.',
      'Aún no hay nada que olfatear. ¡Agrega hábitos a un rincón!',
    ],
  },
  progreso: {
    'con-racha': [
      '¡{habitName} lleva {dias} de racha! Te traje un trofeo.',
      '{dias} de racha con {habitName}. ¡Soy tu fan número uno!',
      'Tu mejor racha: {habitName}, {dias}. ¡No la sueltes!',
    ],
    'sin-racha': [
      'Aún no hay rachas. Marca hoy un hábito y empezamos.',
      'Las rachas empiezan con un día. ¡Hoy puede ser el primero!',
    ],
  },
  ejercicio: {
    pendiente: [
      'Hoy toca {routineName}. Yo ya estiré, ¡te toca!',
      '¿Estiramos juntos? Hoy es {routineName}.',
      '{routineName} te espera. Yo cuento las repeticiones.',
    ],
    hecho: [
      '¡Rutina lista! Ahora sí, a estirarse al sol.',
      'Ya entrenaste hoy. ¡Músculos de tigre!',
    ],
    'sin-rutina': [
      'Hoy no hay rutina. Día de descanso felino.',
      'Sin rutina hoy: estirarse y dormir también cuenta.',
    ],
  },
};

const quedan = (n: number) => (n === 1 ? 'Queda 1' : `Quedan ${n}`);
const dias = (n: number) => (n === 1 ? '1 día' : `${n} días`);

function values(state: CatState): Record<string, string> {
  switch (state.screen) {
    case 'hoy':
      return {
        done: String(state.done),
        total: String(state.total),
        quedan: quedan(state.total - state.done),
      };
    case 'areas':
      return { areaName: state.areaName ?? '', quedan: quedan(state.pending ?? 0) };
    case 'progreso':
      return { habitName: state.habitName ?? '', dias: dias(state.streak ?? 0) };
    case 'ejercicio':
      return { routineName: state.routineName ?? '' };
  }
}

/** Frase del gato para el estado. `index` sube al tocar al gato; rota con módulo. */
export function getCatMessage(state: CatState, index: number): string {
  const list: string[] = (PHRASES[state.screen] as Record<string, string[]>)[state.kind];
  const template = list[((index % list.length) + list.length) % list.length];
  const vars = values(state);
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? '');
}
