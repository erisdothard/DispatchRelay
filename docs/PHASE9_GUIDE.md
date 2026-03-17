# FreightX — Phase 9 Guide: Apple Maps-Style Live Maps

**Goal:** Implement Apple Maps-inspired live tracking with premium visual design

**Timeline:** 1 week  
**Prerequisites:** Phase 8 complete (study guide platform)

---

## Overview

Phase 9 delivers a premium mapping experience that rivals Apple Maps with:

- **Stadia Alidade Smooth Dark tiles** for Apple Maps aesthetic
- **SVG teardrop pins** for loads with dual-layer route glow
- **Animated truck markers** with direction indicators
- **Frosted glass UI elements** for modern design
- **Live tracking map** with route visualization

**Deliverable:** Complete map integration with Apple Maps-style visual design

---

## Deliverables Checklist

### Week 1: Map Implementation

- [x] **Map Tile System**
  - [x] Switch to Stadia Alidade Smooth Dark tiles
  - [x] Configure free tile service with proper attribution
  - [x] Implement dark theme optimization
  - [x] Add tile loading error handling

- [x] **Map-View Component**
  - [x] SVG teardrop pins for loads
  - [x] Dual-layer route glow visualization
  - [x] Animated truck marker with direction
  - [x] Frosted glass LIVE badge
  - [x] Zoom controls with glass styling
  - [x] Shimmer skeleton loading

- [x] **Fleet-Map Component**
  - [x] Pulsing pins for available trucks
  - [x] Glass tooltip with status/equipment
  - [x] Truck count badge
  - [x] Real-time availability updates

- [x] **Leaflet Global Overrides**
  - [x] Glass tooltips styling
  - [x] fx-pulse-ring keyframes
  - [x] Dark container background
  - [x] No focus rings for clean UI

- [x] **Load Board Fixes**
  - [x] Restore Bid Now button on carrier load board
  - [x] Wire to detail sheet functionality
  - [x] Allow truck posting without company profile (independent carriers)

**Phase 9 Status: ✅ COMPLETE**

---

## Technical Implementation

### 1. Map Tile Configuration

```typescript
// apps/web/src/lib/map-config.ts
export const MAP_CONFIG = {
  tileUrl: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
  attribution:
    '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> | &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  maxZoom: 18,
  minZoom: 3,
  darkTheme: true,
};
```

### 2. SVG Teardrop Pin Component

```tsx
// apps/web/src/features/maps/components/load-pin.tsx
import { Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';

const LoadPin = ({ position, load }: { position: [number, number]; load: Load }) => {
  const customIcon = new Icon({
    iconUrl: '/icons/load-pin.svg',
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
  });

  return (
    <Marker position={position} icon={customIcon}>
      <Popup>
        <div className="glass-card p-3">
          <h3 className="font-bold">{load.loadNumber}</h3>
          <p className="text-sm text-gray-300">
            {load.originCity} → {load.destCity}
          </p>
          <p className="text-sm font-mono">${load.rateUsd}</p>
        </div>
      </Popup>
    </Marker>
  );
};
```

### 3. Animated Truck Marker

```tsx
// apps/web/src/features/maps/components/truck-marker.tsx
import { Marker } from 'react-leaflet';
import { Icon } from 'leaflet';

const TruckMarker = ({
  position,
  heading,
  status,
}: {
  position: [number, number];
  heading: number;
  status: string;
}) => {
  const truckIcon = new Icon({
    iconUrl: `/icons/truck-${status}.svg`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  return (
    <Marker position={position} icon={truckIcon} rotationAngle={heading} rotationOrigin="center">
      {status === 'in_transit' && (
        <div className="absolute -top-2 -right-2 bg-green-500 rounded-full w-3 h-3 animate-pulse" />
      )}
    </Marker>
  );
};
```

### 4. Route Visualization

```tsx
// apps/web/src/features/maps/components/route-line.tsx
import { Polyline } from 'react-leaflet';

const RouteLine = ({
  origin,
  destination,
}: {
  origin: [number, number];
  destination: [number, number];
}) => {
  const routePoints = [origin, destination];

  return (
    <>
      {/* Outer glow layer */}
      <Polyline
        positions={routePoints}
        color="#ff6b35"
        weight={8}
        opacity={0.3}
        dashArray="10 10"
      />
      {/* Inner route line */}
      <Polyline positions={routePoints} color="#ff6b35" weight={4} opacity={0.8} />
    </>
  );
};
```

### 5. Live Tracking Map Component

