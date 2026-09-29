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

// ---------- Pose: sentado (de frente) ----------

const SENTADO_BODY =
  'M64 96 C52 122 44 158 52 184 C58 198 76 202 100 202 C124 202 142 198 148 184 C156 158 148 122 136 96 Z';

function Sentado({ ids, eyes }: { ids: CatIds; eyes: CatEyes }) {
  return (
    <G>
      <CatDefs ids={ids} bodyPath={SENTADO_BODY} />
      <Shadow ids={ids} cx={104} cy={203} rx={62} />
      <G transform="translate(140 190)">
        <Tail ids={ids} />
      </G>
      <Path d={SENTADO_BODY} fill={`url(#${ids.cream})`} />
      <G clipPath={`url(#${ids.bodyClip})`}>
        <Path d="M36 118 C60 116 70 140 64 170 C60 186 50 196 40 206 Z" fill={`url(#${ids.gray})`} />
        <Path d="M164 128 C142 134 128 160 136 206 L164 206 Z" fill={`url(#${ids.orange})`} />
        <Ellipse cx={100} cy={138} rx={20} ry={28} fill={c.creamLight} opacity={0.85} />
        <Path d="M60 158 C72 164 77 182 73 200 M140 158 C128 164 123 182 127 200" fill="none" stroke={c.outline} strokeWidth={1} opacity={0.3} />
        <Path d="M86 150 C84 170 82 184 83 196 M114 150 C116 170 118 184 117 196" fill="none" stroke={c.outline} strokeWidth={1} opacity={0.35} />
      </G>
      <Path d={SENTADO_BODY} fill="none" stroke={c.outline} strokeWidth={OUTLINE_WIDTH} />
      <FrontPaw ids={ids} cx={90} cy={197} />
      <FrontPaw ids={ids} cx={110} cy={197} />
      <Collar x1={70} x2={130} y={102} />
      <Head ids={ids} x={100} y={66} eyes={eyes} />
    </G>
  );
}

const POSES: Record<CatPose, { viewBox: [number, number]; Component: typeof Sentado }> = {
  sentado: { viewBox: [200, 212], Component: Sentado },
  // Las demás poses llegan en el paso 6; mientras tanto se muestra el gato sentado.
  asomado: { viewBox: [200, 212], Component: Sentado },
  trofeo: { viewBox: [200, 212], Component: Sentado },
  estirado: { viewBox: [200, 212], Component: Sentado },
};

export function Cat({ pose, mood = 'idle', size, onPress, style }: Props) {
  const ids = useCatIds();
  const { viewBox, Component } = POSES[pose];
  const [w, h] = viewBox;
  const svg = (
    <Svg width={size} height={(size * h) / w} viewBox={`0 0 ${w} ${h}`}>
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
