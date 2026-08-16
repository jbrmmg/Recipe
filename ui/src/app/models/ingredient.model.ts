export interface Ingredient {
  id: number;
  name: string;
  defaultUnit: string;
  purchaseQuantity: number;
  purchaseUnit: string;
  category: string;
}

export const MEASUREMENT_UNITS = [
  { value: 'GRAM',       label: 'Gram (g)',       short: 'g' },
  { value: 'KILOGRAM',   label: 'Kilogram (kg)',  short: 'kg' },
  { value: 'MILLILITRE', label: 'Millilitre (ml)', short: 'ml' },
  { value: 'LITRE',      label: 'Litre (l)',      short: 'l' },
  { value: 'TEASPOON',   label: 'Teaspoon',       short: 'tsp' },
  { value: 'TABLESPOON', label: 'Tablespoon',     short: 'tbsp' },
  { value: 'CUP',        label: 'Cup',            short: 'cup' },
  { value: 'ITEM',       label: 'Item',           short: '' },
  { value: 'BUNCH',      label: 'Bunch',          short: 'bunch' },
  { value: 'PACK',       label: 'Pack',           short: 'pack' },
  { value: 'PINCH',      label: 'Pinch',          short: 'pinch' },
  { value: 'SLICE',      label: 'Slice',          short: 'slice' },
  { value: 'HANDFUL',    label: 'Handful',        short: 'handful' },
  { value: 'CENTIMETRE', label: 'Centimetre (cm)', short: 'cm' },
];

export const INGREDIENT_CATEGORIES = [
  { value: 'DAIRY',   label: 'Dairy' },
  { value: 'MEAT',    label: 'Meat' },
  { value: 'FISH',    label: 'Fish' },
  { value: 'PRODUCE', label: 'Produce' },
  { value: 'TINNED',  label: 'Tinned' },
  { value: 'SPICES',  label: 'Spices' },
  { value: 'BAKERY',  label: 'Bakery' },
  { value: 'FROZEN',  label: 'Frozen' },
  { value: 'DRINKS',  label: 'Drinks' },
  { value: 'OTHER',   label: 'Other' },
];
