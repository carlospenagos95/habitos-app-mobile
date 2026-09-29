import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Ellipse, G, Path } from 'react-native-svg';

import { catPalette as c, OUTLINE_WIDTH } from './palette';
import {
  CatDefs,
  Collar,
  Ear,
  Eyes,
  Face,
  FrontPaw,
  Shadow,
  Tail,
  useCatIds,
  type CatIds,
} from './parts';
import type { CatEyes, CatMood, CatPose } from './types';

type Props = {
  pose: CatPose;
  mood?: CatMood;
  // Ancho en px; el alto sale de la proporción de la pose.
  size: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

const EYES_BY_MOOD: Record<CatMood, CatEyes> = {
  idle: 'abiertos',
  feliz: 'felices',
  celebra: 'felices',
  mimado: 'cerrados',
};

// Cabeza completa colocada en (x, y) de la pose.
function Head({ ids, x, y, eyes }: { ids: CatIds; x: number; y: number; eyes: CatEyes }) {
  return (
    <G transform={`translate(${x} ${y})`}>
      <Ear ids={ids} fur="gray" />
      <G transform="scale(-1 1)">
        <Ear ids={ids} fur="orange" />
      </G>
      <Face ids={ids} />
      <Eyes ids={ids} kind={eyes} />
    </G>
  );
}

const fill = (id: string) => `url(#${id})`;

// Cuerpo sentado de frente, compartido por `sentado` y `trofeo`.
const SENTADO_BODY =
  'M64 96 C52 122 44 158 52 184 C58 198 76 202 100 202 C124 202 142 198 148 184 C156 158 148 122 136 96 Z';

function SeatedBody({ ids, legs }: { ids: CatIds; legs: boolean }) {
  return (
    <G>
      <Shadow ids={ids} cx={104} cy={203} rx={62} />
      <G transform="translate(140 190)">
        <Tail ids={ids} />
      </G>
      <Path d={SENTADO_BODY} fill={fill(ids.cream)} />
      <G clipPath={fill(ids.bodyClip)}>
        <Path d="M36 118 C60 116 70 140 64 170 C60 186 50 196 40 206 Z" fill={fill(ids.gray)} />
        <Path d="M164 128 C142 134 128 160 136 206 L164 206 Z" fill={fill(ids.orange)} />
        <Ellipse cx={100} cy={138} rx={20} ry={28} fill={c.creamLight} opacity={0.85} />
        <Path d="M60 158 C72 164 77 182 73 200 M140 158 C128 164 123 182 127 200" fill="none" stroke={c.outline} strokeWidth={1} opacity={0.3} />
        {legs && (
          <Path d="M86 150 C84 170 82 184 83 196 M114 150 C116 170 118 184 117 196" fill="none" stroke={c.outline} strokeWidth={1} opacity={0.35} />
        )}
      </G>
      <Path d={SENTADO_BODY} fill="none" stroke={c.outline} strokeWidth={OUTLINE_WIDTH} />
      <FrontPaw ids={ids} cx={90} cy={197} />
      <FrontPaw ids={ids} cx={110} cy={197} />
      <Collar x1={70} x2={130} y={102} />
    </G>
  );
}

type PoseProps = { ids: CatIds; eyes: CatEyes };

// ---------- sentado: de frente (Hoy) ----------

function Sentado({ ids, eyes }: PoseProps) {
  return (
    <G>
      <CatDefs ids={ids} bodyPath={SENTADO_BODY} />
      <SeatedBody ids={ids} legs />
      <Head ids={ids} x={100} y={66} eyes={eyes} />
    </G>
  );
}

// ---------- trofeo: sentado sosteniendo una copa (Progreso) ----------

function Trophy({ ids }: { ids: CatIds }) {
  const stroke = { stroke: c.outline, strokeWidth: OUTLINE_WIDTH, strokeLinejoin: 'round' as const };
  return (
    <G>
      <Path d="M82 130 C70 130 68 146 84 148 M118 130 C130 130 132 146 116 148" fill="none" stroke={c.goldShade} strokeWidth={4} strokeLinecap="round" />
      <Path d="M82 124 L118 124 C118 144 111 155 100 157 C89 155 82 144 82 124 Z" fill={fill(ids.gold)} {...stroke} />
      <Path d="M100 131 L102.6 136.4 L108.5 137.2 L104.2 141.3 L105.3 147.2 L100 144.4 L94.7 147.2 L95.8 141.3 L91.5 137.2 L97.4 136.4 Z" fill={c.goldLight} />
      <Path d="M96 157 L104 157 L105 166 L95 166 Z" fill={fill(ids.gold)} {...stroke} />
      <Path d="M86 166 L114 166 Q116 166 116 168 L116 174 L84 174 L84 168 Q84 166 86 166 Z" fill={fill(ids.gold)} {...stroke} />
      <Path d="M87 126 C87 138 90 146 95 150" fill="none" stroke={c.shine} strokeWidth={2} strokeLinecap="round" opacity={0.6} />
    </G>
  );
}

function TrofeoPose({ ids, eyes }: PoseProps) {
  return (
    <G>
      <CatDefs ids={ids} bodyPath={SENTADO_BODY} />
      <SeatedBody ids={ids} legs={false} />
      <Trophy ids={ids} />
      {/* Patitas delanteras abrazando la copa. */}
      <Ellipse cx={80} cy={143} rx={9} ry={7} fill={fill(ids.cream)} stroke={c.outline} strokeWidth={OUTLINE_WIDTH} />
      <Ellipse cx={120} cy={143} rx={9} ry={7} fill={fill(ids.cream)} stroke={c.outline} strokeWidth={OUTLINE_WIDTH} />
      <Head ids={ids} x={100} y={66} eyes={eyes} />
    </G>
  );
}

// ---------- asomado: cabeza y patitas sobre un borde (Áreas) ----------

const ASOMADO_BODY = 'M56 134 C58 110 76 96 100 96 C124 96 142 110 144 134 Z';

function Asomado({ ids, eyes }: PoseProps) {
  return (
    <G>
      <CatDefs ids={ids} bodyPath={ASOMADO_BODY} />
      <G transform="translate(138 128) scale(0.8)">
        <Tail ids={ids} />
      </G>
      <Path d={ASOMADO_BODY} fill={fill(ids.cream)} />
      <G clipPath={fill(ids.bodyClip)}>
        <Path d="M40 100 C66 100 72 118 70 136 L40 136 Z" fill={fill(ids.gray)} />
        <Path d="M160 104 C134 106 128 120 130 136 L160 136 Z" fill={fill(ids.orange)} />
      </G>
      <Path d={ASOMADO_BODY} fill="none" stroke={c.outline} strokeWidth={OUTLINE_WIDTH} />
      <Collar x1={74} x2={126} y={102} sag={8} />
      <Head ids={ids} x={100} y={64} eyes={eyes} />
      {/* Patitas apoyadas en el borde. */}
      <Ellipse cx={76} cy={124} rx={13} ry={8} fill={fill(ids.cream)} stroke={c.outline} strokeWidth={OUTLINE_WIDTH} />
      <Ellipse cx={124} cy={124} rx={13} ry={8} fill={fill(ids.cream)} stroke={c.outline} strokeWidth={OUTLINE_WIDTH} />
      <Path d="M72 124 v5 M80 124 v5 M120 124 v5 M128 124 v5" stroke={c.outline} strokeWidth={0.8} strokeLinecap="round" opacity={0.45} />
    </G>
  );
}

// ---------- estirado: en cuadrupedia con el lomo arqueado (Ejercicio) ----------

const ESTIRADO_BODY =
  'M66 120 C62 70 100 22 140 22 C182 22 214 64 208 118 C202 128 188 128 184 118 C170 84 110 84 94 118 C88 128 70 130 66 120 Z';

// Pata vista de lado, afinada hacia abajo, con la patita en el suelo (y = 150).
function Leg({ ids, x, top, width = 14 }: { ids: CatIds; x: number; top: number; width?: number }) {
  const w = width / 2;
  return (
    <G>
      <Path
        d={`M${x - w} ${top} C${x - w} 128 ${x - w + 1.5} 138 ${x - w + 1.5} 148 L${x + w - 1.5} 148 C${x + w - 1.5} 138 ${x + w} 128 ${x + w} ${top} Z`}
        fill={fill(ids.cream)}
        stroke={c.outline}
        strokeWidth={OUTLINE_WIDTH}
      />
      <Ellipse cx={x + 1.5} cy={149} rx={w + 2.5} ry={4.5} fill={fill(ids.cream)} stroke={c.outline} strokeWidth={OUTLINE_WIDTH} />
    </G>
  );
}

function Estirado({ ids, eyes }: PoseProps) {
  return (
    <G>
      <CatDefs ids={ids} bodyPath={ESTIRADO_BODY} />
      <Shadow ids={ids} cx={136} cy={152} rx={92} />
      <G transform="translate(204 98) scale(0.9)">
        <Tail ids={ids} />
      </G>
      {/* Patas del lado de atrás, un poco translúcidas para dar profundidad. */}
      <G opacity={0.85}>
        <Leg ids={ids} x={90} top={110} />
        <Leg ids={ids} x={188} top={110} width={16} />
      </G>
      <Path d={ESTIRADO_BODY} fill={fill(ids.cream)} />
      <G clipPath={fill(ids.bodyClip)}>
        <Path d="M108 10 C118 46 166 48 178 12 Z" fill={fill(ids.gray)} />
        <Path d="M172 28 C164 70 180 104 216 114 L216 20 Z" fill={fill(ids.orange)} />
        <Path d="M174 78 C192 82 204 98 198 120" fill="none" stroke={c.outline} strokeWidth={1} opacity={0.3} />
      </G>
      <Path d={ESTIRADO_BODY} fill="none" stroke={c.outline} strokeWidth={OUTLINE_WIDTH} />
      <Leg ids={ids} x={78} top={112} />
      <Leg ids={ids} x={198} top={112} width={16} />
      <Collar x1={40} x2={84} y={122} sag={7} />
      <G transform="translate(62 94) scale(0.9)">
        <Head ids={ids} x={0} y={0} eyes={eyes} />
      </G>
    </G>
  );
}

// viewBox de cada pose: [minX, minY, ancho, alto].
const POSES: Record<CatPose, { viewBox: [number, number, number, number]; Component: (p: PoseProps) => React.JSX.Element }> = {
  sentado: { viewBox: [0, 0, 200, 212], Component: Sentado },
  asomado: { viewBox: [0, 0, 200, 134], Component: Asomado },
  trofeo: { viewBox: [0, 0, 200, 212], Component: TrofeoPose },
  estirado: { viewBox: [0, 12, 262, 146], Component: Estirado },
};

export function Cat({ pose, mood = 'idle', size, onPress, style }: Props) {
  const ids = useCatIds();
  const { viewBox, Component } = POSES[pose];
  const [x, y, w, h] = viewBox;
  const svg = (
    <Svg width={size} height={(size * h) / w} viewBox={`${x} ${y} ${w} ${h}`}>
      <Component ids={ids} eyes={EYES_BY_MOOD[mood]} />
    </Svg>
  );
  if (!onPress) return <View style={style}>{svg}</View>;
  return (
    <Pressable
      onPress={onPress}
      style={style}
      accessibilityRole="button"
      accessibilityLabel="Michi, tócalo para mimarlo"
    >
      {svg}
    </Pressable>
  );
}
