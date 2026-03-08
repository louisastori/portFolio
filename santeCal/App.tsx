import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { classifyFood } from './src/services/localInference';
import { estimateCalories, normalizeFoodName } from './src/services/calorieEstimator';
import { fetchMealsForDate, isSupabaseReady, saveMealEntry } from './src/services/supabaseClient';
import { FoodPrediction, MealEntry } from './src/types';

const theme = {
  background: '#0f172a',
  card: '#111827',
  accent: '#22c55e',
  muted: '#94a3b8',
  border: '#1f2937',
  text: '#e2e8f0',
};

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
};

const Button = ({ label, onPress, variant = 'primary', disabled, loading }: ButtonProps) => {
  return (
    <TouchableOpacity
      accessibilityLabel={label}
      style={[
        styles.button,
        variant === 'secondary' && styles.buttonSecondary,
        disabled && styles.buttonDisabled,
      ]}
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
    >
      {loading ? <ActivityIndicator color={variant === 'primary' ? '#0b111d' : theme.text} /> : <Text style={[styles.buttonText, variant === 'secondary' && styles.buttonSecondaryText]}>{label}</Text>}
    </TouchableOpacity>
  );
};

const Pill = ({ label, onPress }: { label: string; onPress: () => void }) => (
  <TouchableOpacity style={styles.pill} onPress={onPress}>
    <Text style={styles.pillText}>{label}</Text>
  </TouchableOpacity>
);

