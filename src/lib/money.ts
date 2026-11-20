/** Money helpers — all amounts are integer paise. */

export function formatINR(paise: number, opts?: { compact?: boolean }): string {
  const rupees = paise / 100;
  if (opts?.compact && rupees >= 100000) return `₹${(rupees / 100000).toFixed(2)}L`;
  if (opts?.compact && rupees >= 1000) return `₹${(rupees / 1000).toFixed(1)}k`;
  return `₹${rupees.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function discountPercent(price: number, original?: number | null): number | null {
  if (!original || original <= price) return null;
  return Math.round(((original - price) / original) * 100);
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatHours(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  const visible = name.slice(0, Math.min(4, Math.max(1, name.length - 3)));
  return `${visible}${"*".repeat(Math.max(3, name.length - visible.length))}@${domain}`;
}
