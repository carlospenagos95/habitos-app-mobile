import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse } from 'react-native-svg';

type Props = {
  size?: number;
  color?: string;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
};

// Huella: almohadilla y cuatro deditos, en una caja de 24×24.
export function PawIcon({ size = 24, color = '#FFFFFF', opacity = 1, style }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size} fill={color} opacity={opacity} style={style}>
      <Ellipse cx={12} cy={16} rx={5} ry={4.2} />
      <Circle cx={6} cy={10} r={2.2} />
      <Circle cx={10} cy={6.5} r={2.2} />
      <Circle cx={14} cy={6.5} r={2.2} />
      <Circle cx={18} cy={10} r={2.2} />
    </Svg>
  );
}
