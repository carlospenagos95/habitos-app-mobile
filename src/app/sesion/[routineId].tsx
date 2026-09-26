import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize } from '@/theme';

// Marcador temporal: la sesión guiada se implementa en el paso 4 de SPEC 03.
export default function SesionScreen() {
  const { routineId } = useLocalSearchParams<{ routineId: string }>();
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Sesión {routineId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  text: { fontSize: fontSize.lg, color: colors.text },
});
