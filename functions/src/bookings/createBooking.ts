import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { Request, Response } from 'express';

import { db } from '../firebase';
import { getAuthenticatedUid, sendJson } from '../http';
import type { PaymentMethod } from '../types';

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
  paymentMethod?: PaymentMethod;
  startDate?: string;
  withDriver?: boolean;
};

const PAYMENT_METHODS: PaymentMethod[] = ['MTN MoMo', 'Orange Money', 'Carte bancaire'];

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

function rentalDays(startDate: Date, endDate: Date) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / msPerDay) + 1);
}

function rangesOverlap(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA <= endB && endA >= startB;
}

function toDate(value: unknown) {
  return typeof (value as { toDate?: () => Date })?.toDate === 'function'
    ? (value as { toDate: () => Date }).toDate()
    : new Date(String(value));
}

function assertDriverLicense(value: unknown) {
  const license = value as DriverLicensePayload | undefined;

  if (!license) {
    throw new Error('Permis de conduire requis.');
  }

  const normalized = {
    categories: assertString(license.categories, 'categories').toUpperCase(),
    expiryDate: assertString(license.expiryDate, 'expiryDate'),
    fullName: assertString(license.fullName, 'fullName'),
    issueDate: assertString(license.issueDate, 'issueDate'),
    issuingCountry: assertString(license.issuingCountry, 'issuingCountry'),
    licenseNumber: assertString(license.licenseNumber, 'licenseNumber'),
  };

  if (normalized.fullName.length < 3 || normalized.licenseNumber.length < 5) {
    throw new Error('Informations du permis invalides.');
  }

  const expiryDate = new Date(normalized.expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (Number.isNaN(expiryDate.getTime()) || expiryDate < today) {
    throw new Error('Permis expire ou invalide.');
  }

  return normalized;
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
  const paymentMethod = body.paymentMethod;
  const withDriver = body.withDriver === true;
  const driverLicense = assertDriverLicense(body.driverLicense);

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
      brand?: string;
      city?: string;
      allowIndependentDrivers?: boolean;
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
        driver.driverProfile?.isIndependent === true && car.allowIndependentDrivers === true;

      if (
        driver.role !== 'driver' ||
        (!isOwnerDriver && !isIndependentDriver) ||
        driver.status !== 'active' ||
        driver.kycStatus !== 'approved' ||
        driver.city !== car.city ||
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
    const totalPrice = totalDays * pricePerDay + totalDays * driverPricePerDay;

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
      ownerId: car.ownerId,
      paymentMethod,
      paymentStatus: 'unpaid',
      startDate: Timestamp.fromDate(startDate),
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
