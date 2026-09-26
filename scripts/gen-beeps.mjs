// Genera los 2 beeps de la sesión guiada (SPEC 03) como WAV PCM 16 bit mono.
// Uso (una vez): node scripts/gen-beeps.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'sounds');
const SAMPLE_RATE = 44100;
const DURATION_MS = 300;
const FADE_MS = 10; // rampa de entrada/salida para evitar clics

function sineWav(frequency) {
  const samples = Math.round((SAMPLE_RATE * DURATION_MS) / 1000);
  const fade = Math.round((SAMPLE_RATE * FADE_MS) / 1000);
  const data = Buffer.alloc(samples * 2);
  for (let i = 0; i < samples; i++) {
    const envelope = Math.min(1, i / fade, (samples - 1 - i) / fade);
    const value = Math.sin((2 * Math.PI * frequency * i) / SAMPLE_RATE) * envelope * 0.8;
    data.writeInt16LE(Math.round(value * 32767), i * 2);
  }

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // tamaño del bloque fmt
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits por muestra
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

await mkdir(OUT_DIR, { recursive: true });
await writeFile(join(OUT_DIR, 'trabajo.wav'), sineWav(880));
await writeFile(join(OUT_DIR, 'descanso.wav'), sineWav(440));
console.log('assets/sounds/trabajo.wav y descanso.wav generados.');
