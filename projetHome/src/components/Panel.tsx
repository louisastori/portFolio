import { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type PanelProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
}>;

export const Panel = ({ title, subtitle, children }: PanelProps) => (
  <View style={styles.panel}>
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
    {children}
  </View>
);

const styles = StyleSheet.create({
  panel: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d8dfd2',
    padding: 16,
    shadowColor: '#122820',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 2,
  },
  header: {
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10211d',
  },
  subtitle: {
    fontSize: 13,
    color: '#486057',
    marginTop: 4,
  },
});
