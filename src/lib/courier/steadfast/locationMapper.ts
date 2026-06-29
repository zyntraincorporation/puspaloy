// src/lib/courier/steadfast/locationMapper.ts
// Normalizes district and thana strings before sending to Steadfast Courier API.
//
// Steadfast accepts district/thana as free-text strings.
// This utility:
//   1. Trims and title-cases the input.
//   2. Applies a known-alias map to convert common alternate spellings.
//
// Usage:
//   import { normalizeDistrict, normalizeThana } from '@/lib/courier/steadfast/locationMapper'
//   const district = normalizeDistrict(order.district)

// ── Helpers ──────────────────────────────────────────────────────────────────

function toTitleCase(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── District alias map ────────────────────────────────────────────────────────
// Keys are lowercase variants; values are the canonical form Steadfast accepts.
const DISTRICT_ALIASES: Record<string, string> = {
  // Dhaka division
  'dhaka city': 'Dhaka',
  'dhaka city corporation': 'Dhaka',
  'dhaka north': 'Dhaka',
  'dhaka south': 'Dhaka',
  'dhaka metro': 'Dhaka',
  'dhaka metropolitan': 'Dhaka',
  'north dhaka': 'Dhaka',
  'south dhaka': 'Dhaka',
  'gazipur city': 'Gazipur',
  'gazipur city corporation': 'Gazipur',
  'narayanganj city': 'Narayanganj',

  // Chittagong / Chattogram
  chittagong: 'Chattogram',
  'chattogram city': 'Chattogram',
  'chittagong city': 'Chattogram',
  ctg: 'Chattogram',

  // Comilla / Cumilla
  comilla: 'Cumilla',
  cumilla: 'Cumilla',

  // Brahmanbaria
  brahmanbaria: 'Brahmanbaria',
  brahmonbaria: 'Brahmanbaria',

  // Sylhet
  sylhet: 'Sylhet',
  'sylhet city': 'Sylhet',

  // Barishal / Barisal
  barisal: 'Barishal',
  barishal: 'Barishal',

  // Rajshahi
  rajshahi: 'Rajshahi',
  'rajshahi city': 'Rajshahi',

  // Khulna
  khulna: 'Khulna',
  'khulna city': 'Khulna',

  // Mymensingh
  mymensingh: 'Mymensingh',
  mymensing: 'Mymensingh',
  memensigh: 'Mymensingh',

  // Rangpur
  rangpur: 'Rangpur',

  // Cox's Bazar
  coxsbazar: "Cox's Bazar",
  "cox's bazar": "Cox's Bazar",
  coxs_bazar: "Cox's Bazar",
  'coxs bazar': "Cox's Bazar",

  // Feni
  feni: 'Feni',

  // Bogra / Bogura
  bogra: 'Bogura',
  bogura: 'Bogura',

  // Noakhali
  noakhali: 'Noakhali',
  noakhaly: 'Noakhali',

  // Jashore / Jessore
  jessore: 'Jashore',
  jashore: 'Jashore',

  // Pabna
  pabna: 'Pabna',

  // Tangail
  tangail: 'Tangail',

  // Faridpur
  faridpur: 'Faridpur',

  // Kishoreganj
  kishoreganj: 'Kishoreganj',
  kishorganj: 'Kishoreganj',

  // Narsingdi
  narsingdi: 'Narsingdi',
  narshingdi: 'Narsingdi',

  // Manikganj
  manikganj: 'Manikganj',
  manikgang: 'Manikganj',

  // Munshiganj
  munshiganj: 'Munshiganj',
  munshigong: 'Munshiganj',

  // Madaripur
  madaripur: 'Madaripur',

  // Gopalganj
  gopalganj: 'Gopalganj',

  // Shariatpur
  shariatpur: 'Shariatpur',

  // Rajbari
  rajbari: 'Rajbari',

  // Jamalpur
  jamalpur: 'Jamalpur',

  // Sherpur
  sherpur: 'Sherpur',

  // Netrokona
  netrokona: 'Netrokona',
  netrakona: 'Netrokona',

  // Habiganj
  habiganj: 'Habiganj',
  habigonj: 'Habiganj',

  // Moulvibazar
  moulvibazar: 'Moulvibazar',
  moulovibazar: 'Moulvibazar',
  moulvibazaar: 'Moulvibazar',

  // Sunamganj
  sunamganj: 'Sunamganj',
  sunamgonj: 'Sunamganj',

  // Chandpur
  chandpur: 'Chandpur',

  // Lakshmipur
  lakshmipur: 'Lakshmipur',
  laksmipur: 'Lakshmipur',

  // Khagrachhari
  khagrachhari: 'Khagrachhari',
  khagrachari: 'Khagrachhari',
  khagrachori: 'Khagrachhari',

  // Rangamati
  rangamati: 'Rangamati',

  // Bandarban
  bandarban: 'Bandarban',
  bandorban: 'Bandarban',

  // Satkhira
  satkhira: 'Satkhira',

  // Bagerhat
  bagerhat: 'Bagerhat',

  // Narail
  narail: 'Narail',

  // Magura
  magura: 'Magura',

  // Jhenaidah
  jhenaidah: 'Jhenaidah',
  jhenidah: 'Jhenaidah',

  // Chuadanga
  chuadanga: 'Chuadanga',

  // Meherpur
  meherpur: 'Meherpur',

  // Kushtia
  kushtia: 'Kushtia',

  // Sirajganj
  sirajganj: 'Sirajganj',
  sirajgonj: 'Sirajganj',

  // Natore
  natore: 'Natore',

  // Chapainawabganj
  chapainawabganj: 'Chapainawabganj',
  'chapai nawabganj': 'Chapainawabganj',

  // Naogaon
  naogaon: 'Naogaon',
  nawgoan: 'Naogaon',

  // Joypurhat
  joypurhat: 'Joypurhat',

  // Gaibandha
  gaibandha: 'Gaibandha',

  // Nilphamari
  nilphamari: 'Nilphamari',

  // Lalmonirhat
  lalmonirhat: 'Lalmonirhat',

  // Kurigram
  kurigram: 'Kurigram',

  // Dinajpur
  dinajpur: 'Dinajpur',

  // Thakurgaon
  thakurgaon: 'Thakurgaon',

  // Panchagarh
  panchagarh: 'Panchagarh',

  // Pirojpur
  pirojpur: 'Pirojpur',

  // Bhola
  bhola: 'Bhola',

  // Jhalokati
  jhalokati: 'Jhalokati',
  jhalokhati: 'Jhalokati',

  // Patuakhali
  patuakhali: 'Patuakhali',

  // Barguna
  barguna: 'Barguna',
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Normalize a district name for Steadfast Courier.
 * Returns the canonical spelling accepted by the Steadfast API.
 */
export function normalizeDistrict(raw: string): string {
  if (!raw) return ''
  const key = raw.trim().toLowerCase()
  return DISTRICT_ALIASES[key] ?? toTitleCase(raw)
}

/**
 * Normalize a thana/upazila name for Steadfast Courier.
 * Steadfast accepts thana as free-text, so we just title-case and trim.
 */
export function normalizeThana(raw: string | null | undefined): string {
  if (!raw) return ''
  return toTitleCase(raw)
}
