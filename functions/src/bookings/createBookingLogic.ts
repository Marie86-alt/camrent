type DriverLicensePayload = {
  categories?: string;
  expiryDate?: string;
  fullName?: string;
  issueDate?: string;
  issuingCountry?: string;
  licenseNumber?: string;
};

function assertString(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field} est requis.`);
  }
  return value.trim();
}

export function rangesOverlap(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA <= endB && endA >= startB;
}

export function rentalDays(startDate: Date, endDate: Date) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / msPerDay) + 1);
}

export function calculateTotalPrice(
  pricePerDay: number,
  driverPricePerDay: number,
  totalDays: number,
) {
  return totalDays * pricePerDay + totalDays * driverPricePerDay;
}

export function assertDriverLicense(value: unknown) {
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
