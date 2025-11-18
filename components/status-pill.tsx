import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type StatusTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

const tonePalette: Record<StatusTone, { bg: string; border: string; text: string }> = {
  success: { bg: '#E8F5E9', border: '#C8E6C9', text: '#2E7D32' },
  warning: { bg: '#FFF4E5', border: '#FFE0B2', text: '#ED6C02' },
  danger: { bg: '#FDECEA', border: '#FFCDD2', text: '#C62828' },
  info: { bg: '#E3F2FD', border: '#BBDEFB', text: '#1565C0' },
  neutral: { bg: '#F5F5F5', border: '#E0E0E0', text: '#424242' },
};

interface StatusPillProps {
  label: string;
  tone?: StatusTone;
}

export function StatusPill({ label, tone = 'info' }: StatusPillProps) {
  const palette = tonePalette[tone] ?? tonePalette.info;

  return (
    <View style={[styles.pill, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <Text style={[styles.pillText, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});

