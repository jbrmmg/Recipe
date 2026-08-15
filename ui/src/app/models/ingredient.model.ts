export interface Ingredient {
  id: number;
  name: string;
  defaultUnit: string;
  purchaseQuantity: number;
  purchaseUnit: string;
  category: string;
}

export const MEASUREMENT_UNITS = [
  { value: 'GRAM',       label: 'Gram (g)' },
  { value: 'KILOGRAM',   label: 'Kilogram (kg)' },
  { value: 'MILLILITRE', label: 'Millilitre (ml)' },
  { value: 'LITRE',      label: 'Litre (l)' },
  { value: 'TEASPOON',   label: 'Teaspoon' },
  { value: 'TABLESPOON', label: 'Tablespoon' },
  { value: 'CUP',        label: 'Cup' },
  { value: 'ITEM',       label: 'Item' },
  { value: 'BUNCH',      label: 'Bunch' },
  { value: 'PACK',       label: 'Pack' },
  { value: 'PINCH',      label: 'Pinch' },
  { value: 'SLICE',      label: 'Slice' },
  { value: 'HANDFUL',    label: 'Handful' },
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
