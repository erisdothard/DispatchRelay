export type UserRole = 'carrier' | 'broker' | 'shipper' | 'admin' | 'driver';

export type EquipmentType = 'van' | 'reefer' | 'flatbed' | 'step_deck' | 'lowboy' | 'tanker' | 'box_truck' | 'sprinter';

export type LoadStatus =
  | 'draft'
  | 'posted'
  | 'bid_received'
  | 'awarded'
  | 'dispatched'
  | 'in_transit'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'expired';

export type TruckStatus = 'available' | 'booked' | 'inactive';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  company: Company;
  avatarUrl?: string;
}

export interface Company {
  id: string;
  name: string;
  type: UserRole;
  mcNumber?: string;
  dotNumber?: string;
  verified: boolean;
  rating?: number;
  totalLoads?: number;
  onTimePercent?: number;
}

export interface Load {
  id: string;
  loadNumber: string;
  postedBy: string;
  companyName: string;
  originCity: string;
  originState: string;
  destCity: string;
  destState: string;
  pickupDate: string;
  deliveryDate: string;
  equipment: EquipmentType;
  commodity: string;
  weightLbs: number;
  rateUsd: number;
  ratePerMile: number;
  totalMiles?: number;
  status: LoadStatus;
  bidCount?: number;
  hazmat?: boolean;
  tempControlled?: boolean;
  postedAt?: string;        // ISO timestamp for load age
  brokerCreditScore?: number; // 0-100
  assignedDriverId?: string;
}

export interface Truck {
  id: string;
  postedBy: string;
  companyName: string;
  originCity: string;
  originState: string;
  destCity?: string;
  destState?: string;
  availableDate: string;
  equipment: EquipmentType;
  lengthFt?: number;
  weightCapacityLbs?: number;
  driverName?: string;
  driverPhone?: string;
  driverId?: string;
  status: TruckStatus;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export interface ChatMessage {
  id: string;
  text: string;
  fromMe: boolean;
  time: string;
}

export interface Conversation {
  id: string;
  loadNumber: string;
  otherParty: string;
  otherPartyRole: UserRole;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  messages?: ChatMessage[];
}

export interface TrackingMilestone {
  label: string;
  location: string;
  timestamp: string;
  completed: boolean;
  current?: boolean;
}
