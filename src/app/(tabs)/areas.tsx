import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getAreas } from '@/db/client';
import { AREA_STYLE, colors, fontSize, radius, spacing } from '@/theme';

export default function AreasScreen() {
  const router = useRouter();
  const areas = getAreas(); // las 6 áreas son fijas, no cambian en tiempo de ejecución

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Áreas</Text>
      <FlatList
        data={areas}
        keyExtractor={(area) => area.id}
        renderItem={({ item }) => {
          const { icon, color } = AREA_STYLE[item.id];
          return (
            <TouchableOpacity
              style={[styles.card, { borderLeftColor: color }]}
              onPress={() => router.push({ pathname: '/area/[id]', params: { id: item.id } })}
            >
              <Ionicons name={icon} size={24} color={color} />
              <Text style={styles.cardText}>{item.name}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
  },
  title: { fontSize: fontSize.xl, fontWeight: '600', color: colors.text, marginBottom: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderLeftWidth: 4,
  },
  cardText: { flex: 1, fontSize: fontSize.lg, color: colors.text },
});
