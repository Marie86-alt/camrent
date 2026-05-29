# CamRent

Application Expo React Native en TypeScript pour une plateforme de location de voitures au Cameroun.

## Stack

- Expo + React Native + TypeScript
- Firebase Auth, Firestore et Storage
- React Navigation v6
- Zustand
- NativeWind

## Structure principale

```text
src/
  screens/
    auth/
    client/
    owner/
  components/
  navigation/
  services/
  hooks/
  store/
  utils/
```

## Configuration Firebase

1. Creez un projet Firebase.
2. Activez Email/Password dans Authentication.
3. Creez Firestore et Storage.
4. Copiez `.env.example` vers `.env` et renseignez les valeurs Firebase.
5. Deployeez les regles:

```bash
firebase deploy --only firestore:rules,storage
```

## Exemple de document `cars`

```json
{
  "ownerId": "uid-proprietaire",
  "brand": "Toyota",
  "model": "RAV4",
  "year": 2021,
  "city": "Douala",
  "pricePerDay": 35000,
  "imageUrl": "https://example.com/rav4.jpg",
  "seats": 5,
  "transmission": "Automatique",
  "fuelType": "Essence",
  "isAvailable": true,
  "description": "SUV confortable pour ville et route."
}
```

Les prix sont calcules en FCFA, les numeros sont valides au format `+237XXXXXXXXX`, et les paiements proposes sont MTN MoMo et Orange Money.

## Paiements Orange Money / MTN MoMo

Les APIs operateurs doivent etre appelees depuis un backend CamRent, pas directement depuis Expo. Le contrat mobile/backend est documente dans `docs/payments-api.md`.

Le dossier `functions/` contient maintenant:

- `mobileMoneyPayment`: endpoint appele par l'app mobile.
- `mtnMomoWebhook`: callback MTN MoMo.
- `orangeMoneyWebhook`: callback Orange Money.