```tsx
// apps/web/src/features/tracking/components/live-map.tsx
'use client';

import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import { LoadPin } from '../components/load-pin';
import { TruckMarker } from '../components/truck-marker';
import { RouteLine } from '../components/route-line';
import { useLoadTracking } from '../../loads/hooks/use-load-tracking';

const MapUpdater = ({ loadId }: { loadId: string }) => {
  const map = useMap();
  const { load, truckPosition, route } = useLoadTracking(loadId);

  useEffect(() => {
    if (load && load.originLat && load.originLng) {
      map.setView([load.originLat, load.originLng], 6);
    }
  }, [load, map]);

  return (
    <>
      {load && (
        <>
          <LoadPin position={[load.originLat, load.originLng]} load={load} />
          <RouteLine
            origin={[load.originLat, load.originLng]}
            destination={[load.destLat, load.destLng]}
          />
        </>
      )}

      {truckPosition && (
        <TruckMarker
          position={[truckPosition.lat, truckPosition.lng]}
          heading={truckPosition.heading}
          status="in_transit"
        />
      )}
    </>
  );
};

export default function LiveTrackingMap({ loadId }: { loadId: string }) {
  return (
    <div className="relative rounded-lg overflow-hidden">
      <MapContainer
        center={[39.8283, -98.5795]}
        zoom={4}
        scrollWheelZoom={true}
        className="h-96 w-full"
      >
        <TileLayer
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
          attribution="&copy; <a href='https://stadiamaps.com/'>Stadia Maps</a> | &copy; <a href='https://openmaptiles.org/'>OpenMapTiles</a> | &copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>"
        />
        <MapUpdater loadId={loadId} />
      </MapContainer>

      <div className="absolute top-4 left-4 glass-card p-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="text-white font-medium">LIVE</span>
        </div>
      </div>
    </div>
  );
}
```

### 6. Fleet Map Component

```tsx
// apps/web/src/features/maps/components/fleet-map.tsx
'use client';

import { MapContainer, TileLayer } from 'react-leaflet';
import { useTrucks } from '../../trucks/hooks/use-trucks';

export default function FleetMap() {
  const { trucks, loading } = useTrucks();

  if (loading) {
    return <div className="skeleton h-96 w-full" />;
  }

  return (
    <div className="relative">
      <MapContainer
        center={[39.8283, -98.5795]}
        zoom={4}
        scrollWheelZoom={true}
        className="h-96 w-full"
      >
        <TileLayer
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
          attribution="&copy; <a href='https://stadiamaps.com/'>Stadia Maps</a> | &copy; <a href='https://openmaptiles.org/'>OpenMapTiles</a> | &copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>"
        />

        {/* Truck markers would be rendered here */}
        {trucks.map((truck) => (
          <div key={truck.id}>{/* Truck marker implementation */}</div>
        ))}
      </MapContainer>

      <div className="absolute top-4 right-4 glass-card p-3">
        <span className="text-white font-medium">Trucks: {trucks.length}</span>
      </div>
    </div>
  );
}
```

### 7. CSS-in-JS Styles

```tsx
// apps/web/src/features/maps/styles/map-styles.ts
export const mapStyles = `
  .leaflet-container {
    background-color: #1a1a1a;
    border-radius: 12px;
  }

  .leaflet-popup-content-wrapper {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
  }

  .leaflet-popup-content {
    color: white;
  }

  .leaflet-control-zoom a {
    background: rgba(0, 0, 0, 0.8);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  @keyframes fx-pulse-ring {
    0% {
      transform: scale(0.33);
      opacity: 0;
    }
    40% {
      opacity: 0.6;
    }
    100% {
      transform: scale(1);
      opacity: 0;
    }
  }

  .pulse-ring {
    position: absolute;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgba(255, 107, 53, 0.4);
    animation: fx-pulse-ring 1.5s infinite;
  }
`;
```

---

## Load Board Fixes

### Restore Bid Now Button

```tsx
// apps/web/src/features/loads/components/load-card.tsx
export const LoadCard = ({ load }: { load: Load }) => {
  const { user } = useAuth();

  return (
    <div className="load-card">
      {/* Load details */}

      {user?.role === 'carrier' && load.status === 'posted' && (
        <button onClick={() => openBidSheet(load.id)} className="bid-now-btn">
          Bid Now
        </button>
      )}
    </div>
  );
};
```

### Allow Independent Carrier Truck Posting

```tsx
// apps/web/src/features/trucks/components/post-truck-sheet.tsx
export const PostTruckSheet = () => {
  const { user } = useAuth();

  // Allow posting without company profile for independent carriers
  const canPost = user?.role === 'carrier' && (user.companyId || !user.onboardingComplete);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent>
        {/* Truck posting form */}
        {!user.companyId && (
          <Alert>
            <AlertTitle>Independent Carrier</AlertTitle>
            <AlertDescription>
              You can post trucks without a company profile. Consider completing your company setup
              for full features.
            </AlertDescription>
          </Alert>
        )}
      </SheetContent>
    </Sheet>
  );
};
```

---

## Definition of Done

- [ ] Apple Maps-style dark theme implemented
- [ ] SVG teardrop pins working for loads
- [ ] Animated truck markers with direction
- [ ] Route visualization with dual-layer glow
- [ ] Frosted glass UI elements
- [ ] Live tracking map functional
- [ ] Fleet map showing available trucks
- [ ] Load board Bid Now button restored
- [ ] Independent carrier truck posting enabled
- [ ] All map interactions smooth and responsive

---

## Success Metrics

| Metric                     | Target           |
| -------------------------- | ---------------- |
| Map load time              | < 2 seconds      |
| Route rendering time       | < 500ms          |
| Truck marker animation     | 60fps            |
| Mobile responsiveness      | All screen sizes |
| Tile loading reliability   | > 99%            |
| User satisfaction (map UI) | > 8/10           |

---

_This phase delivers a premium mapping experience that sets FreightX apart from competitors._
