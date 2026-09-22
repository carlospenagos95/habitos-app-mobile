import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getAreas } from '@/db/client';
import { archiveHabit, createHabit, listHabitsByArea, renameHabit } from '@/db/habits';
import type { AreaId, Habit } from '@/types';

export default function AreaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const areaId = id as AreaId;
  const router = useRouter();
  const area = getAreas().find((a) => a.id === areaId);

  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reload = () => setHabits(listHabitsByArea(areaId));

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaId]);

  const handleCreate = () => {
    try {
      createHabit(areaId, newHabitName);
      setNewHabitName('');
      setError(null);
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al crear el hábito.');
    }
  };

  const startEditing = (habit: Habit) => {
    setEditingId(habit.id);
    setEditingName(habit.name);
    setError(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  const confirmRename = () => {
    if (editingId == null) return;
    try {
      renameHabit(editingId, editingName);
      setEditingId(null);
      setEditingName('');
      setError(null);
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al renombrar el hábito.');
    }
  };

  const handleArchive = (habitId: number) => {
    archiveHabit(habitId);
    reload();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>‹ Áreas</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{area?.name ?? ''}</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Nombre del nuevo hábito"
          value={newHabitName}
          onChangeText={setNewHabitName}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleCreate}>
          <Text style={styles.addButtonText}>Agregar</Text>
        </TouchableOpacity>
      </View>
      {error != null && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={habits}
        keyExtractor={(habit) => String(habit.id)}
        ListEmptyComponent={<Text style={styles.empty}>Sin hábitos todavía.</Text>}
        renderItem={({ item }) =>
          editingId === item.id ? (
            <View style={styles.habitRow}>
              <TextInput
                style={[styles.input, styles.editInput]}
                value={editingName}
                onChangeText={setEditingName}
                autoFocus
              />
              <TouchableOpacity onPress={confirmRename}>
                <Text style={styles.action}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={cancelEditing}>
                <Text style={styles.action}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.habitRow}>
              <Text style={styles.habitName}>{item.name}</Text>
              <TouchableOpacity onPress={() => startEditing(item)}>
                <Text style={styles.action}>Renombrar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleArchive(item.id)}>
                <Text style={styles.action}>Archivar</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 16 },
  back: { fontSize: 16, color: '#208AEF', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 16 },
  form: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  input: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#999',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  addButton: {
    backgroundColor: '#208AEF',
    borderRadius: 6,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  addButtonText: { color: '#fff', fontWeight: '600' },
  error: { color: '#c00', marginBottom: 8 },
  empty: { color: '#666', marginTop: 16 },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  habitName: { flex: 1, fontSize: 16 },
  editInput: { paddingVertical: 4 },
  action: { color: '#208AEF', fontWeight: '600' },
});
