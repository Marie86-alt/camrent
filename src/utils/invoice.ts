import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import type { Booking } from '../types/models';
import { toJsDate } from './firestoreDate';

function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(toJsDate(d));
}

function fmtAmount(n: number): string {
  return `${new Intl.NumberFormat('fr-FR').format(Math.round(n))} FCFA`;
}

function paymentBadge(status: string): string {
  if (status === 'paid') return '<span class="badge badge-paid">Payé</span>';
  if (status === 'pending') return '<span class="badge badge-pending">En attente</span>';
  return '<span class="badge badge-unpaid">Non payé</span>';
}

type InvoiceParams = {
  booking: Booking;
  clientName: string;
  clientEmail: string;
};

function buildInvoiceHtml({ booking, clientName, clientEmail }: InvoiceParams): string {
  const ref = booking.id.slice(0, 8).toUpperCase();
  const issueDate = fmtDate(new Date());
  const start = fmtDate(toJsDate(booking.startDate));
  const end = fmtDate(toJsDate(booking.endDate));
  const driverTotal = (booking.driverPricePerDay ?? 0) * booking.totalDays;
  const carTotal = booking.totalPrice - driverTotal;
  const carPricePerDay = booking.totalDays > 0 ? carTotal / booking.totalDays : 0;
  const licenseHolder = booking.driverLicense?.fullName ?? clientName;

  const driverRow =
    booking.withDriver && booking.driverName
      ? `<tr>
           <td>${booking.driverName}</td>
           <td>${booking.totalDays} j × ${fmtAmount(booking.driverPricePerDay ?? 0)}</td>
           <td class="amount">${fmtAmount(driverTotal)}</td>
         </tr>`
      : '';

  const driverDetailRow =
    booking.withDriver && booking.driverName
      ? `<tr>
           <td style="color:#64748b;font-size:13px">Chauffeur</td>
           <td style="font-weight:600">${booking.driverName}</td>
         </tr>`
      : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Facture Autofix Pro — ${ref}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; font-size:14px; color:#0f172a; background:#fff; padding:40px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:36px; padding-bottom:24px; border-bottom:2px solid #3B63D4; }
    .brand { font-size:26px; font-weight:800; color:#3B63D4; letter-spacing:-0.5px; }
    .brand-sub { font-size:12px; color:#64748b; margin-top:2px; }
    .inv-meta { text-align:right; }
    .inv-label { font-size:20px; font-weight:700; color:#0f172a; letter-spacing:2px; text-transform:uppercase; }
    .inv-ref { font-size:12px; color:#64748b; margin-top:4px; }
    .parties { display:flex; justify-content:space-between; margin-bottom:32px; gap:24px; }
    .party h3 { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#94a3b8; margin-bottom:8px; }
    .party .name { font-weight:700; font-size:16px; color:#0f172a; }
    .party p { font-size:13px; color:#475569; line-height:1.7; }
    .badge { display:inline-block; padding:4px 12px; border-radius:999px; font-size:12px; font-weight:700; }
    .badge-paid { background:#e8f5ec; color:#16a34a; }
    .badge-unpaid { background:#fef2f2; color:#dc2626; }
    .badge-pending { background:#fffbeb; color:#d97706; }
    .section { margin-bottom:28px; }
    .section-title { font-size:12px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:12px; }
    .details-table { width:100%; border-collapse:collapse; }
    .details-table td { padding:9px 0; border-bottom:1px solid #f1f5f9; vertical-align:top; }
    .details-table td:first-child { width:42%; color:#64748b; font-size:13px; }
    .details-table td:last-child { font-weight:600; color:#0f172a; }
    .price-table { width:100%; border-collapse:collapse; border-radius:12px; overflow:hidden; }
    .price-table th { padding:10px 14px; background:#f8fafc; font-size:11px; font-weight:700; color:#64748b; text-align:left; text-transform:uppercase; letter-spacing:0.5px; }
    .price-table th.amount, .price-table td.amount { text-align:right; }
    .price-table td { padding:12px 14px; border-bottom:1px solid #f1f5f9; font-size:14px; }
    .price-table .total-row td { font-weight:800; font-size:16px; color:#3B63D4; background:#EEF2FD; padding:14px; border-bottom:none; }
    .payment-row { display:flex; justify-content:space-between; align-items:center; background:#f8fafc; border-radius:12px; padding:14px 18px; margin-bottom:32px; }
    .payment-row .lbl { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:#94a3b8; }
    .payment-row .val { font-size:14px; font-weight:700; color:#0f172a; }
    .footer { margin-top:40px; padding-top:20px; border-top:1px solid #e2e8f0; text-align:center; color:#94a3b8; font-size:12px; line-height:1.9; }
    .footer strong { color:#64748b; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Autofix Pro</div>
      <div class="brand-sub">Location de voitures au Cameroun</div>
    </div>
    <div class="inv-meta">
      <div class="inv-label">Facture</div>
      <div class="inv-ref">Réf : ${ref}</div>
      <div class="inv-ref">Émise le ${issueDate}</div>
      <div style="margin-top:8px">${paymentBadge(booking.paymentStatus)}</div>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <h3>Client</h3>
      <div class="name">${licenseHolder}</div>
      <p>${clientEmail}</p>
    </div>
    <div class="party" style="text-align:right">
      <h3>Voiture</h3>
      <div class="name">${booking.carBrand ?? ''} ${booking.carModel ?? ''}</div>
      <p>${booking.city ?? ''}</p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Détails de la location</div>
    <table class="details-table">
      <tr>
        <td>Période</td>
        <td>${start} → ${end}</td>
      </tr>
      <tr>
        <td>Durée</td>
        <td>${booking.totalDays} jour${booking.totalDays > 1 ? 's' : ''}</td>
      </tr>
      <tr>
        <td>Ville</td>
        <td>${booking.city ?? '—'}</td>
      </tr>
      ${driverDetailRow}
    </table>
  </div>

  <div class="section">
    <div class="section-title">Détail du prix</div>
    <table class="price-table">
      <thead>
        <tr>
          <th>Désignation</th>
          <th>Calcul</th>
          <th class="amount">Montant</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${booking.carBrand ?? ''} ${booking.carModel ?? ''}</td>
          <td>${booking.totalDays} j × ${fmtAmount(carPricePerDay)}</td>
          <td class="amount">${fmtAmount(carTotal)}</td>
        </tr>
        ${driverRow}
        <tr class="total-row">
          <td colspan="2">Total</td>
          <td class="amount">${fmtAmount(booking.totalPrice)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="payment-row">
    <div>
      <div class="lbl">Mode de paiement</div>
      <div class="val">${booking.paymentMethod}</div>
    </div>
    <div style="text-align:right">
      <div class="lbl">Statut</div>
      <div>${paymentBadge(booking.paymentStatus)}</div>
    </div>
  </div>

  <div class="footer">
    <strong>Autofix Pro</strong> — Plateforme de location de véhicules au Cameroun<br>
    Ce document tient lieu de facture pour la réservation <strong>${ref}</strong>.<br>
    Pour toute réclamation, contactez notre support.
  </div>
</body>
</html>`;
}

export async function shareInvoice(params: InvoiceParams): Promise<void> {
  const html = buildInvoiceHtml(params);
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, {
    UTI: '.pdf',
    mimeType: 'application/pdf',
  });
}
