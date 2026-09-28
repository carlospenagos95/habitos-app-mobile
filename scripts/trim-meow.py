# Genera assets/sounds/maullido.wav (SPEC 05) a partir del WAV CC0 descargado de freesound.
# Recorta un maullido, lo pasa a mono 44.1 kHz 16 bit, aplica fundido y normaliza.
# Solo stdlib. Uso: python scripts/trim-meow.py [entrada.wav] [inicio_s] [fin_s]
import array
import sys
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_IN = ROOT / 'scripts' / '_tmp' / 'meow-original.wav'
OUT = ROOT / 'assets' / 'sounds' / 'maullido.wav'

# Maullido más fuerte y ascendente del original (ver RMS por ventanas de 50 ms).
DEFAULT_START = 5.50
DEFAULT_END = 6.50
MAX_SECONDS = 2.0
OUT_RATE = 44100
FADE_IN_MS = 15
FADE_OUT_MS = 80
PEAK = 0.89  # ~ -1 dBFS


def read_mono(path):
    with wave.open(str(path)) as w:
        channels, width, rate = w.getnchannels(), w.getsampwidth(), w.getframerate()
        raw = w.readframes(w.getnframes())
    if width == 2:
        samples = [v / 32768 for v in array.array('h', raw)]
    elif width == 3:
        samples = [int.from_bytes(raw[i:i + 3], 'little', signed=True) / 8388608 for i in range(0, len(raw), 3)]
    elif width == 4:
        samples = [v / 2147483648 for v in array.array('i', raw)]
    else:
        sys.exit(f'Profundidad no soportada: {width * 8} bit')
    if channels > 1:
        samples = [sum(samples[i:i + channels]) / channels for i in range(0, len(samples), channels)]
    return samples, rate


def resample(samples, src_rate, dst_rate):
    if src_rate == dst_rate:
        return samples
    n = int(len(samples) * dst_rate / src_rate)
    step = src_rate / dst_rate
    out = []
    for i in range(n):
        pos = i * step
        j = int(pos)
        frac = pos - j
        nxt = samples[j + 1] if j + 1 < len(samples) else samples[j]
        out.append(samples[j] * (1 - frac) + nxt * frac)
    return out


def main():
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_IN
    start = float(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_START
    end = float(sys.argv[3]) if len(sys.argv) > 3 else DEFAULT_END
    if end - start > MAX_SECONDS:
        sys.exit(f'El recorte dura {end - start:.2f} s; máximo {MAX_SECONDS} s')
    if not src.exists():
        sys.exit(f'No existe {src}. Descárgalo de freesound (ver assets/sounds/CREDITS.md).')

    samples, rate = read_mono(src)
    clip = resample(samples[int(start * rate):int(end * rate)], rate, OUT_RATE)

    fade_in = OUT_RATE * FADE_IN_MS // 1000
    fade_out = OUT_RATE * FADE_OUT_MS // 1000
    n = len(clip)
    for i in range(n):
        clip[i] *= min(1.0, i / fade_in, (n - 1 - i) / fade_out)

    peak = max(abs(v) for v in clip) or 1.0
    gain = PEAK / peak
    data = array.array('h', (round(max(-1.0, min(1.0, v * gain)) * 32767) for v in clip))

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(OUT), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(OUT_RATE)
        w.writeframes(data.tobytes())
    print(f'{OUT.relative_to(ROOT)}: {n / OUT_RATE:.2f} s, mono {OUT_RATE} Hz 16 bit, ganancia x{gain:.2f}')


if __name__ == '__main__':
    main()
