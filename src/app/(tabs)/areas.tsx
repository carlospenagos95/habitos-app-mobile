import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getAreas } from '@/db/client';

export default function AreasScreen() {
  const router = useRouter();
  const areas = getAreas(); // las 6 áreas son fijas, no cambian en tiempo de ejecución

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Áreas</Text>
      <FlatList
        data={areas}
        keyExtractor={(area) => area.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push({ pathname: '/area/[id]', params: { id: item.id } })}
          >
            <Text style={styles.rowText}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 16 },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 16 },
  row: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  rowText: { fontSize: 18 },
});
