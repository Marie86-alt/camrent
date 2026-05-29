import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { updateCar } from '../../services/carService';
import { uploadCarImage } from '../../services/storageService';
import type { OwnerStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<OwnerStackParamList, 'EditCar'>;

export function EditCarScreen({ navigation, route }: Props) {
  const { car } = route.params;
  const [brand, setBrand] = useState(car.brand);
  const [model, setModel] = useState(car.model);
  const [pricePerDay, setPricePerDay] = useState(String(car.pricePerDay));
  const [description, setDescription] = useState(car.description);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission requise', 'Autorisez l acces aux photos pour modifier la photo.');
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

  const save = async () => {
    try {
      setLoading(true);
      const imageUrl = imageUri ? await uploadCarImage(car.ownerId, imageUri) : car.imageUrl;

      await updateCar(car.id, {
        brand: brand.trim(),
        description: description.trim(),
        imageUrl,
        model: model.trim(),
        pricePerDay: Number(pricePerDay),
      });

      Alert.alert('Voiture modifiee', 'Les informations ont ete mises a jour.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Erreur', 'Impossible de modifier la voiture.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View className="gap-4 pt-4">
        <Text className="text-2xl font-black text-slate-950">Modifier la voiture</Text>
        <TouchableOpacity className="h-48 overflow-hidden rounded-lg border border-slate-200 bg-white" onPress={pickImage}>
          <Image className="h-full w-full" resizeMode="cover" source={{ uri: imageUri ?? car.imageUrl }} />
        </TouchableOpacity>
        <TextInput className="h-12 rounded-lg border border-slate-200 bg-white px-4" onChangeText={setBrand} placeholder="Marque" value={brand} />
        <TextInput className="h-12 rounded-lg border border-slate-200 bg-white px-4" onChangeText={setModel} placeholder="Modele" value={model} />
        <TextInput className="h-12 rounded-lg border border-slate-200 bg-white px-4" keyboardType="numeric" onChangeText={setPricePerDay} placeholder="Prix par jour en FCFA" value={pricePerDay} />
        <TextInput
          className="min-h-28 rounded-lg border border-slate-200 bg-white px-4 py-3"
          multiline
          onChangeText={setDescription}
          placeholder="Description"
          textAlignVertical="top"
          value={description}
        />
        <PrimaryButton disabled={!brand || !model || !pricePerDay} loading={loading} onPress={save}>
          Enregistrer
        </PrimaryButton>
      </View>
    </Screen>
  );
}
