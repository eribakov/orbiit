export const ITEM_CATEGORIES = [
  'Electronics',
  'Clothing & Accessories',
  'Bags & Wallets',
  'Keys',
  'Cards/IDs & Documents',
  'Sports & Leisure',
  'Personal Care',
  'Miscellaneous',
]

export const ITEMS_BY_CATEGORY = {
  Electronics: [
    'Phone',
    'Laptop',
    'Tablet',
    'AirPods/Earbuds',
    'Headphones',
    'Charger',
    'Camera',
    'Smartwatch',
    'Other',
  ],
  'Clothing & Accessories': [
    'Jacket',
    'Hoodie',
    'Hat/Cap',
    'Scarf',
    'Sunglasses',
    'Glasses',
    'Jewelry',
    'Watch',
    'Shoes',
    'Hair Accessories',
    'Other',
  ],
  'Bags & Wallets': [
    'Backpack',
    'Purse/Handbag',
    'Wallet',
    'Tote Bag',
    'Luggage',
    'Other',
  ],
  Keys: ['House Keys', 'Car Keys', 'Bike Lock Keys', 'Other'],
  'Cards/IDs & Documents': [
    'Credit/Debit Card',
    'Student ID',
    "Driver's License",
    'Passport',
    'Other',
  ],
  'Sports & Leisure': ['Water Bottle', 'Gym Bag', 'Sports Equipment', 'Other'],
  'Personal Care': ['Medication', 'Ointments', 'Other'],
  Miscellaneous: ['Other'],
}

/** Display line for account list / legacy rows with only item text. */
export function formatReportItemTitle(category, item) {
  if (category && item) return `${category} · ${item}`
  if (item) return item
  if (category) return category
  return '—'
}
