import { Tabs } from 'expo-router';
import { colors, fonts } from '@/theme';
import { TabBarIcon } from '@/ui/TabBarIcon';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontFamily: fonts.bodyBold, fontSize: 12 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hoy',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="calendar-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="areas"
        options={{
          title: 'Áreas',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="grid-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="progreso"
        options={{
          title: 'Progreso',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="stats-chart-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="ejercicio"
        options={{
          title: 'Ejercicio',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="barbell-outline" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
