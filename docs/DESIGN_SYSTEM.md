# Autofix Pro — Design System

> Direction : **Premium Trust** — épuré, confiant, généreux en espace. Une app de
> location de voiture manipule de l'argent : la priorité est la **confiance** et la
> **clarté**, avec une touche premium chaleureuse (Afrique). Optimisé pour Android
> milieu de gamme (pas de glassmorphism lourd).

---

## 1. Couleurs

### Primaire — Bleu (confiance, professionnalisme)
Conserve le `brand-blue` déjà présent dans le code (`#3B63D4`) comme `primary-600`.

| Token | Hex | Usage |
|---|---|---|
| primary-50  | `#EEF2FD` | fonds très clairs, états sélectionnés |
| primary-100 | `#D8E1FB` | fonds de badges/chips |
| primary-500 | `#5277E0` | hover/pressed clair |
| **primary-600** | **`#3B63D4`** | **boutons principaux, liens, actif** |
| primary-700 | `#2E4FB0` | pressed |
| primary-900 | `#1B2E66` | textes sur fond clair (accent fort) |

### Accent — Ambre (énergie, chaleur africaine, rappel du logo)
| Token | Hex | Usage |
|---|---|---|
| accent-50  | `#FFF7ED` | fonds promo/highlight |
| accent-500 | `#F59E0B` | badges premium, étoiles, mises en avant |
| accent-600 | `#E8900A` | CTA secondaires chaleureux |

### Neutres — Slate (déjà utilisé via NativeWind)
`slate-50 → slate-950`. Texte principal `#0F172A` (slate-900), texte secondaire
`#475569` (slate-600), bordures `#E2E8F0` (slate-200), fond app `#F8FAFC` (slate-50).

### Sémantiques (états)
| Rôle | Hex | Fond clair |
|---|---|---|
| Succès | `#16A34A` | `#E8F5EC` |
| Avertissement | `#D97706` | `#FFFBEB` |
| Erreur | `#DC2626` | `#FEF2F2` |
| Info | `#0077B6` | `#E0F0FA` |

**Règle de contraste :** texte sur fond clair toujours ≥ 4.5:1. Jamais de gris < slate-500 pour du texte de contenu.

---

## 2. Typographie

**Police : Inter** (gratuite, variable, excellente sur Android). Chargée via `expo-font`.
Option premium pour les gros titres : **Sora** (headings) — sinon Inter partout.

| Style | Police / Poids | Taille / Interligne | Usage |
|---|---|---|---|
| Display | Sora / 700 | 32 / 38 | Titres d'accueil, montants FCFA héro |
| H1 | Inter / 800 | 24 / 30 | Titres d'écran |
| H2 | Inter / 700 | 20 / 26 | Sections |
| H3 | Inter / 600 | 17 / 24 | Cartes, sous-sections |
| Body | Inter / 400 | 15 / 22 | Texte courant |
| Body-strong | Inter / 600 | 15 / 22 | Mises en avant |
| Caption | Inter / 500 | 13 / 18 | Labels, métadonnées |
| Overline | Inter / 700 | 11 / 14 (lettre +1) | Étiquettes uppercase |

Max **3 graisses par écran**. Interligne 1.4–1.5 pour le corps.

---

## 3. Espacement — grille 8pt

`2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64`. Padding écran standard : **16**.
Padding interne carte : **16**. Gap entre cartes : **12**. Section : **24–32**.

---

## 4. Rayons & profondeur

| Rayon | px | Usage |
|---|---|---|
| sm | 8 | inputs, chips |
| md | 12 | boutons |
| lg | 16 | cartes |
| xl | 24 | bottom sheets, modales |
| full | 999 | avatars, pastilles |

**Ombres (douces, jamais dures) — 3 niveaux :**
- e1 (cartes) : `opacity 0.06, radius 6, y 2, elevation 2`
- e2 (éléments flottants) : `opacity 0.10, radius 12, y 4, elevation 4`
- e3 (bottom sheet) : `opacity 0.16, radius 24, y -2, elevation 12`

