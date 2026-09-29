import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts } from '@/theme';

type Props = {
  text: string;
  // Lado donde está el gato: la cola del globo apunta hacia allí.
  tail?: 'right' | 'left';
  style?: StyleProp<ViewStyle>;
};

export function SpeechBubble({ text, tail = 'right', style }: Props) {
  return (
    <View
      style={[styles.bubble, tail === 'right' ? styles.tailRight : styles.tailLeft, style]}
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
    >
      <Text style={styles.text}>{text}</Text>
      <View style={[styles.tail, tail === 'right' ? styles.tailPosRight : styles.tailPosLeft]} />
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: colors.skyInk,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  tailRight: { borderBottomRightRadius: 4 },
  tailLeft: { borderBottomLeftRadius: 4 },
  text: { fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 20, color: colors.text },
  // Colita: cuadrado girado que asoma por la esquina inferior.
  tail: {
    position: 'absolute',
    bottom: 6,
    width: 12,
    height: 12,
    backgroundColor: colors.surface,
    transform: [{ rotate: '45deg' }],
  },
  tailPosRight: { right: -5 },
  tailPosLeft: { left: -5 },
});
