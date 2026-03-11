import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LightDevice } from '../types';

type LightRowProps = {
  light: LightDevice;
  busy?: boolean;
  onToggle: (light: LightDevice, nextOn: boolean) => void;
  onBrightnessChange: (light: LightDevice, nextBrightness: number) => void;
};

export const LightRow = ({ light, busy, onToggle, onBrightnessChange }: LightRowProps) => {
  return (
    <View style={styles.row}>
      <View style={styles.infoBlock}>
        <Text style={styles.name}>{light.name}</Text>
        <Text style={styles.meta}>
          {light.provider.toUpperCase()} - {light.brightness}%
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.dimButton]}
          onPress={() => onBrightnessChange(light, Math.max(0, light.brightness - 10))}
          disabled={busy}
        >
          <Text style={styles.actionText}>-10</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.brightButton]}
          onPress={() => onBrightnessChange(light, Math.min(100, light.brightness + 10))}
          disabled={busy}
        >
          <Text style={styles.actionText}>+10</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleButton, light.isOn ? styles.onButton : styles.offButton]}
          onPress={() => onToggle(light, !light.isOn)}
          disabled={busy}
        >
          <Text style={styles.toggleText}>{light.isOn ? 'ON' : 'OFF'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    borderWidth: 1,
    borderColor: '#d9e0da',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: '#fdfefc',
  },
  infoBlock: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#132720',
  },
  meta: {
    fontSize: 12,
    color: '#50645d',
    marginTop: 3,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionButton: {
    minWidth: 54,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  dimButton: {
    backgroundColor: '#e7ece8',
  },
  brightButton: {
    backgroundColor: '#f5dfbd',
  },
  toggleButton: {
    minWidth: 56,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  onButton: {
    backgroundColor: '#1f8a70',
  },
  offButton: {
    backgroundColor: '#b74646',
  },
  actionText: {
    color: '#192e27',
    fontWeight: '700',
  },
  toggleText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
