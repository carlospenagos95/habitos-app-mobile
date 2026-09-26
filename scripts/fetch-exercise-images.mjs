// Descarga las 2 imágenes de cada ejercicio de SPEC 03 desde free-exercise-db (Unlicense)
// a assets/exercises/<id>/{0,1}.jpg y genera src/exercise/images.ts con el mapa estático de require().
// Uso (una vez, Node 22.6+ por el import de .ts): node scripts/fetch-exercise-images.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEED_EXERCISES } from '../src/db/seedExercise.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';
const FRAMES = ['0.jpg', '1.jpg'];

async function download(id, frame) {
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(id)}/${frame}`);
  if (!res.ok) throw new Error(`${id}/${frame}: HTTP ${res.status}`);
  const dir = join(ROOT, 'assets', 'exercises', id);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, frame), Buffer.from(await res.arrayBuffer()));
}

for (const { id } of SEED_EXERCISES) {
  await Promise.all(FRAMES.map((frame) => download(id, frame)));
  console.log('ok', id);
}

const entries = SEED_EXERCISES.map(
  ({ id }) =>
    `  '${id}': [\n` +
    FRAMES.map((frame) => `    require('../../assets/exercises/${id}/${frame}'),\n`).join('') +
    '  ],'
).join('\n');

const source = `// Generado por scripts/fetch-exercise-images.mjs. No editar a mano.
// Imágenes de free-exercise-db (github.com/yuhonas/free-exercise-db, Unlicense).
import type { ImageSourcePropType } from 'react-native';

export const EXERCISE_IMAGES: Record<string, [ImageSourcePropType, ImageSourcePropType]> = {
${entries}
};
`;

await writeFile(join(ROOT, 'src', 'exercise', 'images.ts'), source);
console.log(`${SEED_EXERCISES.length} ejercicios, src/exercise/images.ts generado.`);
