# API paiements Campay

L'app Expo n'appelle jamais directement Campay, Orange Money, MTN MoMo ou un prestataire carte bancaire. Elle appelle un backend Autofix Pro/CamRent, qui garde les secrets de paiement et met a jour Firestore avec l'Admin SDK.

## Endpoint mobile

Firebase Functions expose les endpoints deployes sous la forme:

- `mobileMoneyPayment`
- `campayWebhook`

En production, `EXPO_PUBLIC_PAYMENTS_API_URL` doit pointer vers l'URL HTTPS de `mobileMoneyPayment`. Cette fonction cree un lien de paiement Campay avec `payment_options` adapte a la methode choisie.

`POST /payments/mobile-money`

Payload envoye par l'app:

```json
{
  "bookingId": "booking-id",
  "amount": 35000,
  "currency": "XAF",
  "phone": "+237699000001",
  "method": "MTN MoMo",
  "provider": "mtn-momo"
}
```

Providers acceptes:

- `mtn-momo`
- `orange-money`
- `card`

Reponse attendue:

```json
{
  "reference": "CMR-123456789",
  "status": "pending",
  "checkoutUrl": "https://optional-provider-url"
}
```

## Responsabilites backend

1. Verifier que l'utilisateur authentifie possede la reservation.
2. Recharger la reservation depuis Firestore.
3. Refuser le paiement si `paymentStatus` n'est pas `unpaid` ou `failed`.
4. Ignorer le montant envoye par le client et utiliser `booking.totalPrice`.
5. Creer un lien de paiement Campay selon `provider`.
6. Enregistrer une transaction dans `payments/{paymentId}`.
7. Mettre `bookings/{bookingId}.paymentStatus` a `pending`.
8. Recevoir le webhook/callback Campay.
9. Passer `paymentStatus` a `paid` ou `failed`.
10. Passer la reservation a `confirmed` uniquement apres paiement valide.

## Variables serveur

Ces variables doivent rester cote backend uniquement:

```env
CAMPAY_APP_USERNAME=
CAMPAY_APP_PASSWORD=
CAMPAY_BASE_URL=https://demo.campay.net
CAMPAY_REDIRECT_URL=
CAMPAY_FAILURE_REDIRECT_URL=
CAMPAY_WEBHOOK_URL=https://your-functions-url/campayWebhook
CAMPAY_WEBHOOK_SECRET=

MTN_MOMO_COLLECTION_BASE_URL=https://sandbox.momodeveloper.mtn.com/collection
MTN_MOMO_CALLBACK_URL=https://your-functions-url/mtnMomoWebhook
MTN_MOMO_SUBSCRIPTION_KEY=
MTN_MOMO_SECONDARY_SUBSCRIPTION_KEY=
MTN_MOMO_API_USER=
MTN_MOMO_API_KEY=
MTN_MOMO_WEBHOOK_SECRET=

ORANGE_MONEY_TOKEN_URL=
ORANGE_MONEY_PAYMENT_URL=
ORANGE_MONEY_CALLBACK_URL=https://your-functions-url/orangeMoneyWebhook
ORANGE_MONEY_CLIENT_ID=
ORANGE_MONEY_CLIENT_SECRET=
ORANGE_MONEY_MERCHANT_KEY=
ORANGE_MONEY_WEBHOOK_SECRET=

CARD_PAYMENT_URL=
CARD_PAYMENT_SECRET=

MOBILE_MONEY_ENV=sandbox
```

## Endpoints webhooks

### Campay

`POST /campayWebhook`

Campay peut renvoyer la reference interne `external_reference` ou sa propre `reference`. Le backend retrouve la transaction, puis normalise:

- `SUCCESSFUL` -> `paymentStatus: paid`, `status: confirmed`
- `FAILED` -> `paymentStatus: failed`

Si `CAMPAY_WEBHOOK_SECRET` est defini, le webhook doit envoyer le header:

```txt
x-camrent-webhook-secret: votre-secret
```

### MTN MoMo

`POST /mtnMomoWebhook`

Le provider MTN envoie une notification asynchrone apres `requestToPay`. Le backend normalise:

- `SUCCESSFUL` -> `paymentStatus: paid`, `status: confirmed`
- `FAILED` -> `paymentStatus: failed`

### Orange Money

`POST /orangeMoneyWebhook`

Le format exact du callback depend du contrat/produit Orange fourni au marchand. Le handler accepte les references communes `reference`, `payToken` ou `order_id`, et normalise les statuts `success`, `paid`, `completed`, `failed`, `cancelled`, `expired`.

## Commandes backend

```bash
cd functions
npm install
npm run typecheck
npm run build
```

Puis depuis la racine:

```bash
firebase deploy --only functions,firestore:rules,storage
```

## Variables app Expo

L'app Expo ne recoit que l'URL publique du backend:

```env
EXPO_PUBLIC_PAYMENTS_API_URL=https://your-backend.example.com/payments/mobile-money
```
