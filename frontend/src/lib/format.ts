import type { Grade, Trait } from '../types';
const phpFmt = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const peso = (n: number) => phpFmt.format(n);
export const num = (n: number) => new Intl.NumberFormat('en-PH').format(n);

export const dateShort = (iso: string) =>
  new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

export function timeAgo(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} ${d === 1 ? 'day' : 'days'} ago`;
  return dateShort(iso);
}

export const UNITS = ['kg', 'ton', 'sack', 'crate', 'bunch', 'piece'];
export const BUYER_TYPES = ['Individual', 'Retailer', 'Wholesaler', 'Restaurant', 'Processor'];
export const PROVINCES = [
  'Batangas', 'Benguet', 'Bukidnon', 'Cebu', 'Davao del Sur', 'Guimaras', 'Isabela', 'Laguna', 'Nueva Ecija',
  'Pangasinan', 'Quezon', 'Tarlac', 'Negros Occidental', 'Iloilo', 'Makati', 'Quezon City', 'Cebu City',
];
export const CROP_SUGGESTIONS = [
  'Rice (Jasmine)', 'Corn (Yellow)', 'Tomato', 'Cabbage', 'Carrot', 'Eggplant', 'Mango (Carabao)', 'Banana (Lakatan)',
  'Pineapple', 'Coconut', 'Onion', 'Potato', 'Sugarcane', 'Coffee (Robusta)', 'Cacao',
];

const EMOJI: [RegExp, string, string][] = [
  [/rice|palay/i, '🌾', '#f3e6b3'],
  [/corn|mais/i, '🌽', '#fbe08a'],
  [/tomato/i, '🍅', '#f8c9bf'],
  [/mango/i, '🥭', '#fcd98c'],
  [/banana|saging/i, '🍌', '#fbeaa0'],
  [/cabbage|lettuce|pechay/i, '🥬', '#cfe6c3'],
  [/carrot/i, '🥕', '#fcd3a8'],
  [/eggplant|talong/i, '🍆', '#dccbe6'],
  [/pineapple/i, '🍍', '#f7e29a'],
  [/coconut|niyog/i, '🥥', '#e7dccb'],
  [/onion|garlic/i, '🧅', '#ecd8e4'],
  [/potato/i, '🥔', '#e8d9bf'],
  [/coffee|cacao|cocoa/i, '🫘', '#e2cdbb'],
  [/sugar/i, '🎋', '#d6ecd0'],
];
/**
 * Photo files to try for a crop, most specific first. Drop JPGs into public/crops/:
 *   "Rice (Jasmine)" -> /crops/rice-jasmine.jpg, then /crops/rice.jpg
 *   "Tomato"         -> /crops/tomato.jpg
 */
export function cropPhotoSources(name: string): string[] {
  const slug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const full = slug(name);
  const base = slug(name.split('(')[0]);
  return [...new Set([full, base].filter(Boolean))].map((f) => `/crops/${f}.jpg`);
}
export function cropLook(name: string): { emoji: string; bg: string } {
  const hit = EMOJI.find(([re]) => re.test(name));
  return hit ? { emoji: hit[1], bg: hit[2] } : { emoji: '🌱', bg: '#dcebd2' };
}

/** Downscale a chosen photo so it fits comfortably in localStorage (and in an API upload). */
export function readImage(file: File, max = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file. Try a different photo.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That file is not a valid image. Choose a JPG or PNG.'));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.75));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
/* ---------- Grades and traits ---------- */
export const GRADE_INFO: Record<Grade, { label: string; blurb: string; rank: number }> = {
  A: { label: 'Premium', blurb: 'Uniform size, fresh, no visible damage, well sorted.', rank: 3 },
  B: { label: 'Standard', blurb: 'Mostly uniform with minor blemishes. Good for the general market.', rank: 2 },
  C: { label: 'Economy', blurb: 'Mixed sizes or visible blemishes. Best for processing or feed.', rank: 1 },
};

export const TRAIT_LABEL: Record<Trait, string> = {
  freshlyPicked: 'Freshly picked',
  sorted: 'Sorted by size',
  cleaned: 'Washed or cleaned',
  packed: 'Packed for pickup',
};
export const TRAITS = Object.keys(TRAIT_LABEL) as Trait[];
/* ---------- Crop categories (worked out from the crop name, so no backend field is needed yet) ---------- */
export type Category = 'Vegetables' | 'Fruits' | 'Grains' | 'Root crops' | 'Other';

export const CATEGORIES: { key: Category; emoji: string }[] = [
  { key: 'Vegetables', emoji: '🍅' },
  { key: 'Fruits', emoji: '🥭' },
  { key: 'Grains', emoji: '🌾' },
  { key: 'Root crops', emoji: '🥕' },
  { key: 'Other', emoji: '🌱' },
];

const CATEGORY_RULES: [RegExp, Category][] = [
  [/rice|palay|corn|mais|wheat|sorghum/i, 'Grains'],
  [/carrot|potato|onion|garlic|ginger|cassava|camote|sweet potato|radish|turnip/i, 'Root crops'],
  [/mango|banana|saging|pineapple|coconut|niyog|papaya|watermelon|melon|calamansi|orange|durian|lanzones|avocado/i, 'Fruits'],
  [/tomato|cabbage|lettuce|pechay|eggplant|talong|ampalaya|squash|kalabasa|beans|sitaw|okra|cucumber|pepper|broccoli|kangkong/i, 'Vegetables'],
];

export function cropCategory(name: string): Category {
  return CATEGORY_RULES.find(([re]) => re.test(name))?.[1] ?? 'Other';
}