import { useEffect } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { getAreas } from '@/db/client';
import { createHabit, listHabitsByArea } from '@/db/habits';
import { getLogsForDate, toggleHabitDone } from '@/db/logs';

const TODAY = new Date().toISOString().slice(0, 10);

export default function HoyScreen() {
  useEffect(() => {
    // Prueba temporal del paso 2: confirmar que las 6 áreas se sembraron.
    console.log('Áreas sembradas:', getAreas());
    // Prueba temporal del paso 3: ver los hábitos existentes en "espiritual".
    console.log('Hábitos en espiritual:', listHabitsByArea('espiritual'));
    // Prueba temporal del paso 4: ver los logs de hoy.
    console.log('Logs de hoy:', getLogsForDate(TODAY));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hoy</Text>
      <Button
        title="Crear hábito de prueba"
        onPress={() => {
          const habit = createHabit('espiritual', 'Meditar 10 min');
          console.log('Hábito creado:', habit);
        }}
      />
      <Button
        title="Marcar/desmarcar primer hábito de hoy"
        onPress={() => {
          const habits = listHabitsByArea('espiritual');
          if (habits.length === 0) {
            console.log('No hay hábitos en espiritual todavía.');
            return;
          }
          const done = toggleHabitDone(habits[0].id, TODAY);
          console.log(`Hábito ${habits[0].id} hecho hoy:`, done);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  title: { fontSize: 24, fontWeight: '600' },
});
