# Mémo — Tester un vrai paiement Campay (Autofix Pro)

> Basé sur l'intégration réelle du projet : la fonction `mobileMoneyPayment` crée un
> lien Campay, et la fonction `campayWebhook` reçoit la confirmation et passe la
> réservation à `paymentStatus: 'paid'` dans Firestore.

---

## 1. Comment marche un paiement dans ton app (le flux à tester)

```
App (PaymentScreen)
   │  POST  EXPO_PUBLIC_PAYMENTS_API_URL  → Cloud Function "mobileMoneyPayment"
   ▼
Cloud Function "mobileMoneyPayment"
   │  1. s'authentifie chez Campay : POST /api/token/  (username + password)
   │  2. crée un paiement : POST /api/get_payment_link/
   │  3. marque la réservation paymentStatus = 'pending'  (markBookingPaymentPending)
   ▼
Le client valide sur son téléphone (MTN MoMo / Orange Money)
   │
   ▼
Campay appelle ton webhook  → Cloud Function "campayWebhook"
   │  vérifie le statut → met la réservation paymentStatus = 'paid'  (+ enregistre le paiement)
   ▼
Firestore : booking.paymentStatus = 'paid'   ✅  (visible client + proprio + admin)
```

**Le test réussit quand** : après paiement, la réservation passe à `paid` dans Firestore
**automatiquement** (grâce au webhook), sans action manuelle.

---

## 2. Ce qu'il te faut obtenir chez Campay

1. **Un compte Campay** sur https://www.campay.net (compte marchand).
2. **Un compte démo/sandbox** sur https://demo.campay.net pour tester SANS argent réel.
   → C'est ici qu'on teste en premier.
3. Dans le tableau de bord Campay, créer une **Application** pour récupérer :
   - **App Username** → variable `CAMPAY_APP_USERNAME`
   - **App Password** → variable `CAMPAY_APP_PASSWORD`
4. Les **numéros de test** fournis par le sandbox Campay (numéros MTN/Orange fictifs qui
   simulent un paiement réussi ou échoué). À récupérer dans la doc/dashboard démo Campay.
5. Pour la prod : ton **compte marchand validé** (KYC entreprise) pour encaisser réellement.

---

## 3. Variables à configurer

Côté **Cloud Functions** (fichier `functions/.env` ou config Firebase) :

| Variable | Pour le TEST (démo) | Pour la PROD |
|---|---|---|
| `CAMPAY_APP_USERNAME` | username de l'app démo | username de l'app prod |
| `CAMPAY_APP_PASSWORD` | password de l'app démo | password de l'app prod |
| `CAMPAY_BASE_URL` | `https://demo.campay.net` | `https://www.campay.net` |
| `CAMPAY_REDIRECT_URL` | une URL de succès (ex. page web simple) | idem prod |
| `CAMPAY_FAILURE_REDIRECT_URL` | une URL d'échec | idem prod |
| `CAMPAY_WEBHOOK_URL` | l'URL déployée de `campayWebhook` (voir §4) | idem prod |
| `CAMPAY_WEBHOOK_SECRET` | un secret aléatoire que tu choisis | un autre secret |

Côté **App Expo** (fichier `.env`) :

| Variable | Valeur |
|---|---|
| `EXPO_PUBLIC_PAYMENTS_API_URL` | l'URL déployée de la fonction `mobileMoneyPayment` |

> ⚠️ C'est ce qui désactive le « mode démo » (`CMR-...`) du `paymentService.ts` : tant que
> cette URL n'est pas branchée sur la vraie fonction, l'app simule le paiement.

---

## 4. Configurer le webhook (l'étape qu'on oublie toujours)

1. **Déployer les functions** : `cd functions && npm run deploy` (ou `firebase deploy --only functions`).
2. Récupérer l'URL publique de la fonction `campayWebhook` (affichée après le déploiement,
   du type `https://<region>-<projet>.cloudfunctions.net/campayWebhook`).
3. Dans le **dashboard Campay → Webhooks**, coller cette URL comme URL de notification.
4. Mettre la **même URL** dans `CAMPAY_WEBHOOK_URL` et redéployer si besoin.

**Sans cette étape, le paiement se fait mais la réservation reste bloquée sur `pending`**
(le webhook est ce qui la passe à `paid`).

---

## 5. Procédure de test (étape par étape)

### Phase A — Sandbox (aucun argent réel)
1. Mettre `CAMPAY_BASE_URL=https://demo.campay.net` + les identifiants démo.
2. Déployer les functions + configurer le webhook démo.
3. Brancher `EXPO_PUBLIC_PAYMENTS_API_URL` sur la fonction `mobileMoneyPayment`.
4. Dans l'app : créer une réservation → payer avec un **numéro de test Campay**.
5. **Vérifier dans Firestore** que la réservation passe `pending` → `paid` toute seule.
6. Tester aussi un **numéro qui échoue** → la réservation doit rester `unpaid`/`failed`.

### Phase B — Production (petit montant réel)
1. Passer `CAMPAY_BASE_URL=https://www.campay.net` + identifiants prod + webhook prod.
2. Faire **un vrai paiement d'un petit montant** (ex. 100–500 FCFA) avec ton propre numéro.
3. Vérifier : réservation `paid` + l'argent arrive sur ton compte marchand Campay.
4. Tester un remboursement/annulation pour valider `refundStatus`.

---

## 6. Comment vérifier que ça marche (checklist)

- [ ] L'app ne montre plus la référence démo `CMR-...` mais une vraie référence Campay.
- [ ] La réservation passe `pending` puis `paid` **sans intervention manuelle**.
- [ ] Le document `payments` est créé dans Firestore avec le bon statut.
- [ ] Un paiement échoué laisse la réservation **non payée** (pas de faux positif).
- [ ] Le proprio et l'admin voient bien le paiement encaissé.
- [ ] L'argent réel arrive sur le compte marchand (phase B).

---

## 7. Pièges fréquents

| Symptôme | Cause probable |
|---|---|
| Réservation reste sur `pending` | Webhook non configuré ou mauvaise `CAMPAY_WEBHOOK_URL` |
| L'app simule encore (`CMR-...`) | `EXPO_PUBLIC_PAYMENTS_API_URL` non branché sur la vraie fonction |
| `Missing environment variable: CAMPAY_APP_PASSWORD` | Variables non chargées côté functions / pas redéployé |
| 401 chez Campay | Mauvais username/password, ou identifiants démo utilisés en prod (ou l'inverse) |
| Webhook reçu mais rien ne change | `CAMPAY_WEBHOOK_SECRET` différent entre Campay et tes functions |
| Montant rejeté | Format du montant (Campay attend un entier en XAF, pas de décimales) |

---

## 8. Important — argent réel

Ne teste la **phase B (prod)** qu'avec de **petits montants sur ton propre numéro**.
Ne demande jamais à un tiers d'envoyer de l'argent pour un test. Garde une trace de
chaque transaction de test pour la rapprocher de ton tableau de bord Campay.
