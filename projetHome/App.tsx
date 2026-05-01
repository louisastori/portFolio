import { StatusBar } from 'expo-status-bar';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { LightRow } from './src/components/LightRow';
import { Panel } from './src/components/Panel';
import { env } from './src/config/env';
import { fetchFitnessSnapshot } from './src/services/fitnessService';
import { fetchLightsSnapshot, setLightBrightness, toggleLightPower } from './src/services/lightsService';
import { fetchNutritionSnapshot } from './src/services/nutritionService';
import { AppWarning, FitnessSnapshot, LightDevice, NutritionSnapshot } from './src/types';

const formatNumber = (value: number): string => {
  if (!Number.isFinite(value)) {
    return '-';
  }
  return Number.isInteger(value)
    ? value.toLocaleString('fr-FR')
    : value.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
};

const warningWithScope = (scope: AppWarning['scope'], message: string): AppWarning => ({ scope, message });
const OPTIONAL_WARNING_SCOPES = new Set<AppWarning['scope']>(['fitness', 'nutrition']);

const pushWarning = (list: AppWarning[], scope: AppWarning['scope'], message: string) => {
  if (OPTIONAL_WARNING_SCOPES.has(scope)) {
    return;
  }

  list.push(warningWithScope(scope, message));
};

export default function App() {
  const { width } = useWindowDimensions();

  const [fitness, setFitness] = useState<FitnessSnapshot | null>(null);
  const [nutrition, setNutrition] = useState<NutritionSnapshot | null>(null);
  const [lights, setLights] = useState<LightDevice[]>([]);
  const [warnings, setWarnings] = useState<AppWarning[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyLightIds, setBusyLightIds] = useState<string[]>([]);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  const twoColumns = width >= 980;

  const setLightBusy = (id: string, busy: boolean) => {
    setBusyLightIds((prev) => {
      if (busy) {
        return prev.includes(id) ? prev : [...prev, id];
      }
      return prev.filter((item) => item !== id);
    });
  };

  const loadDashboard = useCallback(async (forceLive = false) => {
    setLoading(true);

    const nextWarnings: AppWarning[] = [];

    const [fitnessResult, nutritionResult, lightsResult] = await Promise.allSettled([
      fetchFitnessSnapshot(forceLive),
      fetchNutritionSnapshot(),
      fetchLightsSnapshot(),
    ]);

    if (fitnessResult.status === 'fulfilled') {
      setFitness(fitnessResult.value);
    } else {
      pushWarning(nextWarnings, 'fitness', fitnessResult.reason?.message ?? 'Fitness API unavailable.');
    }

    if (nutritionResult.status === 'fulfilled') {
      setNutrition(nutritionResult.value);
    } else {
      pushWarning(nextWarnings, 'nutrition', nutritionResult.reason?.message ?? 'Nutrition API unavailable.');
    }

    if (lightsResult.status === 'fulfilled') {
      setLights(lightsResult.value.lights);
      lightsResult.value.warnings.forEach((message) => pushWarning(nextWarnings, 'lights', message));
    } else {
      pushWarning(nextWarnings, 'lights', lightsResult.reason?.message ?? 'Lights API unavailable.');
    }

    setWarnings(nextWarnings);
    setLastRefresh(new Date().toISOString());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDashboard(true);

    const interval = setInterval(() => {
      loadDashboard(false);
    }, env.app.refreshIntervalMs);

    return () => clearInterval(interval);
  }, [loadDashboard]);

  const handleToggleLight = useCallback(async (light: LightDevice, nextOn: boolean) => {
    const previousLights = lights;

    setLightBusy(light.id, true);
    setLights((prev) => prev.map((item) => (item.id === light.id ? { ...item, isOn: nextOn } : item)));

    try {
      await toggleLightPower(light, nextOn);
    } catch (error) {
      setLights(previousLights);
      setWarnings((prev) => [
        ...prev,
        warningWithScope('lights', `Failed to toggle ${light.name}: ${(error as Error).message}`),
      ]);
    } finally {
      setLightBusy(light.id, false);
    }
  }, [lights]);

  const handleBrightness = useCallback(async (light: LightDevice, nextBrightness: number) => {
    const previousLights = lights;

    setLightBusy(light.id, true);
    setLights((prev) =>
      prev.map((item) =>
        item.id === light.id
          ? {
              ...item,
              brightness: nextBrightness,
              isOn: nextBrightness > 0,
            }
          : item
      )
    );

    try {
      await setLightBrightness(light, nextBrightness);
    } catch (error) {
      setLights(previousLights);
      setWarnings((prev) => [
        ...prev,
        warningWithScope('lights', `Failed to set brightness for ${light.name}: ${(error as Error).message}`),
      ]);
    } finally {
      setLightBusy(light.id, false);
    }
  }, [lights]);

  const groupedLights = useMemo(() => {
    return {
      hue: lights.filter((light) => light.provider === 'hue'),
      smartlife: lights.filter((light) => light.provider === 'smartlife'),
      aramsmart: lights.filter((light) => light.provider === 'aramsmart'),
    };
  }, [lights]);

  const warningText = useMemo(() => {
    if (!warnings.length) {
      return null;
    }

    return warnings.map((warning, index) => `${index + 1}. [${warning.scope}] ${warning.message}`).join('\n');
  }, [warnings]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Tablet Control Center</Text>
          <Text style={styles.title}>Garmin + Strava + Nutrition + Smart Lights</Text>
          <Text style={styles.subtitle}>
            Dashboard unifie pour piloter tes donnees physiques et ton ecosysteme domotique.
          </Text>
          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.refreshButton} onPress={() => loadDashboard(true)} disabled={loading}>
              <Text style={styles.refreshButtonText}>{loading ? 'Chargement...' : 'Refresh live'}</Text>
            </TouchableOpacity>
            <Text style={styles.refreshMeta}>
              Derniere sync: {lastRefresh ? dayjs(lastRefresh).format('DD/MM HH:mm:ss') : 'n/a'}
            </Text>
          </View>
        </View>

        <View style={[styles.mainGrid, twoColumns && styles.mainGridTwoCols]}>
          <View style={styles.column}>
            <Panel
              title="Fitness"
              subtitle={fitness ? `${fitness.athleteName} - ${fitness.city ?? 'city n/a'}` : 'Garmin/Strava bridge'}
            >
              {!fitness ? (
                <Text style={styles.emptyText}>Aucune donnee fitness disponible.</Text>
              ) : (
                <>
                  <View style={styles.kpiGrid}>
                    {fitness.kpis.map((kpi) => (
                      <View key={kpi.label} style={styles.kpiCard}>
                        <Text style={styles.kpiLabel}>{kpi.label}</Text>
                        <Text style={styles.kpiValue}>
                          {formatNumber(kpi.value)} <Text style={styles.kpiUnit}>{kpi.unit}</Text>
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.listBlock}>
                    {fitness.activities.slice(0, 6).map((activity) => (
                      <View key={activity.id} style={styles.rowItem}>
                        <View style={styles.rowLeft}>
                          <Text style={styles.rowTitle}>{activity.name}</Text>
                          <Text style={styles.rowMeta}>
                            {activity.source.toUpperCase()} - {activity.type} - {dayjs(activity.date).format('DD/MM HH:mm')}
                          </Text>
                        </View>
                        <Text style={styles.rowValue}>{formatNumber(activity.distanceKm)} km</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </Panel>

            <Panel
              title="Nutrition"
              subtitle="Donnees repas depuis Supabase"
            >
              {!nutrition ? (
                <Text style={styles.emptyText}>Aucune donnee nutrition disponible.</Text>
              ) : (
                <>
                  <View style={styles.kpiGrid}>
                    <View style={styles.kpiCard}>
                      <Text style={styles.kpiLabel}>Calories today</Text>
                      <Text style={styles.kpiValue}>{formatNumber(nutrition.totalToday)} <Text style={styles.kpiUnit}>kcal</Text></Text>
                    </View>
                    <View style={styles.kpiCard}>
                      <Text style={styles.kpiLabel}>Calories 7 days</Text>
                      <Text style={styles.kpiValue}>{formatNumber(nutrition.totalWeek)} <Text style={styles.kpiUnit}>kcal</Text></Text>
                    </View>
                    <View style={styles.kpiCard}>
                      <Text style={styles.kpiLabel}>Meals logged</Text>
                      <Text style={styles.kpiValue}>{formatNumber(nutrition.count)} <Text style={styles.kpiUnit}>entries</Text></Text>
                    </View>
                    <View style={styles.kpiCard}>
                      <Text style={styles.kpiLabel}>Average meal</Text>
                      <Text style={styles.kpiValue}>{formatNumber(nutrition.averageMeal)} <Text style={styles.kpiUnit}>kcal</Text></Text>
                    </View>
                  </View>

                  <View style={styles.listBlock}>
                    {nutrition.entries.slice(0, 6).map((entry) => (
                      <View key={entry.id + entry.capturedAt} style={styles.rowItem}>
                        <View style={styles.rowLeft}>
                          <Text style={styles.rowTitle}>{entry.name}</Text>
                          <Text style={styles.rowMeta}>{entry.grams} g - {dayjs(entry.capturedAt).format('DD/MM HH:mm')}</Text>
                        </View>
                        <Text style={styles.rowValue}>{entry.calories} kcal</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </Panel>
          </View>

          <View style={styles.column}>
            <Panel title="Lights" subtitle="SmartLife + Philips Hue + AramSMART">
              {lights.length === 0 ? (
                <Text style={styles.emptyText}>Aucune lumiere detectee. Verifie ta configuration API.</Text>
              ) : (
                <View style={styles.listBlock}>
                  {(['hue', 'smartlife', 'aramsmart'] as const).map((provider) => (
                    <View key={provider} style={styles.providerBlock}>
                      <Text style={styles.providerTitle}>{provider.toUpperCase()}</Text>
                      {groupedLights[provider].length === 0 ? (
                        <Text style={styles.providerEmpty}>No device</Text>
                      ) : (
                        groupedLights[provider].map((light) => (
                          <LightRow
                            key={light.id}
                            light={light}
                            busy={busyLightIds.includes(light.id)}
                            onToggle={handleToggleLight}
                            onBrightnessChange={handleBrightness}
                          />
                        ))
                      )}
                    </View>
                  ))}
                </View>
              )}
            </Panel>

            <Panel title="Diagnostics" subtitle="Erreurs de connexion et fallback">
              {warningText ? <Text style={styles.warningText}>{warningText}</Text> : <Text style={styles.okText}>Tous les services repondent.</Text>}
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#1f8a70" />
                  <Text style={styles.loadingText}>Sync dashboard...</Text>
                </View>
              ) : null}
            </Panel>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f6ec',
  },
  container: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#d5ddcf',
    backgroundColor: '#ffffff',
    shadowColor: '#152d24',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 2,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#d15b25',
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 8,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
    color: '#122821',
  },
  subtitle: {
    marginTop: 8,
    color: '#486257',
    fontSize: 15,
    lineHeight: 21,
  },
  heroActions: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  refreshButton: {
    backgroundColor: '#10211d',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  refreshButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  refreshMeta: {
    color: '#4f625a',
    fontSize: 13,
  },
  mainGrid: {
    gap: 14,
  },
  mainGridTwoCols: {
    flexDirection: 'row',
  },
  column: {
    flex: 1,
    gap: 14,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    minWidth: 145,
    flexGrow: 1,
    borderWidth: 1,
    borderColor: '#d9e1d8',
    borderRadius: 12,
    backgroundColor: '#fcfffb',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  kpiLabel: {
    color: '#4f655b',
    fontSize: 12,
  },
  kpiValue: {
    marginTop: 4,
    color: '#172b24',
    fontSize: 24,
    fontWeight: '800',
  },
  kpiUnit: {
    fontSize: 13,
    color: '#566a61',
    fontWeight: '500',
  },
  listBlock: {
    marginTop: 10,
    gap: 8,
  },
  rowItem: {
    borderWidth: 1,
    borderColor: '#dce3da',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: '#fcfdfb',
  },
  rowLeft: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#152a23',
  },
  rowMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#54675f',
  },
  rowValue: {
    fontSize: 14,
    color: '#10231d',
    fontWeight: '700',
  },
  providerBlock: {
    gap: 8,
  },
  providerTitle: {
    color: '#1a2e27',
    fontSize: 13,
    fontWeight: '700',
  },
  providerEmpty: {
    color: '#5b6e66',
    fontSize: 12,
  },
  warningText: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#efb6b6',
    backgroundColor: '#fff2f2',
    padding: 12,
    color: '#7c3030',
    lineHeight: 19,
  },
  okText: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c8e7da',
    backgroundColor: '#edf9f3',
    padding: 12,
    color: '#165c4a',
  },
  emptyText: {
    color: '#5b6f66',
    marginTop: 8,
  },
  loadingRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#4b6158',
  },
});
