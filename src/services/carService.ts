import { addDoc, collection, deleteDoc, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';

import { db } from './firebase';
import type { Car } from '../types/models';

export type CreateCarPayload = Omit<Car, 'id'>;

export type UpdateCarPayload = Partial<
  Pick<
    Car,
    | 'adminStatus'
    | 'allowIndependentDrivers'
    | 'brand'
    | 'city'
    | 'description'
    | 'documentsVerified'
    | 'fuelType'
    | 'imageUrl'
    | 'imageUrls'
    | 'isAvailable'
    | 'model'
    | 'pricePerDay'
    | 'seats'
    | 'technicalSheet'
    | 'transmission'
    | 'year'
  >
>;

export function subscribeToAvailableCars(onData: (cars: Car[]) => void, onError: () => void) {
  const carsQuery = query(collection(db, 'cars'), where('isAvailable', '==', true));

  return onSnapshot(
    carsQuery,
    (snapshot) => onData(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Car)),
    onError,
  );
}

export function subscribeToAllCars(onData: (cars: Car[]) => void, onError: () => void) {
  return onSnapshot(
    collection(db, 'cars'),
    (snapshot) => onData(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Car)),
    onError,
  );
}

export function subscribeToOwnerCars(ownerId: string, onData: (cars: Car[]) => void, onError: () => void) {
  const carsQuery = query(collection(db, 'cars'), where('ownerId', '==', ownerId));

  return onSnapshot(
    carsQuery,
    (snapshot) => onData(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Car)),
    onError,
  );
}

export function createCar(payload: CreateCarPayload) {
  return addDoc(collection(db, 'cars'), payload);
}

export function updateCar(carId: string, payload: UpdateCarPayload) {
  return updateDoc(doc(db, 'cars', carId), payload);
}

export function setCarAvailability(carId: string, isAvailable: boolean) {
  return updateDoc(doc(db, 'cars', carId), { isAvailable });
}

export function deleteCar(carId: string) {
  return deleteDoc(doc(db, 'cars', carId));
}
