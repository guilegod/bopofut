export function buildMapsQuery(court) {
  const hasCoords =
    court?.lat != null &&
    court?.lng != null &&
    !Number.isNaN(Number(court.lat)) &&
    !Number.isNaN(Number(court.lng));

  if (hasCoords) {
    const lat = Number(court.lat);
    const lng = Number(court.lng);
    return { q: `${lat},${lng}`, label: `${lat}, ${lng}`, hasCoords: true };
  }

  const address = String(court?.address || "").trim();
  const city = String(court?.city || "").trim();
  const q = address ? `${address}${city ? `, ${city}` : ""}` : court?.name || "";
  return { q, label: q, hasCoords: false };
}

export function buildMapsUrls(court) {
  const { q } = buildMapsQuery(court);
  const encoded = encodeURIComponent(q);
  return {
    embed: `https://www.google.com/maps?q=${encoded}&z=16&output=embed`,
    open: `https://www.google.com/maps?q=${encoded}&z=16`,
  };
}

export function safeNow() {
  return Date.now();
}

export function minutesLeft(expiresAt) {
  if (!expiresAt) return null;
  const diff = Number(expiresAt) - safeNow();
  if (Number.isNaN(diff)) return null;
  return Math.max(0, Math.ceil(diff / 60000));
}
