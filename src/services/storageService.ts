import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { storage } from './firebase';

export async function uploadCarImage(ownerId: string, localUri: string) {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const imageRef = ref(storage, `cars/${ownerId}/${Date.now()}.jpg`);

  await uploadBytes(imageRef, blob, {
    contentType: blob.type || 'image/jpeg',
  });

  return getDownloadURL(imageRef);
}
