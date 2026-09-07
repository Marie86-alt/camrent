import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { Request, Response } from 'express';

import { db } from '../firebase';
import { getAuthenticatedUid, sendJson } from '../http';
import type { PaymentMethod } from '../types';
import { assertDriverLicense, calculateTotalPrice, rangesOverlap, rentalDays } from './createBookingLogic';

type DriverLicensePayload = {
  categories?: string;
  expiryDate?: string;
  fullName?: string;
  issueDate?: string;
  issuingCountry?: string;
  licenseNumber?: string;
};

type CreateBookingRequest = {
  carId?: string;
  driverId?: string;
  driverLicense?: DriverLicensePayload;
  endDate?: string;
  endTime?: string;
  paymentMethod?: PaymentMethod;
  startDate?: string;
  startTime?: string;
  withDriver?: boolean;
};

const PAYMENT_METHODS: PaymentMethod[] = ['MTN MoMo', 'Orange Money', 'Carte bancaire'];

function normalizeCity(city: string) {
  return city.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

function assertString(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field} est requis.`);
  }
  return value.trim();
}

function parseDate(value: unknown, field: string) {
  const raw = assertString(value, field);
  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${field} est invalide.`);
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

function parseTime(value: unknown, fallback: string, field: string) {
  if (value === undefined || value === null || value === '') return fallback;

  const raw = assertString(value, field);

  if (!/^\d{2}:\d{2}$/.test(raw)) {
    throw new Error(`${field} est invalide.`);
  }

  const [hours, minutes] = raw.split(':').map(Number);

  if (hours > 23 || minutes > 59) {
    throw new Error(`${field} est invalide.`);
  }

  return raw;
}

function toDate(value: unknown) {
  return typeof (value as { toDate?: () => Date })?.toDate === 'function'
    ? (value as { toDate: () => Date }).toDate()
    : new Date(String(value));
}


export async function handleCreateBooking(request: Request, response: Response) {
  const uid = await getAuthenticatedUid(request);
  if (!uid) {
    sendJson(response, 401, { error: 'Unauthorized' });
    return;
  }

  const body = request.body as CreateBookingRequest;
  const carId = assertString(body.carId, 'carId');
  const startDate = parseDate(body.startDate, 'startDate');
  const endDate = parseDate(body.endDate, 'endDate');
  const startTime = parseTime(body.startTime, '08:00', 'startTime');
  const endTime = parseTime(body.endTime, '18:00', 'endTime');
  const paymentMethod = body.paymentMethod;
  const withDriver = body.withDriver === true;
  const driverLicense = withDriver ? null : assertDriverLicense(body.driverLicense);

  if (!paymentMethod || !PAYMENT_METHODS.includes(paymentMethod)) {
    throw new Error('Methode de paiement invalide.');
  }

  if (endDate < startDate) {
    throw new Error('La date de fin doit etre apres la date de debut.');
  }

  const carRef = db.collection('cars').doc(carId);
  const bookingRef = db.collection('bookings').doc();
  const totalDays = rentalDays(startDate, endDate);

  const result = await db.runTransaction(async (transaction) => {
    const carSnapshot = await transaction.get(carRef);

    if (!carSnapshot.exists) {
      throw new Error('Vehicule introuvable.');
    }

    const car = carSnapshot.data() as {
      adminStatus?: string;
      allowIndependentDrivers?: boolean;
      blockedDates?: string[];
      brand?: string;
      city?: string;
      isAvailable?: boolean;
      model?: string;
      ownerId?: string;
      pricePerDay?: number;
    };

    if (!car.isAvailable || car.adminStatus !== 'approved') {
      throw new Error('Ce vehicule n est pas disponible.');
    }

    const conflictsQuery = db
      .collection('bookings')
      .where('carId', '==', carId)
      .where('status', 'in', ['pending', 'confirmed']);
    const conflictsSnapshot = await transaction.get(conflictsQuery);
    const hasConflict = conflictsSnapshot.docs.some((doc) => {
      const booking = doc.data();
      return rangesOverlap(startDate, endDate, toDate(booking.startDate), toDate(booking.endDate));
    });

    if (hasConflict) {
      throw new Error('Ce vehicule est deja reserve sur ces dates.');
    }

    if (!isAvailableForDates(car.blockedDates, startDate, endDate)) {
      throw new Error('Ce vehicule n est pas disponible sur ces dates (maintenance ou usage personnel).');
    }

    let driverFields: Record<string, unknown> = {};
    let driverPricePerDay = 0;

    if (withDriver) {
      const driverId = assertString(body.driverId, 'driverId');
      const driverRef = db.collection('users').doc(driverId);
      const driverSnapshot = await transaction.get(driverRef);

      if (!driverSnapshot.exists) {
        throw new Error('Chauffeur introuvable.');
      }

      const driver = driverSnapshot.data() as {
        city?: string;
        driverProfile?: { isAvailable?: boolean; isIndependent?: boolean; pricePerDay?: number; profilePhotoUrl?: string; blockedDates?: string[] };
        fullName?: string;
        kycStatus?: string;
        ownerId?: string;
        role?: string;
        status?: string;
      };

      const isOwnerDriver = driver.ownerId === car.ownerId;
      const isIndependentDriver =
        driver.driverProfile?.isIndependent === true && car.allowIndependentDrivers !== false;

      if (
        driver.role !== 'driver' ||
        (!isOwnerDriver && !isIndependentDriver) ||
        driver.status !== 'active' ||
        driver.kycStatus !== 'approved' ||
        normalizeCity(driver.city ?? '') !== normalizeCity(car.city ?? '') ||
        driver.driverProfile?.isAvailable !== true ||
        !isAvailableForDates(driver.driverProfile?.blockedDates, startDate, endDate)
      ) {
        throw new Error('Ce chauffeur n est pas disponible pour ce vehicule.');
      }

      driverPricePerDay = Number(driver.driverProfile?.pricePerDay ?? 0);
      driverFields = {
        driverId,
        driverName: driver.fullName ?? '',
        driverPricePerDay,
        ...(driver.driverProfile?.profilePhotoUrl ? { driverPhotoUrl: driver.driverProfile.profilePhotoUrl } : {}),
      };
    }

    const pricePerDay = Number(car.pricePerDay ?? 0);
    const totalPrice = calculateTotalPrice(pricePerDay, driverPricePerDay, totalDays);

    if (!Number.isFinite(totalPrice) || totalPrice <= 0) {
      throw new Error('Prix de reservation invalide.');
    }

    transaction.set(bookingRef, {
      carBrand: car.brand ?? '',
      carId,
      carModel: car.model ?? '',
      city: car.city ?? '',
      clientId: uid,
      createdAt: FieldValue.serverTimestamp(),
      driverLicense,
      endDate: Timestamp.fromDate(endDate),
      endTime,
      ownerId: car.ownerId,
      paymentMethod,
      paymentStatus: 'unpaid',
      startDate: Timestamp.fromDate(startDate),
      startTime,
      status: 'pending',
      totalDays,
      totalPrice,
      withDriver,
      ...driverFields,
    });

    return { bookingId: bookingRef.id, totalDays, totalPrice };
  });

  sendJson(response, 201, result);
}

function isAvailableForDates(blockedDates: unknown, startDate: Date, endDate: Date) {
  if (!Array.isArray(blockedDates) || blockedDates.length === 0) return true;

  const blocked = new Set(blockedDates.filter((item): item is string => typeof item === 'string'));
  const current = new Date(startDate);

  while (current <= endDate) {
    if (blocked.has(current.toISOString().slice(0, 10))) return false;
    current.setDate(current.getDate() + 1);
  }

  return true;
}
