import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import { Image, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { CitySearchInput } from '../../components/CitySearchInput';
import { DatePickerField } from '../../components/DatePickerField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { useToast } from '../../components/ui';
import { hapticError, hapticSuccess } from '../../utils/haptics';
import { CAR_PHOTO_SLOTS } from '../../constants/cameroon';
import { updateCar } from '../../services/carService';
import { uploadCarDocument, uploadCarImage } from '../../services/storageService';
import type { OwnerStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<OwnerStackParamList, 'EditCar'>;

async function pickPhoto(): Promise<{ uri: string | null; permissionDenied: boolean }> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return { uri: null, permissionDenied: true };

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    aspect: [4, 3],
    mediaTypes: ['images' as const],
    quality: 0.8,
  });

  return { uri: result.canceled ? null : result.assets[0].uri, permissionDenied: false };
}

export function EditCarScreen({ navigation, route }: Props) {
  const { car } = route.params;
  const toast = useToast();
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
  const [allowIndependentDrivers, setAllowIndependentDrivers] = useState(car.allowIndependentDrivers ?? false);
  const [registrationDocumentUri, setRegistrationDocumentUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [newPhotoUris, setNewPhotoUris] = useState<(string | null)[]>(Array(6).fill(null));
  const minDocumentDate = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const existingUrls: (string | null)[] = Array(6)
    .fill(null)
    .map((_, index) => {
      if (car.imageUrls?.[index]) return car.imageUrls[index];
      if (index === 0 && car.imageUrl) return car.imageUrl;
      return null;
    });

  const handlePickPhoto = async (index: number) => {
    const result = await pickPhoto();
    if (result.permissionDenied) { toast.info("Autorisez l'acces aux photos pour ajouter le vehicule."); return; }
    const { uri } = result;
    if (!uri) return;

    setNewPhotoUris((current) => {
      const next = [...current];
      next[index] = uri;
      return next;
    });
  };

  const pickRegistrationDocument = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.info("Autorisez l'acces aux photos pour ajouter la carte grise.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      mediaTypes: ['images' as const],
      quality: 0.8,
    });

    if (!result.canceled) {
      setRegistrationDocumentUri(result.assets[0].uri);
    }
  };

  const save = async () => {
    try {
      setLoading(true);

      const uploadedUrls = await Promise.all(
        Array(6)
          .fill(null)
          .map(async (_, index) => {
            if (newPhotoUris[index]) return uploadCarImage(car.ownerId, newPhotoUris[index]);
            return existingUrls[index];
          }),
      );

      const imageUrls = uploadedUrls.filter((url): url is string => url !== null);
      const imageUrl = imageUrls[0] ?? car.imageUrl;
      const registrationDocumentUrl = registrationDocumentUri
        ? await uploadCarDocument(car.ownerId, registrationDocumentUri, 'registration-document')
        : car.technicalSheet?.registrationDocumentUrl;

      await updateCar(car.id, {
        adminStatus: 'pending_review',
        allowIndependentDrivers,
        brand: brand.trim(),
        city,
        documentsVerified: false,
        description: description.trim(),
        imageUrl,
        imageUrls,
        isAvailable: false,
        model: model.trim(),
        pricePerDay: Number(pricePerDay),
        technicalSheet: {
          chassisNumber: chassisNumber.trim(),
          insuranceExpiry: insuranceExpiry.trim(),
          licensePlate: licensePlate.trim(),
          mileage: Number(mileage) || 0,
          registrationDocumentUrl,
          technicalInspectionExpiry: technicalInspectionExpiry.trim(),
        },
      });

      hapticSuccess(); toast.success('Voiture modifiee — en attente de verification admin.'); navigation.goBack();
    } catch {
      hapticError(); toast.error('Impossible de modifier la voiture.');
    } finally {
      setLoading(false);
    }
  };

  const filledCount = Array(6)
    .fill(null)
    .filter((_, index) => newPhotoUris[index] ?? existingUrls[index]).length;

  return (
    <Screen>
      <View className="gap-5 pt-4">
        <Text className="text-2xl font-black text-slate-950">Modifier la voiture</Text>

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
                      backgroundColor: displayUri ? undefined : '#f8fafc',
                      borderColor: displayUri ? '#bfdbfe' : isRequired ? '#fde68a' : '#e2e8f0',
                      borderWidth: 1.5,
                    }}
                  >
                    {displayUri ? (
                      <Image className="h-28 w-full" resizeMode="cover" source={{ uri: displayUri }} />
                    ) : (
                      <View className="h-28 items-center justify-center gap-1.5">
                        <Ionicons color={isRequired ? '#ca8a04' : '#94a3b8'} name="camera-outline" size={24} />
                      </View>
                    )}
                    <View
                      className="flex-row items-center justify-between px-2.5 py-1.5"
                      style={{
                        backgroundColor: displayUri ? 'rgba(0,0,0,0.45)' : '#f1f5f9',
                        marginTop: displayUri ? -36 : 0,
                      }}
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

        <TouchableOpacity
          activeOpacity={0.85}
          className={`flex-row items-center gap-3 rounded-2xl border p-4 ${
            allowIndependentDrivers ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white'
          }`}
          onPress={() => setAllowIndependentDrivers((value) => !value)}
        >
          <View
            className={`h-6 w-6 items-center justify-center rounded-full ${
              allowIndependentDrivers ? 'bg-brand-blue' : 'bg-slate-100'
            }`}
          >
            {allowIndependentDrivers ? <Ionicons color="white" name="checkmark" size={16} /> : null}
          </View>
          <View className="flex-1">
            <Text className="font-bold text-slate-950">Autoriser les chauffeurs indépendants</Text>
            <Text className="mt-1 text-xs text-slate-500">
              J'autorise les chauffeurs indépendants vérifiés à conduire ce véhicule.
            </Text>
          </View>
        </TouchableOpacity>

        <View
          className="gap-3 rounded-2xl bg-white p-4"
          style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}
        >
          <Text className="text-base font-black text-slate-950">Fiche technique</Text>
          <TextInput className="h-12 rounded-xl border border-slate-200 px-4" onChangeText={setLicensePlate} placeholder="Immatriculation" value={licensePlate} />
          <TextInput className="h-12 rounded-xl border border-slate-200 px-4" onChangeText={setChassisNumber} placeholder="Numéro de châssis" value={chassisNumber} />
          <TextInput className="h-12 rounded-xl border border-slate-200 px-4" keyboardType="numeric" onChangeText={setMileage} placeholder="Kilométrage" value={mileage} />
          <DatePickerField
            label="Expiration assurance"
            minimumDate={minDocumentDate}
            onChange={setInsuranceExpiry}
            placeholder="Ex: 03/06/2027"
            value={insuranceExpiry}
          />
          <DatePickerField
            label="Expiration contrôle technique"
            minimumDate={minDocumentDate}
            onChange={setTechnicalInspectionExpiry}
            placeholder="Ex: 03/06/2027"
            value={technicalInspectionExpiry}
          />
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
