/**
 * Shared admin ID used for Firestore document paths.
 */
export const SHARED_ADMIN_ID = 'KBS_SHARED_DATA';

/**
 * List of email addresses with master admin privileges.
 * Reads from NEXT_PUBLIC_ADMIN_EMAILS env variable (comma-separated).
 * You can add unlimited emails in .env.local like:
 *   NEXT_PUBLIC_ADMIN_EMAILS=email1@gmail.com,email2@gmail.com,email3@gmail.com
 * 
 * Additionally, any user added to the Firestore `roles_admin` collection
 * will also have admin access (checked at login time).
 */
export const AUTHORIZED_ADMIN_EMAILS: string[] = (
  process.env.NEXT_PUBLIC_ADMIN_EMAILS || ''
)
  .split(',')
  .map(e => e.trim())
  .filter(Boolean);

/**
 * Gold jewelry item categories for the calculator.
 */
export const GOLD_CATEGORIES = [
  { title: "👑 Head Ornaments", items: ["Papidi Billa", "Talapaga Bottu", "Jada Billalu", "Jada Gantalu"] },
  { title: "👂 Ear Ornaments", items: ["Kammalu", "Jhumkalu", "Buttalu", "Ringulu", "Kundanalu", "Tops", "Duddulu", "Hanging Kammalu", "Stone Kammalu"] },
  { title: "👃 Nose Ornaments", items: ["Mukkupudaka", "Mukku Pulla", "Mukku Ring", "Diamond Mukkupudaka"] },
  { title: "📿 Neck Ornaments", items: ["Haram", "Mangalasutram", "Chain", "Kasula Haram", "Gundla Haram", "Dollar", "Addigai"] },
  { title: "👑 Arm & Hand Ornaments", items: ["Bangles", "Kadiyalu", "Bracelet", "Ungaram", "Diamond Ring", "Navaratna Ring"] },
  { title: "🦶 Waist & Leg Ornaments", items: ["Vaddanam", "Molathadu", "Payal", "Noopuram", "Mettelu"] },
];

/**
 * Silver jewelry item categories for the calculator.
 */
export const SILVER_CATEGORIES = [
  { title: "🦶 Silver Leg & Feet", items: ["Patti Golusulu", "Gajjelu", "Muvvala Patti", "Kadiyalu", "Mettelu"] },
  { title: "✋ Silver Hand", items: ["Silver Gajulu", "Silver Kadalu", "Silver Bracelet", "Ungaram", "Stone Ring"] },
  { title: "🏠 Other Silver", items: ["Silver Glass", "Silver Plate", "Silver Bowl", "Silver Spoon", "Silver Idols"] },
];

/**
 * All item names combined for autocomplete.
 */
export const ALL_ITEMS = Array.from(
  new Set([...GOLD_CATEGORIES, ...SILVER_CATEGORIES].flatMap(c => c.items))
);
