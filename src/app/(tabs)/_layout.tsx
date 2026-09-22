import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Hoy' }} />
      <Tabs.Screen name="areas" options={{ title: 'Áreas' }} />
      <Tabs.Screen name="progreso" options={{ title: 'Progreso' }} />
    </Tabs>
  );
}
