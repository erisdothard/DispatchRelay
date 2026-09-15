import {
  BedDouble,
  ClipboardList,
  Fuel,
  Package,
  Route,
  SquareParking,
  Utensils,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReceiptCategory } from '@dispatchrelay/shared';

/** One icon per receipt category, shared by the capture sheet, receipts list and expenses. */
export const RECEIPT_CATEGORY_ICONS: Record<ReceiptCategory, LucideIcon> = {
  fuel: Fuel,
  maintenance: Wrench,
  tolls: Route,
  meals: Utensils,
  lodging: BedDouble,
  parking: SquareParking,
  supplies: Package,
  other: ClipboardList,
};
