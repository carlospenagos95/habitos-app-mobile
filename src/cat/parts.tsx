import { useId } from 'react';
import {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

import { catPalette as c, OUTLINE_WIDTH } from './palette';
import type { CatEyes } from './types';

// Piezas del gato. La cabeza y la cola se dibujan en coordenadas locales
// (cabeza centrada en 0,0; cola con la base en 0,0) para que cada pose las
// coloque con un transform y las animaciones giren sobre su propio eje.

export type CatIds = {
  cream: string;
  orange: string;
  gray: string;
  eye: string;
  shadow: string;
  gold: string;
  headClip: string;
  bodyClip: string;
};

// ids únicos por instancia: evita choques de degradados si hay más de un gato.
export function useCatIds(): CatIds {
  const base = `cat${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return {
    cream: `${base}cream`,
    orange: `${base}orange`,
    gray: `${base}gray`,
    eye: `${base}eye`,
    shadow: `${base}shadow`,
    gold: `${base}gold`,
    headClip: `${base}headClip`,
    bodyClip: `${base}bodyClip`,
  };
}

const url = (id: string) => `url(#${id})`;

type FurProps = { id: string; light: string; base: string; shade: string };

function FurGradient({ id, light, base, shade }: FurProps) {
  return (
    <RadialGradient id={id} cx="45%" cy="38%" rx="65%" ry="65%" fx="42%" fy="32%">
      <Stop offset="0" stopColor={light} />
      <Stop offset="0.6" stopColor={base} />
      <Stop offset="1" stopColor={shade} />
    </RadialGradient>
  );
}

// Degradados compartidos y recorte de la cabeza. `bodyPath` es el recorte del cuerpo de la pose.
export function CatDefs({ ids, bodyPath }: { ids: CatIds; bodyPath?: string }) {
  return (
    <Defs>
      <FurGradient id={ids.cream} light={c.creamLight} base={c.cream} shade={c.creamShade} />
      <FurGradient id={ids.orange} light={c.orangeLight} base={c.orange} shade={c.orangeShade} />
      <FurGradient id={ids.gray} light={c.grayLight} base={c.gray} shade={c.grayShade} />
      <RadialGradient id={ids.eye} cx="50%" cy="62%" rx="55%" ry="55%">
        <Stop offset="0" stopColor={c.eyeLight} />
        <Stop offset="0.55" stopColor={c.eye} />
        <Stop offset="1" stopColor={c.eyeShade} />
      </RadialGradient>
      <RadialGradient id={ids.shadow} cx="50%" cy="50%" rx="50%" ry="50%">
        <Stop offset="0" stopColor={c.outline} stopOpacity={0.24} />
        <Stop offset="1" stopColor={c.outline} stopOpacity={0} />
      </RadialGradient>
      <LinearGradient id={ids.gold} x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor={c.goldLight} />
        <Stop offset="0.5" stopColor={c.tag} />
        <Stop offset="1" stopColor={c.goldShade} />
      </LinearGradient>
      <ClipPath id={ids.headClip}>
        <Path d={HEAD_PATH} />
      </ClipPath>
      {bodyPath && (
        <ClipPath id={ids.bodyClip}>
          <Path d={bodyPath} />
        </ClipPath>
      )}
    </Defs>
  );
}

// ---------- Cabeza (local, centrada en 0,0; ancho ~96) ----------

export const HEAD_PATH =
  'M0 -38 C26 -38 44 -26 47 -6 C50 12 44 28 28 35 C17 40 -17 40 -28 35 C-44 28 -50 12 -47 -6 C-44 -26 -26 -38 0 -38 Z';

const EAR_PATH = 'M-47 -6 C-51 -28 -48 -46 -41 -56 C-37 -60 -32 -60 -28 -56 C-20 -49 -12 -42 -5 -35 Z';
const EAR_INNER_PATH = 'M-40 -17 C-43 -31 -41 -43 -36 -50 C-30 -45 -23 -39 -17 -33 Z';

// Pivote de la oreja (centro de la base) para el giro de la animación.
export const EAR_PIVOT = { x: -26, y: -22 };

export function Ear({ ids, fur }: { ids: CatIds; fur: 'gray' | 'orange' }) {
  return (
    <G>
      <Path d={EAR_PATH} fill={url(ids[fur])} stroke={c.outline} strokeWidth={OUTLINE_WIDTH} strokeLinejoin="round" />
      <Path d={EAR_INNER_PATH} fill={c.earInner} opacity={0.9} />
    </G>
  );
}

const EYE_X = 17;
const EYE_Y = 2;

function Eye({ ids, kind }: { ids: CatIds; kind: CatEyes }) {
  if (kind === 'cerrados') {
    return <Path d="M-8.5 0 Q0 5.5 8.5 0" fill="none" stroke={c.outline} strokeWidth={1.8} strokeLinecap="round" />;
  }
  if (kind === 'felices') {
    return <Path d="M-8 3 Q0 -7 8 3" fill="none" stroke={c.outline} strokeWidth={2} strokeLinecap="round" />;
  }
  return (
    <G>
      <Ellipse rx={8.5} ry={9.5} fill={url(ids.eye)} stroke={c.outline} strokeWidth={1} />
      <Ellipse rx={3.2} ry={7} fill={c.outline} />
      <Circle cx={2.8} cy={-3.6} r={2.4} fill={c.shine} />
      <Circle cx={-2.6} cy={3.8} r={1.1} fill={c.shine} opacity={0.8} />
    </G>
  );
}

// Ojos: grupo propio para que el parpadeo lo escale en vertical.
export function Eyes({ ids, kind }: { ids: CatIds; kind: CatEyes }) {
  return (
    <G>
      <G transform={`translate(${-EYE_X} ${EYE_Y})`}>
        <Eye ids={ids} kind={kind} />
      </G>
      <G transform={`translate(${EYE_X} ${EYE_Y})`}>
        <Eye ids={ids} kind={kind} />
      </G>
    </G>
  );
}

export const EYES_CENTER_Y = EYE_Y;

function Whiskers() {
  const d =
    'M-22 14 C-34 11 -46 10 -58 11 M-22 18 C-34 18 -46 20 -57 24 ' +
    'M22 14 C34 11 46 10 58 11 M22 18 C34 18 46 20 57 24';
  return <Path d={d} fill="none" stroke={c.outline} strokeWidth={0.9} strokeLinecap="round" opacity={0.55} />;
}

// Cabeza sin orejas ni ojos: pelaje, manchas, hocico, nariz, boca, mejillas y bigotes.
export function Face({ ids }: { ids: CatIds }) {
  return (
    <G>
      <Path d={HEAD_PATH} fill={url(ids.cream)} />
      <G clipPath={url(ids.headClip)}>
        {/* Mancha gris sobre el ojo izquierdo, mancha naranja arriba a la derecha. */}
        <Path
          d="M-60 -50 L-4 -50 C-2 -36 -6 -24 -12 -16 C-18 -8 -30 8 -34 22 C-40 30 -60 30 -60 30 Z"
          fill={url(ids.gray)}
        />
        <Path d="M8 -50 L60 -50 L60 0 C48 -2 36 -8 28 -16 C20 -24 12 -34 8 -50 Z" fill={url(ids.orange)} />
        <Path
          d="M22 -32 Q26 -27 32 -25 M28 -36 Q32 -31 38 -30 M-30 -30 Q-26 -25 -20 -24"
          fill="none"
          stroke={c.outline}
          strokeWidth={1}
          strokeLinecap="round"
          opacity={0.18}
        />
        <Ellipse cy={17} rx={15} ry={10} fill={c.creamLight} opacity={0.9} />
      </G>
      <Path d={HEAD_PATH} fill="none" stroke={c.outline} strokeWidth={OUTLINE_WIDTH} />
      <Ellipse cx={-30} cy={15} rx={6.5} ry={3.8} fill={c.cheek} opacity={0.55} />
      <Ellipse cx={30} cy={15} rx={6.5} ry={3.8} fill={c.cheek} opacity={0.55} />
      <Path
        d="M-4.5 11 C-2 9.5 2 9.5 4.5 11 C3.5 14 1.5 16 0 16 C-1.5 16 -3.5 14 -4.5 11 Z"
        fill={c.nose}
        stroke={c.outline}
        strokeWidth={0.8}
        strokeLinejoin="round"
      />
      <Path
        d="M0 16 L0 19 C-2 23 -7 23 -8.5 20 M0 19 C2 23 7 23 8.5 20"
        fill="none"
        stroke={c.outline}
        strokeWidth={OUTLINE_WIDTH}
        strokeLinecap="round"
      />
      <Whiskers />
    </G>
  );
}

// ---------- Cola (local, base en 0,0; se curva hacia la derecha y arriba) ----------

const TAIL_PATH = 'M0 0 C22 2 40 -8 40 -30 C40 -42 33 -49 26 -46';
const TAIL_TIP_PATH = 'M40 -34 C39 -43 33 -49 26 -46';

export function Tail({ ids }: { ids: CatIds }) {
  return (
    <G>
      <Path d={TAIL_PATH} fill="none" stroke={c.outline} strokeWidth={11 + OUTLINE_WIDTH * 2} strokeLinecap="round" />
      <Path d={TAIL_PATH} fill="none" stroke={url(ids.orange)} strokeWidth={11} strokeLinecap="round" />
      <Path d={TAIL_TIP_PATH} fill="none" stroke={c.gray} strokeWidth={11} strokeLinecap="round" />
      <Path d="M6 -2 C22 -1 34 -9 36 -26" fill="none" stroke={c.orangeLight} strokeWidth={3} strokeLinecap="round" opacity={0.6} />
    </G>
  );
}

// ---------- Piezas del cuerpo ----------

export function Shadow({ ids, cx, cy, rx }: { ids: CatIds; cx: number; cy: number; rx: number }) {
  return <Ellipse cx={cx} cy={cy} rx={rx} ry={rx * 0.11} fill={url(ids.shadow)} />;
}

// Collar morado con placa, curvado entre dos puntos.
export function Collar({ x1, x2, y, sag = 10 }: { x1: number; x2: number; y: number; sag?: number }) {
  const mid = (x1 + x2) / 2;
  return (
    <G>
      <Path
        d={`M${x1} ${y} C${x1 + 16} ${y + sag} ${x2 - 16} ${y + sag} ${x2} ${y}`}
        fill="none"
        stroke={c.collar}
        strokeWidth={5}
        strokeLinecap="round"
      />
      <Circle cx={mid} cy={y + sag * 0.75 + 4} r={4.2} fill={c.tag} stroke={c.outline} strokeWidth={0.8} />
    </G>
  );
}

// Patita delantera vista de frente, centrada en (cx, cy).
export function FrontPaw({ ids, cx, cy }: { ids: CatIds; cx: number; cy: number }) {
  return (
    <G>
      <Ellipse cx={cx} cy={cy} rx={11} ry={6.5} fill={url(ids.cream)} stroke={c.outline} strokeWidth={OUTLINE_WIDTH} />
      <Path
        d={`M${cx - 3.5} ${cy - 2} v5 M${cx + 3.5} ${cy - 2} v5`}
        stroke={c.outline}
        strokeWidth={0.8}
        strokeLinecap="round"
        opacity={0.45}
      />
    </G>
  );
}
