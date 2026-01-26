const KEY = "bopofut_availability_v1";

// availability[courtId] = {
//   slotMinutes: 60,
//   days: {
//     0: { enabled: false, open: "09:00", close: "23:00" }, // Dom
//     1: { enabled: true,  open: "09:00", close: "23:00" }, // Seg
//     2: { enabled: true,  open: "09:00", close: "23:00" }, // Ter
//     3: { enabled: true,  open: "09:00", close: "23:00" }, // Qua
//     4: { enabled: true,  open: "09:00", close: "23:00" }, // Qui
//     5: { enabled: true,  open: "09:00", close: "23:00" }, // Sex
//     6: { enabled: true,  open: "09:00", close: "23:00" }, // Sáb
//   }
// }

function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json);
    return v && typeof v === "object" ? v : fallback;
  } catch {
    return fallback;
  }
}

function readAll() {
  const raw = localStorage.getItem(KEY);
  return raw ? safeParse(raw, {}) : {};
}

function writeAll(obj) {
  localStorage.setItem(KEY, JSON.stringify(obj || {}));
}

export function getAvailability(courtId) {
  if (!courtId) return null;
  const all = readAll();
  return all[String(courtId)] || null;
}

export function setAvailability(courtId, data) {
  if (!courtId) return;
  const all = readAll();
  all[String(courtId)] = data;
  writeAll(all);
}

export function ensureDefaultAvailability(courtId) {
  const existing = getAvailability(courtId);
  if (existing) return existing;

  const def = {
    slotMinutes: 60,
    days: {
      0: { enabled: false, open: "09:00", close: "23:00" },
      1: { enabled: true, open: "09:00", close: "23:00" },
      2: { enabled: true, open: "09:00", close: "23:00" },
      3: { enabled: true, open: "09:00", close: "23:00" },
      4: { enabled: true, open: "09:00", close: "23:00" },
      5: { enabled: true, open: "09:00", close: "23:00" },
      6: { enabled: true, open: "09:00", close: "23:00" },
    },
  };

  setAvailability(courtId, def);
  return def;
}

function toMinutes(hhmm) {
  const s = String(hhmm || "").trim();
  if (!s) return null;
  if (s === "24:00") return 24 * 60;

  const [hh, mm] = s.split(":").map((x) => Number(x));
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  if (hh < 0 || hh > 24) return null;
  if (mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function minutesToHHMM(m) {
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  if (hh === 24 && mm === 0) return "24:00";
  return `${pad2(hh)}:${pad2(mm)}`;
}

// Lista de horários disponíveis de uma quadra em uma data
export function listSlotsForCourtOnDate(courtId, dateLike) {
  const av = ensureDefaultAvailability(courtId);
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);

  if (Number.isNaN(d.getTime())) return [];
  const dow = d.getDay(); // 0..6

  const dayCfg = av?.days?.[dow];
  if (!dayCfg || !dayCfg.enabled) return [];

  const openMin = toMinutes(dayCfg.open);
  const closeMin = toMinutes(dayCfg.close);
  const slot = Math.max(15, Number(av.slotMinutes || 60));

  if (openMin === null || closeMin === null) return [];
  if (closeMin <= openMin) return []; // sem “virar o dia” por enquanto

  const slots = [];
  for (let t = openMin; t + slot <= closeMin; t += slot) {
    slots.push(minutesToHHMM(t));
  }
  return slots;
}
