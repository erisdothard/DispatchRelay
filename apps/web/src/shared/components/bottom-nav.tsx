import { Link, useLocation } from 'react-router-dom';
import { Home, Search, MessageSquare, User, Truck, Package, BarChart2, Plus } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

type NavRole = 'carrier' | 'broker' | 'shipper';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
}

const carrierNav: NavItem[] = [
  { label: 'Home', icon: <Home size={22} />, path: '/carrier' },
  { label: 'Loads', icon: <Search size={22} />, path: '/carrier/loads' },
  { label: 'Fleet', icon: <Truck size={22} />, path: '/carrier/fleet' },
  { label: 'Messages', icon: <MessageSquare size={22} />, path: '/messages' },
  { label: 'Profile', icon: <User size={22} />, path: '/profile' },
];

const brokerNav: NavItem[] = [
  { label: 'Home', icon: <Home size={22} />, path: '/broker' },
  { label: 'Loads', icon: <Package size={22} />, path: '/broker/loads' },
  { label: 'Track', icon: <BarChart2 size={22} />, path: '/tracking' },
  { label: 'Messages', icon: <MessageSquare size={22} />, path: '/messages' },
  { label: 'Profile', icon: <User size={22} />, path: '/profile' },
];

const shipperNav: NavItem[] = [
  { label: 'Home', icon: <Home size={22} />, path: '/shipper' },
  { label: 'Shipments', icon: <Package size={22} />, path: '/shipper/loads' },
  { label: 'Track', icon: <BarChart2 size={22} />, path: '/track' },
  { label: 'Messages', icon: <MessageSquare size={22} />, path: '/messages' },
  { label: 'Profile', icon: <User size={22} />, path: '/profile' },
];

const navByRole: Record<NavRole, NavItem[]> = {
  carrier: carrierNav,
  broker: brokerNav,
  shipper: shipperNav,
};

export function BottomNav({ role }: { role: NavRole }) {
  const location = useLocation();
  const items = navByRole[role];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50">
      {/* iOS frosted glass bar */}
      <div
        className="absolute inset-0 ios-blur"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
      />

      <div className="relative flex items-center justify-around px-1 pb-safe pt-2 h-[68px]">
        {items.map((item) => {
          const isActive =
            item.path === '/carrier' || item.path === '/broker' || item.path === '/shipper'
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl min-w-[44px] transition-all duration-150"
            >
              <div
                className={cn(
                  'transition-colors duration-150',
                  isActive ? 'text-fx-orange' : 'text-fx-text-dim',
                )}
              >
                {item.icon}
              </div>
              <span
                className={cn(
                  'text-[10px] font-semibold transition-colors duration-150',
                  isActive ? 'text-fx-orange' : 'text-fx-text-dim',
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
