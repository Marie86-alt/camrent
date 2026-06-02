import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Text, TouchableOpacity, View } from 'react-native';

import { updateUserProfile } from '../services/authService';
import { uploadUserProfilePhoto } from '../services/storageService';
import { useAuthStore } from '../store/authStore';
import type { AppUser } from '../types/models';

type ProfilePhotoPickerProps = {
  roleLabel: string;
  user: AppUser | null;
};

function getInitials(fullName?: string) {
  return (
    fullName
      ?.split(' ')
      .map((name) => name[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() ?? ''
  );
}

export function ProfilePhotoPicker({ roleLabel, user }: ProfilePhotoPickerProps) {
  const setUser = useAuthStore((state) => state.setUser);
  const [uploading, setUploading] = useState(false);

  async function pickPhoto() {
    if (!user) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission requise', 'Autorisez la galerie pour ajouter une photo de profil.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (result.canceled) {
      return;
    }

    try {
      setUploading(true);
      const photoUrl = await uploadUserProfilePhoto(user.id, result.assets[0].uri);
      const updatedUser = { ...user, photoUrl };
      await updateUserProfile(user.id, { photoUrl });
      setUser(updatedUser);
    } catch {
      Alert.alert('Upload impossible', "La photo de profil n'a pas pu etre envoyee.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <View className="items-center gap-3 py-2">
      <TouchableOpacity activeOpacity={0.85} className="relative" onPress={pickPhoto}>
        <View className="h-24 w-24 overflow-hidden rounded-full bg-brand-blue">
          {user?.photoUrl ? (
            <Image className="h-full w-full" resizeMode="cover" source={{ uri: user.photoUrl }} />
          ) : (
            <View className="h-full w-full items-center justify-center">
              <Text className="text-2xl font-black text-white">{getInitials(user?.fullName)}</Text>
            </View>
          )}
        </View>
        <View className="absolute bottom-0 right-0 h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-slate-950">
          {uploading ? <ActivityIndicator color="#ffffff" size="small" /> : <Ionicons color="#ffffff" name="camera-outline" size={18} />}
        </View>
      </TouchableOpacity>
      <View className="items-center gap-1">
        <Text className="text-xl font-black text-slate-950">{user?.fullName}</Text>
        <View className="rounded-full bg-blue-50 px-3 py-1">
          <Text className="text-xs font-semibold text-brand-blue">{roleLabel}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={pickPhoto}>
        <Text className="text-sm font-semibold text-brand-blue">
          {user?.photoUrl ? 'Modifier la photo' : 'Ajouter une photo'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
