export function timeAgoCkb(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "ئێستا";
  if (minutes < 60) return `${minutes} خولەک`;
  if (hours < 24) return `${hours} کاتژمێر`;
  if (days < 30) return `${days} ڕۆژ`;
  return new Date(iso).toLocaleDateString("ckb-IQ");
}
