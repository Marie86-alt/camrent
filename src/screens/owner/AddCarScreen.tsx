import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { CAMEROON_CITIES } from '../../constants/cameroon';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../hooks/useAuth';
import { createCar } from '../../services/carService';
import { hasFirebaseConfig } from '../../services/firebase';
import { uploadCarImage } from '../../services/storageService';
import type { CameroonCity } from '../../types/models';

export function AddCarScreen() {
  const { user } = useAuth();
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [pricePerDay, setPricePerDay] = useState('');
  const [city] = useState<CameroonCity>(CAMEROON_CITIES[0]);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission requise', 'Autorisez l acces aux photos pour ajouter une image de voiture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const submit = async () => {
    if (!user) {
      return;
    }

    try {
      setLoading(true);
      if (!hasFirebaseConfig) {
        Alert.alert('Mode demo', 'La voiture est simulee. Configurez Firebase pour enregistrer une vraie annonce.');
        setBrand('');
        setModel('');
        setPricePerDay('');
        setImageUri(null);
        return;
      }

      if (!imageUri) {
        Alert.alert('Photo requise', 'Ajoutez une photo de la voiture avant de publier.');
        return;
      }

      const imageUrl = await uploadCarImage(user.id, imageUri);

      await createCar({
        ownerId: user.id,
        brand,
        model,
        year: new Date().getFullYear(),
        city,
        pricePerDay: Number(pricePerDay),
        imageUrl,
        seats: 5,
        transmission: 'Automatique',
        fuelType: 'Essence',
        isAvailable: true,
        description: 'Voiture disponible a la location sur CamRent.',
      });
      Alert.alert('Voiture ajoutee', 'Votre annonce est maintenant visible.');
      setBrand('');
      setModel('');
      setPricePerDay('');
      setImageUri(null);
    } catch {
      Alert.alert('Erreur', 'Impossible d ajouter la voiture.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View className="gap-4 pt-4">
        <Text className="text-2xl font-black text-slate-950">Ajouter une voiture</Text>
        <TouchableOpacity className="h-48 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white" onPress={pickImage}>
          {imageUri ? (
            <Image className="h-full w-full" resizeMode="cover" source={{ uri: imageUri }} />
          ) : (
            <Text className="font-semibold text-slate-600">Ajouter une photo</Text>
          )}
        </TouchableOpacity>
        <TextInput className="h-12 rounded-lg border border-slate-200 bg-white px-4" onChangeText={setBrand} placeholder="Marque" value={brand} />
        <TextInput className="h-12 rounded-lg border border-slate-200 bg-white px-4" onChangeText={setModel} placeholder="Modele" value={model} />
        <TextInput className="h-12 rounded-lg border border-slate-200 bg-white px-4" keyboardType="numeric" onChangeText={setPricePerDay} placeholder="Prix par jour en FCFA" value={pricePerDay} />
        <PrimaryButton disabled={!brand || !model || !pricePerDay || (!imageUri && hasFirebaseConfig)} loading={loading} onPress={submit}>
          Publier l annonce
        </PrimaryButton>
      </View>
    </Screen>
  );
}
