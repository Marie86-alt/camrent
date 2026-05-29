export function formatFcfa(amount: number) {
  return `${new Intl.NumberFormat('fr-FR').format(Math.round(amount))} FCFA`;
}
