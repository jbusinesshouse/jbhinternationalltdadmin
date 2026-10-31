export function formatBdt(amount: number | string | null | undefined): string {
  const n = Number(amount) || 0;
  const rounded = Math.round(n * 100) / 100;
  const isInt = Math.abs(rounded - Math.round(rounded)) < 0.001;
  return `৳${rounded.toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: isInt ? 0 : 2,
  })}`;
}

export function formatNumber(n: number | null | undefined): string {
  return (Number(n) || 0).toLocaleString("en-BD");
}

/**
 * Several tables use `timestamp without time zone` written in UTC; treat a
 * zone-less value as UTC so it renders in the admin's local time correctly.
 */
function toDate(value: string): Date {
  const hasZone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(value);
  return new Date(hasZone ? value : `${value.replace(" ", "T")}Z`);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = toDate(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = toDate(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(value: string | null | undefined): string {
  if (!value) return "—";
  const d = toDate(value);
  const diff = Date.now() - d.getTime();
  if (Number.isNaN(diff)) return "—";
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}

export function daysLeft(endsAt: string | null | undefined): number | null {
  if (!endsAt) return null;
  return Math.ceil((toDate(endsAt).getTime() - Date.now()) / 86_400_000);
}

export function displayName(
  p: { store_name?: string | null; full_name?: string | null } | null | undefined
): string {
  return p?.store_name || p?.full_name || "Unknown user";
}

export function titleCase(value: string | null | undefined): string {
  if (!value) return "—";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function shortId(id: string | null | undefined): string {
  return id ? id.slice(0, 8) : "—";
}
