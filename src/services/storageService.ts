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

export async function uploadCarDocument(ownerId: string, localUri: string, documentType: string) {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const documentRef = ref(storage, `cars/${ownerId}/documents/${documentType}-${Date.now()}.jpg`);

  await uploadBytes(documentRef, blob, {
    contentType: blob.type || 'image/jpeg',
  });

  return getDownloadURL(documentRef);
}

export async function uploadSignature(userId: string, bookingId: string, base64Data: string) {
  const blob = await dataUrlToBlob(base64Data);
  const signatureRef = ref(storage, `signatures/${userId}/${bookingId}.png`);
  await uploadBytes(signatureRef, blob, { contentType: 'image/png' });
  return getDownloadURL(signatureRef);
}

function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response as Blob);
    xhr.onerror = () => reject(new Error('Impossible de préparer la signature pour l\'envoi.'));
    xhr.responseType = 'blob';
    xhr.open('GET', dataUrl, true);
    xhr.send(null);
  });
}

export async function uploadUserDocument(userId: string, localUri: string, documentType: string) {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const documentRef = ref(storage, `users/${userId}/driver-documents/${documentType}-${Date.now()}.jpg`);

  await uploadBytes(documentRef, blob, {
    contentType: blob.type || 'image/jpeg',
  });

  return getDownloadURL(documentRef);
}

export async function uploadUserProfilePhoto(userId: string, localUri: string) {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const photoRef = ref(storage, `users/${userId}/profile/photo-${Date.now()}.jpg`);

  await uploadBytes(photoRef, blob, {
    contentType: blob.type || 'image/jpeg',
  });

  return getDownloadURL(photoRef);
}

export async function uploadDriverProfilePhoto(userId: string, localUri: string) {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const photoRef = ref(storage, `users/${userId}/driver-profile/photo-${Date.now()}.jpg`);

  await uploadBytes(photoRef, blob, {
    contentType: blob.type || 'image/jpeg',
  });

  return getDownloadURL(photoRef);
}
