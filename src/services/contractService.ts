import { doc, Timestamp, updateDoc } from 'firebase/firestore';

import { auth, db } from './firebase';
import { assertOnlineForAction } from './networkGuard';
import type { Booking } from '../types/models';
import { formatFullDate } from '../utils/dates';
import { toJsDate } from '../utils/firestoreDate';

function buildContractRef(bookingId: string) {
  const year = new Date().getFullYear();
  return `CR-${year}-${bookingId.slice(-6).toUpperCase()}`;
}

function getSignContractEndpoint() {
  const explicit = process.env.EXPO_PUBLIC_SIGN_CONTRACT_API_URL;
  if (explicit) return explicit;

  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  return projectId ? `https://us-central1-${projectId}.cloudfunctions.net/signContract` : undefined;
}

function cleanContractError(body: string) {
  try {
    const parsed = JSON.parse(body) as { error?: unknown };
    if (typeof parsed.error === 'string') return parsed.error;
  } catch {
    // Keep raw fallback.
  }

  return body;
}

export async function signContract(booking: Booking, signatureBase64: string): Promise<string> {
  await assertOnlineForAction();

  const endpoint = getSignContractEndpoint();

  if (endpoint) {
    const token = await auth.currentUser?.getIdToken();
    const response = await fetch(endpoint, {
      body: JSON.stringify({
        bookingId: booking.id,
        signatureDataUrl: signatureBase64,
      }),
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(cleanContractError(message) || 'Signature impossible.');
    }

    return signatureBase64;
  }

  await updateDoc(doc(db, 'bookings', booking.id), {
    contractStatus: 'client_signed',
    clientSignatureUrl: signatureBase64,
    contractSignedAt: Timestamp.now(),
    contractRef: buildContractRef(booking.id),
  });

  return signatureBase64;
}

export function buildContractText(booking: Booking, clientName: string): string {
  const ref = booking.contractRef ?? buildContractRef(booking.id);
  const today = formatFullDate(new Date());
  const start = formatFullDate(toJsDate(booking.startDate));
  const end = formatFullDate(toJsDate(booking.endDate));
  const startTime = booking.startTime ?? '08:00';
  const endTime = booking.endTime ?? '18:00';
  const license = booking.driverLicense;

  return `CONTRAT DE LOCATION DE VÉHICULE
Référence : ${ref}
Fait le ${today} à Cameroun

━━━━━━━━━━━━━━━━━━━━━━━━━━
ARTICLE 1 — PARTIES

PROPRIÉTAIRE (bailleur) :
Identifié sur la plateforme Autofix Pro
Référence interne : ${booking.ownerId.slice(-8).toUpperCase()}

LOCATAIRE :
${clientName}
N° permis : ${license?.licenseNumber ?? 'Non requis - location avec chauffeur'}
Catégories : ${license?.categories ?? 'N/A'}
Pays d'émission : ${license?.issuingCountry ?? 'N/A'}
Expiration permis : ${license?.expiryDate ?? 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━
ARTICLE 2 — VÉHICULE LOUÉ

${booking.carBrand ?? 'N/A'} ${booking.carModel ?? ''}
Ville de mise à disposition : ${booking.city ?? 'Cameroun'}
Référence annonce : ${booking.carId.slice(-8).toUpperCase()}

━━━━━━━━━━━━━━━━━━━━━━━━━━
ARTICLE 3 — DURÉE DE LA LOCATION

Début : ${start} à ${startTime}
Fin : ${end} à ${endTime}
Durée totale : ${booking.totalDays} jour${booking.totalDays > 1 ? 's' : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━
ARTICLE 4 — CONDITIONS FINANCIÈRES

Montant total : ${booking.totalPrice.toLocaleString('fr-FR')} FCFA
Méthode de paiement : ${booking.paymentMethod}
Statut paiement : ${booking.paymentStatus === 'paid' ? 'Réglé' : 'En attente de règlement'}

━━━━━━━━━━━━━━━━━━━━━━━━━━
ARTICLE 5 — OBLIGATIONS DU LOCATAIRE

Le locataire s'engage à :
• Utiliser le véhicule conformément à sa destination
• Ne pas sous-louer ni prêter le véhicule à un tiers
• Respecter le code de la route camerounais
• Restituer le véhicule à la date et heure convenues
• Restituer le véhicule dans l'état dans lequel il a été remis
• Signaler immédiatement tout accident, panne ou dommage
• Ne pas conduire sous l'emprise de l'alcool ou de substances

━━━━━━━━━━━━━━━━━━━━━━━━━━
ARTICLE 6 — RESPONSABILITÉS ET ASSURANCES

Le locataire est responsable de toute infraction commise pendant la période de location. En cas d'accident, les dommages non couverts par l'assurance restent à la charge du locataire. Le propriétaire atteste que le véhicule est assuré conformément à la législation camerounaise.

━━━━━━━━━━━━━━━━━━━━━━━━━━
ARTICLE 7 — RESTITUTION

Le véhicule devra être restitué au lieu convenu avec le propriétaire, dans le même état général (carburant, propreté, absence de dommages nouveaux). Tout retard non notifié à l'avance sera facturé à la journée supplémentaire.

━━━━━━━━━━━━━━━━━━━━━━━━━━
ARTICLE 8 — DROIT APPLICABLE

Le présent contrat est régi par le droit camerounais et les dispositions de l'OHADA relatives aux contrats de location. Tout litige sera soumis à la juridiction compétente du lieu de location.

━━━━━━━━━━━━━━━━━━━━━━━━━━
ARTICLE 9 — SIGNATURE ÉLECTRONIQUE

En apposant sa signature numérique ci-dessous, le locataire reconnaît avoir lu et accepté les présentes conditions. La signature électronique a valeur contractuelle conformément aux dispositions légales en vigueur.`;
}
