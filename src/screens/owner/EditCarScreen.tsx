import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { CAR_PHOTO_SLOTS } from '../../constants/cameroon';
import { CitySearchInput } from '../../components/CitySearchInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { updateCar } from '../../services/carService';
import { uploadCarDocument, uploadCarImage } from '../../services/storageService';
import type { OwnerStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<OwnerStackParamList, 'EditCar'>;

async function pickPhoto(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission requise', 'Autorisez l\'accès aux photos.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    aspect: [4, 3],
    mediaTypes: ['images' as const],
    quality: 0.8,
  });
  return result.canceled ? null : result.assets[0].uri;
}

export function EditCarScreen({ navigation, route }: Props) {
  const { car } = route.params;
  const [brand, setBrand] = useState(car.brand);
  const [model, setModel] = useState(car.model);
  const [city, setCity] = useState(car.city);
  const [pricePerDay, setPricePerDay] = useState(String(car.pricePerDay));
  const [description, setDescription] = useState(car.description);
  const [licensePlate, setLicensePlate] = useState(car.technicalSheet?.licensePlate ?? '');
  const [chassisNumber, setChassisNumber] = useState(car.technicalSheet?.chassisNumber ?? '');
  const [mileage, setMileage] = useState(String(car.technicalSheet?.mileage ?? ''));
  const [insuranceExpiry, setInsuranceExpiry] = useState(car.technicalSheet?.insuranceExpiry ?? '');
  const [technicalInspectionExpiry, setTechnicalInspectionExpiry] = useState(car.technicalSheet?.technicalInspectionExpiry ?? '');
  const [registrationDocumentUri, setRegistrationDocumentUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // newPhotoUris = local URIs picked by user (null = keep existing remote URL)
  const [newPhotoUris, setNewPhotoUris] = useState<(string | null)[]>(Array(6).fill(null));

  // Existing remote URLs indexed 0..5
  const existingUrls: (string | null)[] = Array(6).fill(null).map((_, i) => {
    if (car.imageUrls && car.imageUrls[i]) return car.imageUrls[i];
    if (i === 0 && car.imageUrl) return car.imageUrl;
    return null;
  });

  const handlePickPhoto = async (index: number) => {
    const uri = await pickPhoto();
    if (uri) {
      setNewPhotoUris((prev) => {
        const next = [...prev];
        next[index] = uri;
        return next;
      });
    }
  };

  const pickRegistrationDocument = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', 'Autorisez l\'accès aux photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      mediaTypes: ['images' as const],
      quality: 0.8,
    });
    if (!result.canceled) setRegistrationDocumentUri(result.assets[0].uri);
  };

  const save = async () => {
    try {
      setLoading(true);

      const uploadedUrls = await Promise.all(
        Array(6).fill(null).map(async (_, i) => {
          if (newPhotoUris[i]) return uploadCarImage(car.ownerId, newPhotoUris[i]!);
          return existingUrls[i];
        }),
      );

      const imageUrls = uploadedUrls.filter((u): u is string => u !== null);
      const imageUrl = imageUrls[0] ?? car.imageUrl;

      const registrationDocumentUrl = registrationDocumentUri
        ? await uploadCarDocument(car.ownerId, registrationDocumentUri, 'registration-document')
        : car.technicalSheet?.registrationDocumentUrl;

      await updateCar(car.id, {
        adminStatus: 'pending_review',
        brand: brand.trim(),
        city,
        documentsVerified: false,
        description: description.trim(),
        imageUrl,
        imageUrls,
        model: model.trim(),
        pricePerDay: Number(pricePerDay),
        technicalSheet: {
          licensePlate: licensePlate.trim(),
          chassisNumber: chassisNumber.trim(),
          mileage: Number(mileage) || 0,
          insuranceExpiry: insuranceExpiry.trim(),
          technicalInspectionExpiry: technicalInspectionExpiry.trim(),
          registrationDocumentUrl,
        },
      });

      Alert.alert('Voiture modifiée', 'Les informations sont envoyées pour vérification admin.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Erreur', 'Impossible de modifier la voiture.');
    } finally {
      setLoading(false);
    }
  };

  const filledCount = Array(6).fill(null).filter((_, i) => newPhotoUris[i] ?? existingUrls[i]).length;

  return (
    <Screen>
      <View className="gap-5 pt-4">
        <Text className="text-2xl font-black text-slate-950">Modifier la voiture</Text>

        {/* ─── 6 photos ─── */}
        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="font-bold text-slate-950">Photos du véhicule</Text>
            <Text
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                filledCount === 6 ? 'bg-blue-50 text-brand-blue' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {filledCount}/6
            </Text>
          </View>

          <View className="flex-row flex-wrap gap-3">
            {CAR_PHOTO_SLOTS.map((slot, index) => {
              const localUri = newPhotoUris[index];
              const remoteUri = existingUrls[index];
              const displayUri = localUri ?? remoteUri;
              const isRequired = index === 0;
              return (
                <TouchableOpacity
                  activeOpacity={0.8}
                  key={slot.key}
                  onPress={() => handlePickPhoto(index)}
                  style={{ width: '47%' }}
                >
                  <View
                    className="overflow-hidden rounded-xl"
                    style={{
                      borderWidth: 1.5,
                      borderColor: displayUri ? '#bfdbfe' : isRequired ? '#fde68a' : '#e2e8f0',
                      backgroundColor: displayUri ? undefined : '#f8fafc',
                    }}
                  >
                    {displayUri ? (
                      <Image className="h-28 w-full" resizeMode="cover" source={{ uri: displayUri }} />
                    ) : (
                      <View className="h-28 items-center justify-center gap-1.5">
                        <Ionicons
                          color={isRequired ? '#ca8a04' : '#94a3b8'}
                          name="camera-outline"
                          size={24}
                        />
                      </View>
                    )}
                    <View
                      className="flex-row items-center justify-between px-2.5 py-1.5"
                      style={{ backgroundColor: displayUri ? 'rgba(0,0,0,0.45)' : '#f1f5f9', marginTop: displayUri ? -36 : 0 }}
                    >
                      <Text
                        className="text-xs font-bold"
                        style={{ color: displayUri ? 'white' : isRequired ? '#ca8a04' : '#64748b' }}
                      >
                        {slot.label}
                      </Text>
                      {localUri ? (
                        <Text className="text-xs font-semibold text-white">Modifiée</Text>
                      ) : displayUri ? (
                        <Ionicons color="white" name="checkmark-circle" size={14} />
                      ) : isRequired ? (
                        <Text className="text-xs font-semibold text-amber-600">Requis</Text>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ─── Infos ─── */}
        <TextInput className="h-12 rounded-xl border border-slate-200 bg-white px-4" onChangeText={setBrand} placeholder="Marque" value={brand} />
        <TextInput className="h-12 rounded-xl border border-slate-200 bg-white px-4" onChangeText={setModel} placeholder="Modèle" value={model} />
        <CitySearchInput label="Ville du véhicule" onSelectCity={setCity} value={city} />
        <TextInput className="h-12 rounded-xl border border-slate-200 bg-white px-4" keyboardType="numeric" onChangeText={setPricePerDay} placeholder="Prix par jour en FCFA" value={pricePerDay} />
        <TextInput
          className="min-h-28 rounded-xl border border-slate-200 bg-white px-4 py-3"
          multiline
          onChangeText={setDescription}
          placeholder="Description"
          textAlignVertical="top"
          value={description}
        />

        {/* ─── Fiche technique ─── */}
        <View className="gap-3 rounded-2xl bg-white p-4" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
          <Text className="text-base font-black text-slate-950">Fiche technique</Text>
          <TextInput className="h-12 rounded-xl border border-slate-200 px-4" onChangeText={setLicensePlate} placeholder="Immatriculation" value={licensePlate} />
          <TextInput className="h-12 rounded-xl border border-slate-200 px-4" onChangeText={setChassisNumber} placeholder="Numéro de châssis" value={chassisNumber} />
          <TextInput className="h-12 rounded-xl border border-slate-200 px-4" keyboardType="numeric" onChangeText={setMileage} placeholder="Kilométrage" value={mileage} />
          <TextInput className="h-12 rounded-xl border border-slate-200 px-4" onChangeText={setInsuranceExpiry} placeholder="Expiration assurance (ex: 03/06/2027)" value={insuranceExpiry} />
          <TextInput className="h-12 rounded-xl border border-slate-200 px-4" onChangeText={setTechnicalInspectionExpiry} placeholder="Expiration contrôle technique (ex: 03/06/2027)" value={technicalInspectionExpiry} />
          <TouchableOpacity
            activeOpacity={0.8}
            className={`flex-row items-center gap-2 rounded-xl border p-3.5 ${
              registrationDocumentUri || car.technicalSheet?.registrationDocumentUrl
                ? 'border-blue-200 bg-blue-50'
                : 'border-slate-200 bg-slate-50'
            }`}
            onPress={pickRegistrationDocument}
          >
            <Ionicons
              color={registrationDocumentUri || car.technicalSheet?.registrationDocumentUrl ? '#3B63D4' : '#64748b'}
              name={registrationDocumentUri || car.technicalSheet?.registrationDocumentUrl ? 'checkmark-circle-outline' : 'document-outline'}
              size={18}
            />
            <Text className={`font-semibold ${registrationDocumentUri || car.technicalSheet?.registrationDocumentUrl ? 'text-brand-blue' : 'text-slate-600'}`}>
              {registrationDocumentUri
                ? 'Nouveau document sélectionné'
                : car.technicalSheet?.registrationDocumentUrl
                  ? 'Carte grise déjà fournie (appuyer pour remplacer)'
                  : 'Ajouter carte grise / document véhicule'}
            </Text>
          </TouchableOpacity>
        </View>

        <PrimaryButton disabled={!brand || !model || !pricePerDay} loading={loading} onPress={save}>
          Enregistrer les modifications
        </PrimaryButton>
      </View>
    </Screen>
  );
}