export default function App() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<FoodPrediction[]>([]);
  const [foodName, setFoodName] = useState('');
  const [grams, setGrams] = useState('150');
  const [calories, setCalories] = useState(0);
  const [loadingDetect, setLoadingDetect] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  const gramsNumber = Number(grams);

  useEffect(() => {
    if (!foodName || Number.isNaN(gramsNumber)) {
      setCalories(0);
      return;
    }
    setCalories(estimateCalories(foodName, gramsNumber));
  }, [foodName, gramsNumber]);

  useEffect(() => {
    const load = async () => {
      if (!isSupabaseReady) {
        setSupabaseError('Supabase non configure (ajoutez les variables EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY).');
        return;
      }
      const today = dayjs().startOf('day').toISOString();
      const { data, error: fetchError } = await fetchMealsForDate(today);
      if (fetchError) {
        setSupabaseError(fetchError);
        return;
      }
      setMeals(data);
    };
    load();
  }, []);

  const totalCalories = useMemo(() => meals.reduce((sum, meal) => sum + meal.calories, 0), [meals]);

  const handlePickImage = async () => {
    setError(null);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError('Autorisation bibliotheque refusee.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.6,
    });

    if (result.canceled || !result.assets?.length) return;

    const uri = result.assets[0].uri;
    setImageUri(uri);
    await runLocalDetection(uri);
  };

  const handleCapture = async () => {
    setError(null);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      setError('Autorisation camera refusee.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.6,
    });

    if (result.canceled || !result.assets?.length) return;

    const uri = result.assets[0].uri;
    setImageUri(uri);
    await runLocalDetection(uri);
  };

  const runLocalDetection = async (uri: string) => {
    setLoadingDetect(true);
    setInfo(null);
    try {
      const detected = await classifyFood(uri);
      setPredictions(detected);
      if (detected[0]?.label) {
        setFoodName(detected[0].label);
      }
    } catch (e) {
      setError('Impossible de faire la detection locale.');
    } finally {
      setLoadingDetect(false);
    }
  };

  const resetForm = () => {
    setImageUri(null);
    setPredictions([]);
    setFoodName('');
    setGrams('150');
    setCalories(0);
    setInfo(null);
    setError(null);
  };

  const handleSave = async () => {
    setError(null);
    setInfo(null);

    if (!foodName) {
      setError("Ajoutez un nom d'aliment.");
      return;
    }
    if (!gramsNumber || Number.isNaN(gramsNumber)) {
      setError('Ajoutez le poids en grammes.');
      return;
    }

    const entry: MealEntry = {
      name: normalizeFoodName(foodName),
      grams: gramsNumber,
      calories: calories || estimateCalories(foodName, gramsNumber),
      capturedAt: new Date().toISOString(),
      imageUri,
    };

    setSaving(true);
    const result = await saveMealEntry(entry);
    setSaving(false);

    if (!result.success && !result.skipped) {
      setError(result.error);
    } else if (result.skipped) {
      setInfo('Enregistre localement (Supabase non configure).');
    } else {
      setInfo('Enregistre dans Supabase.');
      entry.id = result.id;
    }

    setMeals((prev) => [entry, ...prev]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Journal calories</Text>
        <Text style={styles.subtitle}>Photo + IA locale pour reconnaitre l'aliment et calculer rapidement.</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>1. Image</Text>
          <View style={styles.buttonRow}>
            <Button label="Prendre une photo" onPress={handleCapture} disabled={loadingDetect || saving} />
            <Button label="Importer" variant="secondary" onPress={handlePickImage} disabled={loadingDetect || saving} />
          </View>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.preview} />
          ) : (
            <Text style={styles.placeholder}>Aucune image selectionnee</Text>
          )}
          {loadingDetect && (
            <View style={styles.inlineRow}>
              <ActivityIndicator color={theme.accent} />
              <Text style={styles.helper}>Detection locale...</Text>
            </View>
          )}
          {predictions.length > 0 && (
            <View style={styles.predictionBlock}>
              <Text style={styles.helper}>Suggestion IA</Text>
              <Text style={styles.predictionText}>{predictions[0].label}</Text>
              <View style={styles.pillRow}>
                {predictions[0].alternatives?.map((alt) => (
                  <Pill key={alt} label={alt} onPress={() => setFoodName(alt)} />
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>2. Details</Text>
          <Text style={styles.label}>Nom de l'aliment</Text>
          <TextInput
            value={foodName}
            onChangeText={(text) => setFoodName(text)}
            placeholder="pomme, riz..."
            placeholderTextColor={theme.muted}
            style={styles.input}
          />
          <Text style={styles.label}>Poids (g)</Text>
          <TextInput
            value={grams}
            onChangeText={(text) => setGrams(text.replace(/[^0-9]/g, ''))}
            placeholder="150"
            keyboardType="numeric"
            placeholderTextColor={theme.muted}
            style={styles.input}
          />
          <View style={styles.calorieRow}>
            <Text style={styles.calorieLabel}>Calories estimees</Text>
            <Text style={styles.calorieValue}>{calories ? `${calories} kcal` : '-'}</Text>
          </View>
          <View style={styles.buttonRow}>
            <Button label="Enregistrer" onPress={handleSave} disabled={saving} loading={saving} />
            <Button label="Reinitialiser" variant="secondary" onPress={resetForm} disabled={saving} />
          </View>
          {info && <Text style={styles.info}>{info}</Text>}
          {error && <Text style={styles.error}>{error}</Text>}
          {supabaseError && <Text style={styles.warning}>{supabaseError}</Text>}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>3. Journee</Text>
          <View style={styles.calorieRow}>
            <Text style={styles.calorieLabel}>Total</Text>
            <Text style={styles.calorieValue}>{totalCalories} kcal</Text>
          </View>
          <Text style={styles.helper}>{dayjs().format('dddd D MMMM YYYY')}</Text>
          {meals.length === 0 ? (
            <Text style={styles.placeholder}>Aucun repas pour l'instant.</Text>
          ) : (
            meals.map((meal) => (
              <View key={meal.capturedAt + meal.name} style={styles.mealRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mealName}>{meal.name}</Text>
                  <Text style={styles.mealMeta}>
                    {meal.grams} g - {meal.calories} kcal
                  </Text>
                  <Text style={styles.mealTime}>{dayjs(meal.capturedAt).format('HH:mm')}</Text>
                </View>
                {meal.imageUri ? <Image source={{ uri: meal.imageUri }} style={styles.thumb} /> : null}
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Comment ca marche</Text>
          <Text style={styles.helper}>
            - La detection est locale (remplacez `classifyFood` par votre modele on-device TFLite/CoreML).{'\n'}
            - Configurez Supabase avec EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY dans un fichier .env.local.{'\n'}
            - Table a creer : `meals` avec colonnes `id:uuid`, `name:text`, `grams:integer`, `calories:integer`, `capturedAt:timestamptz`, `imageUri:text`.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.background,
  },
  container: {
    paddingHorizontal: 16,
    paddingBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text,
    marginTop: 12,
  },
  subtitle: {
    color: theme.muted,
    marginTop: 4,
    marginBottom: 16,
  },
  card: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  sectionTitle: {
    color: theme.text,
    fontWeight: '600',
    marginBottom: 12,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    columnGap: 12,
  },
  button: {
    flex: 1,
    backgroundColor: theme.accent,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#1f2937',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#0b111d',
    fontWeight: '700',
  },
  buttonSecondaryText: {
    color: theme.text,
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 12,
  },
  placeholder: {
    color: theme.muted,
    marginTop: 8,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
    marginTop: 8,
  },
  helper: {
    color: theme.muted,
    marginTop: 6,
    lineHeight: 20,
  },
  predictionBlock: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: theme.border,
  },
  predictionText: {
    color: theme.text,
    fontWeight: '600',
    fontSize: 16,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 8,
    rowGap: 8,
    marginTop: 8,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#1f2937',
  },
  pillText: {
    color: theme.text,
  },
  label: {
    color: theme.muted,
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#0b1220',
    color: theme.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  calorieRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  calorieLabel: {
    color: theme.muted,
  },
  calorieValue: {
    color: theme.text,
    fontSize: 18,
    fontWeight: '700',
  },
  info: {
    marginTop: 8,
    color: theme.accent,
  },
  error: {
    marginTop: 8,
    color: '#f87171',
  },
  warning: {
    marginTop: 8,
    color: '#fbbf24',
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  mealName: {
    color: theme.text,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  mealMeta: {
    color: theme.muted,
  },
  mealTime: {
    color: theme.muted,
    fontSize: 12,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    marginLeft: 12,
  },
});
