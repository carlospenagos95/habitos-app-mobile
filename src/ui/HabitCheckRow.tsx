import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing } from '@/theme';
import { PawIcon } from './PawIcon';

const CHECK = 30;

type Props = {
  name: string;
  done: boolean;
  // Color del área: relleno del check hecho y borde punteado del pendiente.
  color: string;
  onPress: () => void;
  // Acción extra a la derecha (p. ej. empezar rutina).
  right?: ReactNode;
};

// Fila de hábito: check de huella cuando está hecho, círculo punteado cuando no.
export function HabitCheckRow({ name, done, color, onPress, right }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={name}
    >
      {done ? (
        <View style={[styles.check, { backgroundColor: color }]}>
          <PawIcon size={18} color={colors.surface} />
        </View>
      ) : (
        <View style={[styles.check, styles.pending, { borderColor: `${color}80` }]} />
      )}
      <Text style={[styles.name, done && styles.nameDone]}>{name}</Text>
      {right}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 52,
    paddingVertical: spacing.sm,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderRadius: 16,
  },
  pressed: { opacity: 0.7 },
  check: {
    width: CHECK,
    height: CHECK,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pending: { borderWidth: 2.5, borderStyle: 'dashed' },
  name: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text },
  nameDone: { color: colors.textDone, textDecorationLine: 'line-through' },
});