---

## 5. Composants — specs

### Bouton
- Hauteur **52**, rayon **md (12)**, texte 16/600, plein largeur par défaut.
- Variantes : `primary` (fond primary-600, texte blanc), `secondary` (fond slate-100,
  texte slate-900), `ghost` (transparent, texte primary-600), `danger` (fond error).
- **Press : scale 0.97 + opacité 0.9 (Reanimated, 120ms).** État `loading` = spinner +
  bouton désactivé. État `disabled` = opacité 0.5.

### Carte (voiture, réservation, chauffeur)
- Fond blanc, rayon **lg (16)**, ombre **e1**, padding **16**.
- Image ratio constant 16:10, coins arrondis, **placeholder blurhash** au chargement.
- Tap : ripple léger + scale 0.98.

### Input
- Hauteur **52**, rayon **sm (8)**, bordure slate-200, fond blanc.
- Focus : bordure primary-600 + halo léger. Erreur : bordure error + message dessous.
- Label overline au-dessus, `keyboardType` adapté (numeric pour prix/téléphone).

### Badge / Chip
- Hauteur 24, rayon full, texte 11/700. Couleur selon contexte (primary, accent,
  succès, etc.). Ex. : « Indépendant », « Documents vérifiés », statut réservation.

### Bottom sheet (remplace les Alert d'action)
- Rayon haut **xl (24)**, poignée grise centrée, ombre **e3**, fond blanc.
- Actions empilées, action destructive en `error`.

### Toast / Snackbar (remplace les Alert d'info)
- Flottant en bas, rayon md, fond slate-900 (texte blanc) ou couleur sémantique.
- Auto-dismiss 3 s, slide + fade (Reanimated). Icône à gauche.

### Empty state (chaque liste vide)
- Illustration/icône centrée (96px), titre H3, sous-texte body slate-600, **bouton CTA**.
- Ex. : « Aucune réservation pour le moment » + bouton « Explorer les voitures ».

### Skeleton
- Migrer `CarCardSkeleton` vers **Reanimated** (shimmer). Skeletons aussi pour
  réservations, chauffeurs, dashboard.

---

## 6. Mouvement & retour haptique

- **Durées :** 120ms (press), 200–300ms (transitions/entrées), spring pour succès.
- **Entrée de liste :** fade + slide-up 8px, décalage 30ms par item (Reanimated).
- **Haptique (`expo-haptics`) :** `Light` au tap des cartes, `Success` à la réservation
  confirmée / paiement réussi, `Warning` sur erreur.
- Respecter `prefers-reduced-motion` / réglage système (désactiver si réduit).

---

## 7. Iconographie & images
- **Ionicons** (déjà utilisé) — tailles cohérentes : 18 (inline), 22 (tab), 24 (action).
  Jamais d'emoji comme icône.
- Images voitures : `expo-image` (cache + blurhash), ratio 16:10 constant.

---

## 8. Accessibilité
- Cibles tactiles **≥ 44×44**. `accessibilityLabel` sur tout bouton icône.
- Contraste texte ≥ 4.5:1. La couleur n'est jamais le seul indicateur (icône + texte).
- `SafeAreaView` partout, pas de contenu sous la status bar / encoche.

---

## 9. Tokens NativeWind (à mettre dans tailwind.config.js)

```js
theme: {
  extend: {
    colors: {
      primary: { 50:'#EEF2FD',100:'#D8E1FB',500:'#5277E0',600:'#3B63D4',700:'#2E4FB0',900:'#1B2E66' },
      accent:  { 50:'#FFF7ED',500:'#F59E0B',600:'#E8900A' },
      success: '#16A34A', warning: '#D97706', danger: '#DC2626', info: '#0077B6',
    },
    borderRadius: { sm:'8px', md:'12px', lg:'16px', xl:'24px' },
    fontFamily: { sans:['Inter'], display:['Sora'] },
  },
}
```
