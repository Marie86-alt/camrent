import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { CAR_PHOTO_SLOTS } from '../../constants/cameroon';
import { CitySearchInput } from '../../components/CitySearchInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../hooks/useAuth';
import { createCar } from '../../services/carService';
import { hasFirebaseConfig } from '../../services/firebase';
import { uploadCarDocument, uploadCarImage } from '../../services/storageService';
import type { CameroonCity } from '../../types/models';

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

export function AddCarScreen() {
  const { user } = useAuth();
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [pricePerDay, setPricePerDay] = useState('');
  const [city, setCity] = useState<CameroonCity>('Yaounde');
  const [photoUris, setPhotoUris] = useState<(string | null)[]>(Array(6).fill(null));
  const [registrationDocumentUri, setRegistrationDocumentUri] = useState<string | null>(null);
  const [licensePlate, setLicensePlate] = useState('');
  const [chassisNumber, setChassisNumber] = useState('');
  const [mileage, setMileage] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [technicalInspectionExpiry, setTechnicalInspectionExpiry] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePickPhoto = async (index: number) => {
    const uri = await pickPhoto();
    if (uri) {
      setPhotoUris((prev) => {
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

  const resetForm = () => {
    setBrand('');
    setModel('');
    setPricePerDay('');
    setPhotoUris(Array(6).fill(null));
    setRegistrationDocumentUri(null);
    setLicensePlate('');
    setChassisNumber('');
    setMileage('');
    setInsuranceExpiry('');
    setTechnicalInspectionExpiry('');
  };

  const submit = async () => {
    if (!user) return;

    if (!photoUris[0]) {
      Alert.alert('Photo requise', 'Ajoutez au moins la photo avant (Avant) de la voiture.');
      return;
    }

    try {
      setLoading(true);

      if (!hasFirebaseConfig) {
        Alert.alert('Mode démo', 'La voiture est simulée. Configurez Firebase pour enregistrer une vraie annonce.');
        resetForm();
        return;
      }

      const uploadedUrls = await Promise.all(
        photoUris.map((uri) => (uri ? uploadCarImage(user.id, uri) : Promise.resolve(null))),
      );
      const imageUrls = uploadedUrls.filter((u): u is string => u !== null);
      const imageUrl = imageUrls[0];

      const registrationDocumentUrl = registrationDocumentUri
        ? await uploadCarDocument(user.id, registrationDocumentUri, 'registration-document')
        : undefined;

      await createCar({
        ownerId: user.id,
        brand,
        model,
        year: new Date().getFullYear(),
        city,
        pricePerDay: Number(pricePerDay),
        imageUrl,
        imageUrls,
        seats: 5,
        transmission: 'Automatique',
        fuelType: 'Essence',
        isAvailable: true,
        description: 'Voiture disponible à la location sur Autofix Pro.',
        adminStatus: 'pending_review',
        documentsVerified: false,
        technicalSheet: {
          licensePlate: licensePlate.trim(),
          chassisNumber: chassisNumber.trim(),
          mileage: Number(mileage) || 0,
          insuranceExpiry: insuranceExpiry.trim(),
          technicalInspectionExpiry: technicalInspectionExpiry.trim(),
          registrationDocumentUrl,
        },
      });

      Alert.alert('Voiture ajoutée', 'Votre annonce est envoyée pour vérification admin.');
      resetForm();
    } catch {
      Alert.alert('Erreur', 'Impossible d\'ajouter la voiture.');
    } finally {
      setLoading(false);
    }
  };

  const filledCount = photoUris.filter(Boolean).length;

  return (
    <Screen>
      <View className="gap-5 pt-4">
        <Text className="text-2xl font-black text-slate-950">Ajouter une voiture</Text>

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
          <Text className="text-xs text-slate-400">
            La photo Avant est obligatoire. Les 6 angles augmentent vos chances de validation.
          </Text>

          <View className="flex-row flex-wrap gap-3">
            {CAR_PHOTO_SLOTS.map((slot, index) => {
              const uri = photoUris[index];
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
                      borderColor: uri ? '#bfdbfe' : isRequired ? '#fde68a' : '#e2e8f0',
                      backgroundColor: uri ? undefined : '#f8fafc',
                    }}
                  >
                    {uri ? (
                      <Image className="h-28 w-full" resizeMode="cover" source={{ uri }} />
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
                      style={{ backgroundColor: uri ? 'rgba(0,0,0,0.45)' : '#f1f5f9', marginTop: uri ? -36 : 0 }}
                    >
                      <Text
                        className="text-xs font-bold"
                        style={{ color: uri ? 'white' : isRequired ? '#ca8a04' : '#64748b' }}
                      >
                        {slot.label}
                      </Text>
                      {isRequired && !uri && (
                        <Text className="text-xs font-semibold text-amber-600">Requis</Text>
                      )}
                      {uri && (
                        <Ionicons color="white" name="checkmark-circle" size={14} />
                      )}
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

        {/* ─── Fiche technique ─── */}
        <View className="gap-3 rounded-2xl bg-white p-4" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
          <Text className="text-base font-black text-slate-950">Fiche technique</Text>
          <TextInput className="h-12 rounded-xl border border-slate-200 px-4" onChangeText={setLicensePlate} placeholder="Immatriculation" value={licensePlate} />
          <TextInput className="h-12 rounded-xl border border-slate-200 px-4" onChangeText={setChassisNumber} placeholder="Numéro de châssis" value={chassisNumber} />
          <TextInput className="h-12 rounded-xl border border-slate-200 px-4" keyboardType="numeric" onChangeText={setMileage} placeholder="Kilométrage" value={mileage} />
          <TextInput className="h-12 rounded-xl border border-slate-200 px-4" onChangeText={setInsuranceExpiry} placeholder="Expiration assurance (AAAA-MM-JJ)" value={insuranceExpiry} />
          <TextInput className="h-12 rounded-xl border border-slate-200 px-4" onChangeText={setTechnicalInspectionExpiry} placeholder="Expiration contrôle technique (AAAA-MM-JJ)" value={technicalInspectionExpiry} />
          <TouchableOpacity
            activeOpacity={0.8}
            className={`flex-row items-center gap-2 rounded-xl border p-3.5 ${registrationDocumentUri ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}
            onPress={pickRegistrationDocument}
          >
            <Ionicons
              color={registrationDocumentUri ? '#3B63D4' : '#64748b'}
              name={registrationDocumentUri ? 'checkmark-circle-outline' : 'document-outline'}
              size={18}
            />
            <Text className={`font-semibold ${registrationDocumentUri ? 'text-brand-blue' : 'text-slate-600'}`}>
              {registrationDocumentUri ? 'Carte grise ajoutée' : 'Ajouter carte grise / document véhicule'}
            </Text>
          </TouchableOpacity>
        </View>

        <PrimaryButton
          disabled={!brand || !model || !city || !pricePerDay || (!photoUris[0] && hasFirebaseConfig)}
          loading={loading}
          onPress={submit}
        >
          Publier l'annonce
        </PrimaryButton>
      </View>
    </Screen>
  );
}
