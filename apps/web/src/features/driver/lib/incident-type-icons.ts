import {
  AlertTriangle,
  CircleDot,
  Cog,
  Fuel,
  HeartPulse,
  Lightbulb,
  NotebookPen,
  OctagonAlert,
  Package,
  Truck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { IncidentType } from '@/services/driver-incidents.service';

/** One icon per incident type, shared by the incident form and the incident log. */
export const INCIDENT_TYPE_ICONS: Record<IncidentType, LucideIcon> = {
  tire: CircleDot,
  engine: Cog,
  brake: OctagonAlert,
  lights: Lightbulb,
  body_damage: Truck,
  accident: AlertTriangle,
  driver_illness: HeartPulse,
  cargo: Package,
  fuel: Fuel,
  other: NotebookPen,
};

export const FALLBACK_INCIDENT_ICON: LucideIcon = NotebookPen;
