import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, type ColorValue } from 'react-native';

import { colors, radius, type IoniconName } from '@/theme';

type Props = {
  name: IoniconName;
  color: ColorValue;
  focused: boolean;
  size?: number;
};

// Ícono de pestaña; la activa va dentro de una píldora morada suave.
export function TabBarIcon({ name, color, focused, size = 24 }: Props) {
  return (
    <View style={[styles.pill, focused && styles.pillActive]}>
      <Ionicons name={name} size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: 16, paddingVertical: 4, borderRadius: radius.pill },
  pillActive: { backgroundColor: colors.accentSoft },
});
