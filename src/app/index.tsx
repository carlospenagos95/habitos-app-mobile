import { useEffect } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { getAreas } from '../db/client';
import { createHabit, listHabitsByArea } from '../db/habits';

export default function HomeScreen() {
  useEffect(() => {
    // Prueba temporal del paso 2: confirmar que las 6 áreas se sembraron.
    console.log('Áreas sembradas:', getAreas());
    // Prueba temporal del paso 3: ver los hábitos existentes en "espiritual".
    console.log('Hábitos en espiritual:', listHabitsByArea('espiritual'));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buenos Hábitos</Text>
      <Button
        title="Crear hábito de prueba"
        onPress={() => {
          const habit = createHabit('espiritual', 'Meditar 10 min');
          console.log('Hábito creado:', habit);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '600' },
});
