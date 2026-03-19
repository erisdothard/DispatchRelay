# FreightX — Feature Catalog

**Source:** Client-provided industry guide (FreightX Feature Suggestions)
**Purpose:** Complete, unabridged feature inventory — nothing removed from source
**Last audit:** 2026-03-16

---

## Priority Legend

| Priority          | Meaning                                   |
| ----------------- | ----------------------------------------- |
| **P0 — Critical** | MVP cannot ship without this              |
| **P1 — High**     | Must ship within 90 days of launch        |
| **P2 — Medium**   | Growth phase (v1.1–v1.3)                  |
| **P3 — Low**      | Scale phase / competitive differentiation |

---

## Phase Map

| Phase    | Focus                                                                                      | Status      |
| -------- | ------------------------------------------------------------------------------------------ | ----------- |
| Phase 0  | Repo, CI/CD, Tooling                                                                       | ✅ Complete |
| Phase 1  | Auth, registration, profiles, companies                                                    | ✅ Complete |
| Phase 2  | Load CRUD, truck CRUD, search, dashboards                                                  | ✅ Complete |
| Phase 3  | Real-time board, chat, notifications                                                       | ✅ Complete |
| Phase 4  | Bidding, booking, rate con, lifecycle, documents                                           | ✅ Complete |
| Phase 5  | Carrier verification, Stripe billing, invoicing, payments, ratings                         | ✅ Complete |
| Phase 6  | Testing, performance, monitoring, launch                                                   | ✅ Complete |
| Phase 6  | Production Hardening                                                                       | ✅ Complete |
| Phase 7  | Elite Automation Scripts                                                                   | ✅ Complete |
| Phase 8  | Study Guide & Learning Platform                                                            | ✅ Complete |
| Phase 9  | Apple Maps-Style Live Maps                                                                 | ✅ Complete |
| Phase 10 | Interactive Maps & Profiles                                                                | ✅ Complete |
| Phase 11 | AI Assisted Load Seeking                                                                   | ✅ Complete |
| Phase 12 | GPS Real-Time Tracking                                                                     | ✅ Complete |
| Phase 13 | Enterprise Completion (email/SMS, teams, templates, e-sig, rate intelligence, scale infra) | ✅ Complete |

---

## 1. Core Load Board

### 1.1 Load Posting & Management

| Feature               | Description                                                                                                   | Roles           | Priority | Phase |
| --------------------- | ------------------------------------------------------------------------------------------------------------- | --------------- | -------- | ----- |
| Rich Load Posting     | Multi-step form: equipment type, commodity, hazmat classification, temperature requirements, special handling | Broker, Shipper | P0       | 2     |
| Load Templates        | Save lane/config as reusable template for quick re-posting                                                    | Broker, Shipper | P1       | Post  |
| Bulk Load Upload      | Import loads via CSV/Excel or TMS API                                                                         | Broker, Shipper | P1       | Post  |
| Load Status Lifecycle | Posted → Bid → Awarded → Dispatched → In-Transit → Delivered → Completed → Invoiced                           | All             | P0       | 2/4   |
| Load Expiration       | Auto-expire loads after configurable window, with re-post option                                              | Broker, Shipper | P1       | 4     |
| Load Cloning          | Duplicate an existing or completed load for recurring shipments                                               | Broker, Shipper | P2       | Post  |
| Multi-Stop Loads      | Multiple pickup and/or delivery locations on one load                                                         | Broker, Shipper | P1       | 2     |
| Partial Loads / LTL   | Less-than-truckload posting with weight/space specs                                                           | Broker, Shipper | P2       | Post  |
| Commodity Categories  | Standardized classification (dry goods, refrigerated, hazmat, oversized, etc.)                                | All             | P1       | 2     |

### 1.2 Truck / Equipment Posting

| Feature              | Description                                                                  | Roles   | Priority | Phase |
| -------------------- | ---------------------------------------------------------------------------- | ------- | -------- | ----- |
| Equipment Posting    | Post available trucks: type, capacity, dimensions, special capabilities      | Carrier | P0       | 2     |
| Availability Windows | Exact date/time windows when equipment is available                          | Carrier | P1       | 2     |
| Preferred Lanes      | Preferred routes and destinations for better matching                        | Carrier | P1       | Post  |
| Equipment Specs      | Detailed specs: liftgate, straps, tarps, pallet jack, team driver capability | Carrier | P2       | 2     |
| Fleet Overview       | Dashboard showing all trucks with current status and location                | Carrier | P1       | 2     |

### 1.3 Search & Discovery

| Feature                      | Description                                                                                | Roles           | Priority | Phase |
| ---------------------------- | ------------------------------------------------------------------------------------------ | --------------- | -------- | ----- |
| Advanced Search Filters      | Filter by equipment, weight, distance, rate, pickup date, delivery date, commodity, hazmat | All             | P0       | 2     |
| Radius Search                | Search within configurable mile radius of origin/destination                               | All             | P0       | 2     |
| Saved Searches / Saved Lanes | Save search criteria, receive alerts when matching loads/trucks are posted                 | All             | P1       | Post  |
| Smart Lane Alerts            | Real-time push/email/SMS when loads matching saved criteria are posted                     | All             | P1       | Post  |
| Map-Based Search             | Visual map: search by drawing regions or clicking corridors                                | All             | P2       | Post  |
| Fuzzy Location Matching      | Accept city names, ZIP codes, state abbreviations, nearby locations                        | All             | P1       | 2     |
| Rate Benchmarking            | Show average lane rates and trends alongside search results                                | Broker, Shipper | P1       | Post  |
| Sort & Rank Results          | Sort by rate, distance, deadhead, age, carrier rating, or custom scoring                   | All             | P2       | 2     |
| Recent Searches              | Quick access to recently performed searches                                                | All             | P3       | Post  |

---

## 2. Booking & Transaction Management

### 2.1 Bidding & Negotiation

| Feature             | Description                                                       | Priority | Phase |
| ------------------- | ----------------------------------------------------------------- | -------- | ----- |
| Rate Bidding        | Carriers submit bids; brokers accept, counter, or decline         | P0       | 4     |
| Counter-Offers      | Multi-round negotiation with counter-offer capability             | P1       | 4     |
| Book-It-Now Pricing | Fixed rate option — carriers instantly book at posted rate        | P0       | 4     |
| Bid Expiration      | Bids expire after configurable window to keep negotiations moving | P1       | 4     |
| Bid History         | Full audit trail of all bids and counter-offers on a load         | P1       | 4     |
| Bulk Bidding        | Bid on multiple loads at once for multi-stop or recurring lanes   | P3       | Post  |

### 2.2 Booking Workflow

| Feature              | Description                                                     | Priority | Phase |
| -------------------- | --------------------------------------------------------------- | -------- | ----- |
| Rate Confirmation    | Auto-generated rate confirmation document upon booking          | P0       | 4     |
| Digital Signature    | E-signature on rate confirmations and contracts                 | P1       | 4     |
| Booking Confirmation | Email/SMS confirmation to all parties with full load details    | P0       | 4     |
| Cancellation Policy  | Configurable cancellation windows with penalty fees             | P1       | 4     |
| Re-Assignment        | Re-assign load to different carrier if original falls through   | P2       | 4     |
| Dispatch Sheet       | Auto-generated dispatch sheet with pickup/delivery instructions | P1       | 4     |

### 2.3 Load Lifecycle Management

| Feature                 | Description                                                           | Priority | Phase |
| ----------------------- | --------------------------------------------------------------------- | -------- | ----- |
| Status Updates          | Real-time status updates throughout the load lifecycle                | P0       | 4     |
| Check-In / Check-Out    | Driver check-in at pickup and delivery with timestamp capture         | P1       | 4     |
| Proof of Delivery (POD) | Photo/document upload for delivery confirmation                       | P0       | 4     |
| Exception Management    | Report and manage delays, damages, refusals, and detention charges    | P1       | 4     |
| Load Completion         | Finalize load with actual weights, miles, and any accessorial charges | P0       | 4     |

---

## 3. Communication & Collaboration

### 3.1 Messaging System

| Feature           | Description                                                                      | Priority | Phase |
| ----------------- | -------------------------------------------------------------------------------- | -------- | ----- |
| Per-Load Chat     | Real-time messaging thread attached to each load/booking                         | P0       | 3     |
| Direct Messaging  | One-to-one messaging between any two users                                       | P1       | Post  |
| Group Messaging   | Multi-party threads (carrier, broker, shipper, driver) per shipment              | P2       | Post  |
| File Sharing      | Share documents, photos, and files within message threads                        | P1       | 3     |
| Message Templates | Pre-built templates for common communications (pickup confirm, ETA update, etc.) | P3       | Post  |
| Read Receipts     | Confirmation that messages have been seen                                        | P3       | Post  |

### 3.2 Notifications

| Feature                  | Description                                                         | Priority | Phase |
| ------------------------ | ------------------------------------------------------------------- | -------- | ----- |
| In-App Notifications     | Real-time notification bell with unread count                       | P0       | 3     |
| Email Notifications      | Configurable email alerts for loads, bids, bookings, status changes | P0       | 3     |
| SMS Notifications        | Text message alerts for time-sensitive events (Twilio)              | P1       | Post  |
| Push Notifications       | Browser/mobile push notifications (PWA)                             | P2       | Post  |
| Notification Preferences | Per-category settings (which events, which channels)                | P1       | 3     |
| Daily Digest             | Opt-in daily summary email of activity and available loads          | P3       | Post  |

---

## 4. Carrier Management & Verification

### 4.1 Carrier Onboarding

| Feature                                     | Description                                                                | Priority | Phase |
| ------------------------------------------- | -------------------------------------------------------------------------- | -------- | ----- |
| MC/DOT Verification                         | Automated FMCSA SAFER lookup to verify carrier authority status            | P0       | 5     |
| Insurance Verification                      | Validate active insurance certs (auto-liability, cargo, general liability) | P0       | 5     |
| Safety Score Display                        | Pull and display FMCSA safety ratings and CSA scores                       | P1       | 5     |
| Document Upload (W-9, Insurance, Authority) | Upload and store W-9, insurance certificates, operating authority docs     | P0       | 5     |
| Digital Carrier Packet                      | Complete onboarding packet with all required documentation                 | P1       | 5     |
| Auto-Renewal Alerts                         | Notify carriers when insurance or authority is expiring (60/30/7 day)      | P1       | 5     |

### 4.2 Carrier Quality & Reputation

| Feature                | Description                                                                      | Priority | Phase |
| ---------------------- | -------------------------------------------------------------------------------- | -------- | ----- |
| Rating System          | 5-star rating after load completion — both directions (carrier rates broker too) | P1       | 5     |
| Performance Metrics    | On-time percentage, claims ratio, communication score                            | P1       | 5     |
| Carrier Scorecard      | Comprehensive carrier profile with full performance history                      | P2       | Post  |
| Preferred Carrier List | Brokers/shippers designate preferred carriers for priority access                | P1       | Post  |
| Blacklist / Block      | Block specific carriers or brokers from seeing or bidding on your loads          | P2       | Post  |
| Endorsements           | Verified endorsements from previous business partners                            | P3       | Post  |

### 4.3 Broker Verification

| Feature                    | Description                                                                  | Priority | Phase |
| -------------------------- | ---------------------------------------------------------------------------- | -------- | ----- |
| Broker Authority Check     | FMCSA verification of broker license                                         | P0       | 5     |
| Bond Verification          | Verify surety bond or trust fund ($75,000 minimum required by law)           | P1       | 5     |
| Credit Score / Days-to-Pay | Display average payment timeline and credit reliability to carriers          | P1       | Post  |
| Broker Scorecard           | Full performance profile visible to carriers considering working with broker | P2       | Post  |

---

## 5. Tracking & Visibility

### 5.1 GPS & Location Tracking

| Feature                            | Description                                                           | Priority | Phase |
| ---------------------------------- | --------------------------------------------------------------------- | -------- | ----- |
| Real-Time GPS Tracking             | Live truck location on interactive map                                | P1       | Post  |
| ELD Integration                    | Connect to electronic logging devices for automated position tracking | P1       | Post  |
| Geofencing                         | Automated alerts when truck enters/exits pickup or delivery zones     | P2       | Post  |
| ETA Calculation                    | Dynamic ETA based on live location and traffic                        | P1       | Post  |
| Breadcrumb Trail                   | Historical route visualization showing full path traveled             | P2       | Post  |
| Samsara Integration                | Native integration with Samsara fleet management                      | P2       | Post  |
| Macropoint / Descartes Integration | Load tracking via Macropoint/Descartes (industry standard)            | P2       | Post  |

### 5.2 Shipment Visibility

| Feature                | Description                                                            | Priority | Phase |
| ---------------------- | ---------------------------------------------------------------------- | -------- | ----- |
| Shipment Dashboard     | Single view of all active shipments with status and location           | P0       | 2     |
| Milestone Tracking     | Track key events: pickup, in-transit checkpoints, delivery             | P0       | 4     |
| Shipper Portal         | Read-only tracking view shippers can share with their own customers    | P2       | Post  |
| Delay Alerts           | Automated alerts when shipments are behind schedule                    | P1       | Post  |
| Temperature Monitoring | Real-time temperature logs for refrigerated (reefer) shipments         | P2       | Post  |
| Photo Documentation    | Photo capture at pickup and delivery for cargo condition documentation | P1       | 4     |

---

## 6. Financial & Payment Features

### 6.1 Invoicing & Billing

| Feature                   | Description                                                                 | Priority | Phase |
| ------------------------- | --------------------------------------------------------------------------- | -------- | ----- |
| Auto-Invoice Generation   | Generate invoices automatically upon load completion                        | P0       | 5     |
| Accessorial Charges       | Add detention, layover, lumper, TONU, and other accessorial fees to invoice | P1       | 5     |
| Invoice Submission        | Digital invoice submission with supporting documents attached               | P1       | 5     |
| Invoice Approval Workflow | Multi-step approval: submitted → reviewed → approved → paid                 | P1       | 5     |
| Batch Invoicing           | Generate and submit multiple invoices at once                               | P2       | Post  |
| QuickBooks Integration    | Sync invoices and payments with QuickBooks automatically                    | P1       | Post  |

### 6.2 Payments

| Feature                | Description                                                                    | Priority | Phase |
| ---------------------- | ------------------------------------------------------------------------------ | -------- | ----- |
| In-Platform Payments   | Process payments directly through platform (Stripe/ACH)                        | P1       | 5     |
| Quick Pay              | Expedited payment: 2–5 days for a fee (2%) instead of net-30                   | P1       | 5     |
| Factoring Integration  | Connect with freight factoring companies (RTS Financial, Triumph, OTR Capital) | P2       | Post  |
| Payment Tracking       | Track status: Invoiced → Approved → Processing → Paid → Overdue                | P1       | 5     |
| Payment History        | Full history of all payments sent and received, filterable and exportable      | P2       | Post  |
| Escrow / Trust Account | Hold funds in escrow until delivery confirmation — dispute protection          | P3       | Post  |

### 6.3 Rate Intelligence

| Feature                   | Description                                                          | Priority | Phase |
| ------------------------- | -------------------------------------------------------------------- | -------- | ----- |
| Lane Rate History         | Historical rate data for specific origin-destination pairs           | P1       | Post  |
| Market Rate Index         | Real-time market rate benchmarks by lane, equipment type, and region | P1       | Post  |
| Rate Trends               | Visualize rate trends over time: daily, weekly, monthly, seasonal    | P2       | Post  |
| Rate Alerts               | Notify when rates on saved lanes exceed or drop below set thresholds | P2       | Post  |
| Fuel Surcharge Calculator | Auto-calculate fuel surcharges based on current diesel price index   | P2       | Post  |
| Cost-Per-Mile Analysis    | Breakdown of total cost per mile including all fees and surcharges   | P2       | Post  |

---

## 7. Analytics & Business Intelligence

### 7.1 Operational Dashboards

| Feature                    | Description                                                           | Priority | Phase                  |
| -------------------------- | --------------------------------------------------------------------- | -------- | ---------------------- |
| Revenue Dashboard          | Total revenue, revenue by lane, by customer, revenue trends over time | P1       | 2 (KPIs) → Post (full) |
| Load Volume Dashboard      | Loads posted, booked, completed, cancelled over time                  | P1       | 2 (KPIs) → Post (full) |
| Lane Performance           | Profitability analysis by lane with volume and rate data              | P2       | Post                   |
| Carrier/Broker Leaderboard | Top partners ranked by volume, reliability, and rate                  | P2       | Post                   |
| Utilization Metrics        | Fleet utilization rate, empty miles percentage, deadhead analysis     | P1       | Post                   |

### 7.2 Reports

| Feature                   | Description                                                                  | Priority | Phase |
| ------------------------- | ---------------------------------------------------------------------------- | -------- | ----- |
| Custom Report Builder     | Drag-and-drop metrics and filters to create custom reports                   | P2       | Post  |
| Scheduled Reports         | Auto-generate and email reports on recurring schedule (daily/weekly/monthly) | P2       | Post  |
| Export to CSV / PDF       | Download any report or dataset in CSV or PDF format                          | P1       | Post  |
| Year-over-Year Comparison | Compare performance metrics across equivalent time periods                   | P3       | Post  |
| Tax Reporting             | Generate 1099-NEC and other tax-related reports for carriers                 | P2       | Post  |

### 7.3 Market Intelligence

| Feature                 | Description                                                            | Priority | Phase |
| ----------------------- | ---------------------------------------------------------------------- | -------- | ----- |
| Market Heatmap          | Visual map showing supply/demand hotspots across the US                | P2       | Post  |
| Capacity Forecast       | Predictive analytics for capacity tightness by region and time         | P3       | Post  |
| Seasonal Trends         | Historical patterns for rate and volume by season                      | P3       | Post  |
| Competitor Benchmarking | Anonymous aggregate data comparing your performance to market averages | P3       | Post  |

---

## 8. Compliance & Documentation

### 8.1 Regulatory Compliance

| Feature                 | Description                                                                | Priority | Phase |
| ----------------------- | -------------------------------------------------------------------------- | -------- | ----- |
| FMCSA SAFER Integration | Real-time pull from FMCSA SAFER database for carrier/broker verification   | P0       | 5     |
| Insurance Monitoring    | Automated certificate tracking with expiration alerts at 60/30/7 days      | P0       | 5     |
| HOS Compliance          | Hours of Service tracking and compliance verification                      | P2       | Post  |
| Drug & Alcohol Testing  | Track and verify carrier drug testing compliance program                   | P3       | Post  |
| HAZMAT Certification    | Verify hazmat endorsements for loads requiring hazardous material handling | P2       | Post  |
| State Permit Tracking   | Track oversize/overweight and state-specific permits                       | P3       | Post  |

### 8.2 Document Management

| Feature                 | Description                                                       | Priority | Phase |
| ----------------------- | ----------------------------------------------------------------- | -------- | ----- |
| Bill of Lading (BOL)    | Generate, store, and manage BOL documents                         | P0       | 4     |
| Proof of Delivery (POD) | Upload and store signed POD with photo capture                    | P0       | 4     |
| Rate Confirmation       | Auto-generated rate confirmation with e-signature capability      | P0       | 4     |
| Insurance Certificates  | Store and track insurance cert expiration dates                   | P0       | 5     |
| Document Templates      | Customizable templates for BOL, rate con, and other common docs   | P2       | Post  |
| Document Search         | Full-text search across all stored documents                      | P2       | Post  |
| Audit Trail             | Immutable log of all document actions: upload, view, sign, modify | P1       | 5     |

---

## 9. Automation & AI Features

### 9.1 Intelligent Matching

| Feature              | Description                                                                            | Priority | Phase |
| -------------------- | -------------------------------------------------------------------------------------- | -------- | ----- |
| Auto-Match Engine    | AI matching of loads to trucks: location, equipment, lane history, carrier preferences | P1       | Post  |
| Lane Recommendations | Suggest profitable backhaul lanes to carriers to reduce empty miles                    | P2       | Post  |
| Smart Pricing        | AI-suggested rates based on market conditions, lane history, and demand                | P2       | Post  |
| Capacity Prediction  | Predict capacity tightness on specific lanes                                           | P3       | Post  |
| Load Bundling        | Auto-suggest combining multiple stops into efficient routes                            | P3       | Post  |

### 9.2 Workflow Automation

| Feature                   | Description                                                            | Priority | Phase |
| ------------------------- | ---------------------------------------------------------------------- | -------- | ----- |
| Auto-Dispatch             | Automatically assign loads to carriers based on rules and preferences  | P2       | Post  |
| Auto-Status Updates       | Trigger status changes automatically from geofence events and ELD data | P2       | Post  |
| Recurring Load Scheduling | Auto-re-post loads on recurring schedule (daily, weekly)               | P2       | Post  |
| Rule-Based Alerts         | Custom rules: "alert me if rate drops below $X on Lane Y"              | P2       | Post  |
| Automated Follow-Up       | Auto-send reminders for unsigned rate confirmations, missing PODs      | P2       | Post  |

### 9.3 AI-Powered Features

| Feature                 | Description                                                                 | Priority | Phase |
| ----------------------- | --------------------------------------------------------------------------- | -------- | ----- |
| Natural Language Search | "Find reefer loads from Chicago to LA next week under $3/mile"              | P3       | Post  |
| Predictive Analytics    | Forecast demand, rates, and capacity for planning                           | P3       | Post  |
| Anomaly Detection       | Flag unusual patterns: rate spikes, carrier behavior changes, fraud signals | P3       | Post  |
| Chatbot Assistant       | AI-powered customer support and load search assistant                       | P3       | Post  |
| Route Optimization      | AI-optimized routing for multi-stop loads                                   | P3       | Post  |

---

## 10. Mobile & Accessibility

### 10.1 Mobile Experience

| Feature                           | Description                                                  | Priority | Phase |
| --------------------------------- | ------------------------------------------------------------ | -------- | ----- |
| Responsive Web Design             | Full functionality on tablets and smartphones                | P1       | 2     |
| Progressive Web App (PWA)         | Installable web app with offline capability                  | P2       | Post  |
| Native Mobile App (iOS + Android) | Full native app experience                                   | P2       | Post  |
| Driver Mobile App                 | Simplified: status updates, POD upload, navigation, check-in | P1       | Post  |
| Push Notifications                | Mobile push for bids, bookings, and status changes           | P1       | Post  |
| Offline Mode                      | Queue actions while offline, sync when connectivity returns  | P3       | Post  |

### 10.2 Accessibility

| Feature                | Description                                                 | Priority | Phase |
| ---------------------- | ----------------------------------------------------------- | -------- | ----- |
| WCAG 2.1 AA Compliance | Full accessibility audit and remediation                    | P2       | 6     |
| Keyboard Navigation    | Complete keyboard-only navigation support across all views  | P2       | 6     |
| Screen Reader Support  | Proper ARIA labels and semantic HTML throughout             | P2       | 6     |
| High Contrast Mode     | Alternative color scheme for low-vision users               | P3       | Post  |
| Multi-Language Support | Spanish at minimum; French for Canadian cross-border routes | P3       | Post  |

---

## 11. Marketplace & Network Effects

### 11.1 Network Growth Features

| Feature               | Description                                                                     | Priority | Phase |
| --------------------- | ------------------------------------------------------------------------------- | -------- | ----- |
| Referral Program      | Incentivize users to invite other carriers/brokers/shippers                     | P2       | Post  |
| Company Profiles      | Public-facing company profiles with portfolio, ratings, and verification badges | P2       | Post  |
| Partnership Directory | Searchable directory of all verified carriers and brokers on the platform       | P2       | Post  |
| Featured Listings     | Paid promotion to boost load/truck visibility in search results                 | P3       | Post  |
| Exclusive Lanes       | Premium lanes accessible only to top-rated verified carriers                    | P3       | Post  |

### 11.2 Integration Ecosystem

| Feature               | Description                                                              | Priority | Phase |
| --------------------- | ------------------------------------------------------------------------ | -------- | ----- |
| TMS Integration       | Connect with Transportation Management Systems (MercuryGate, TMW, Aljex) | P1       | Post  |
| ELD / Telematics      | Samsara, KeepTruckin (Motive), Omnitracs integration                     | P1       | Post  |
| Factoring Companies   | RTS Financial, Triumph, OTR Capital — direct integration                 | P2       | Post  |
| Fuel Card Integration | EFS, Comdata, fleet fuel card connectivity                               | P3       | Post  |
| DAT / Truckstop Sync  | Cross-post loads to/from major load boards                               | P2       | Post  |
| Accounting Software   | QuickBooks, Xero, FreshBooks integration                                 | P1       | Post  |
| Open REST API         | RESTful API for custom integrations and enterprise partners              | P2       | Post  |
| Webhook Events        | Real-time event webhooks for load status, bookings, bids, payments       | P2       | Post  |

---

## 12. Admin & Platform Management

### 12.1 Platform Administration

| Feature                      | Description                                                     | Priority | Phase |
| ---------------------------- | --------------------------------------------------------------- | -------- | ----- |
| Admin Dashboard              | Platform-wide metrics, user management, system health overview  | P0       | 5     |
| User Management              | Create, suspend, verify, and manage all user accounts           | P0       | 5     |
| Role & Permission Management | Granular permissions per user and company role                  | P1       | 5     |
| Company Account Management   | Multi-user companies with admin/member roles within one account | P1       | 5     |
| Dispute Resolution           | Mediation tools for payment, service, and cargo damage disputes | P2       | Post  |
| Content Moderation           | Review and moderate load postings, reviews, and messages        | P2       | Post  |

### 12.2 Platform Operations

| Feature                          | Description                                                        | Priority | Phase |
| -------------------------------- | ------------------------------------------------------------------ | -------- | ----- |
| System Health Monitoring         | Uptime, response times, error rates, database health dashboard     | P0       | 6     |
| Feature Flags                    | Toggle features on/off without deployment                          | P1       | Post  |
| A/B Testing                      | Test UI variations and feature rollouts with split traffic         | P3       | Post  |
| Audit Logging                    | Comprehensive immutable log of all user and system actions         | P1       | 6     |
| Data Backup & Recovery           | Automated backups with point-in-time recovery (Supabase PITR)      | P0       | 6     |
| Rate Limiting & Abuse Prevention | Protect against spam, scraping, credential stuffing, and API abuse | P1       | 5     |

---

## 13. Feature Priority Matrix (from client guide — preserved exactly)

### Tier 1 — MVP / Beta Launch (Must-Have)

| #   | Feature                                          | Category            |
| --- | ------------------------------------------------ | ------------------- |
| 1   | Real database with data persistence              | Core Infrastructure |
| 2   | Secure authentication (email/password + OAuth)   | Core Infrastructure |
| 3   | Load posting with full details                   | Core Load Board     |
| 4   | Truck/equipment posting                          | Core Load Board     |
| 5   | Advanced search with radius and filters          | Core Load Board     |
| 6   | Load status lifecycle (posted through delivered) | Booking             |
| 7   | Rate bidding and Book-It-Now                     | Booking             |
| 8   | Rate confirmation generation                     | Booking             |
| 9   | Per-load messaging                               | Communication       |
| 10  | In-app and email notifications                   | Communication       |
| 11  | MC/DOT carrier verification (FMCSA lookup)       | Carrier Management  |
| 12  | Insurance verification                           | Carrier Management  |
| 13  | Basic invoicing                                  | Financial           |
| 14  | BOL and POD document management                  | Compliance          |
| 15  | Admin dashboard and user management              | Admin               |

### Tier 2 — Growth Phase (Should-Have)

| #   | Feature                                 | Category      |
| --- | --------------------------------------- | ------------- |
| 16  | Saved lanes with smart alerts           | Search        |
| 17  | Rating and review system                | Quality       |
| 18  | Real-time GPS tracking                  | Visibility    |
| 19  | In-platform payments (Stripe/ACH)       | Financial     |
| 20  | Quick Pay option                        | Financial     |
| 21  | Lane rate history and market benchmarks | Intelligence  |
| 22  | Revenue and performance dashboards      | Analytics     |
| 23  | Responsive mobile design                | Mobile        |
| 24  | Carrier performance scorecard           | Quality       |
| 25  | Preferred carrier lists                 | Quality       |
| 26  | SMS notifications                       | Communication |
| 27  | Digital signature on documents          | Compliance    |
| 28  | QuickBooks integration                  | Integration   |
| 29  | ELD/telematics integration              | Integration   |
| 30  | Recurring load scheduling               | Automation    |

### Tier 3 — Scale Phase (Nice-to-Have)

| #   | Feature                                 | Category      |
| --- | --------------------------------------- | ------------- |
| 31  | AI-powered load matching                | Automation    |
| 32  | Backhaul lane recommendations           | AI            |
| 33  | Smart pricing suggestions               | AI            |
| 34  | Native mobile apps (iOS/Android)        | Mobile        |
| 35  | Driver-specific mobile app              | Mobile        |
| 36  | TMS integrations                        | Integration   |
| 37  | DAT/Truckstop cross-posting             | Integration   |
| 38  | Open REST API                           | Integration   |
| 39  | Custom report builder                   | Analytics     |
| 40  | Market heatmap and capacity forecasting | Intelligence  |
| 41  | Multi-language support                  | Accessibility |
| 42  | Referral program                        | Growth        |
| 43  | Featured/promoted listings              | Revenue       |
| 44  | Natural language search                 | AI            |
| 45  | Route optimization                      | AI            |

---

## Competitive Feature Comparison (from client guide — preserved exactly)

| Feature              | DAT     | Truckstop | Convoy      | FreightX (Planned)       |
| -------------------- | ------- | --------- | ----------- | ------------------------ |
| Load Board           | Yes     | Yes       | Yes         | Yes                      |
| Truck Posting        | Yes     | Yes       | No          | Yes                      |
| Rate Bidding         | Limited | Yes       | Automated   | Yes                      |
| GPS Tracking         | Yes     | Yes       | Yes         | Planned                  |
| In-App Messaging     | Basic   | Basic     | Yes         | Planned                  |
| Payment Processing   | No      | Yes       | Yes         | Planned                  |
| AI Matching          | No      | Limited   | Yes         | Planned                  |
| Mobile App           | Yes     | Yes       | Yes         | Planned                  |
| Carrier Verification | Yes     | Yes       | Yes         | Planned                  |
| Rate Intelligence    | Yes     | Yes       | Proprietary | Planned                  |
| Open API             | Limited | Yes       | No          | Planned                  |
| Multi-Role Platform  | No      | No        | No          | **Yes (Differentiator)** |

**Key differentiator:** FreightX is the only platform where Carriers, Brokers, and Shippers all operate in the same system. Most competitors serve one or two roles, requiring users to switch between platforms.

---

_This catalog is the complete, unabridged feature set from the client's industry guide. Nothing has been removed. Every feature is tracked here regardless of implementation phase._

---

## Phase 13 — Enterprise Features (Added March 2026)

### Email & SMS Notifications

- ✅ Role-aware HTML email templates (7 templates via Resend)
- ✅ SMS notifications for critical events (Twilio)
- ✅ Per-user notification preferences with channel toggles (push/email/SMS)
- ✅ Background notification queue with exponential backoff retry

### Multi-User Company Accounts

- ✅ Invite teammates by email with role assignment
- ✅ Roles: owner, admin, dispatcher, accounting, viewer
- ✅ Revoke access and change roles at any time
- ✅ Pending invite management with expiry

### Load Templates

- ✅ Save any post-load form state as a named template
- ✅ Apply template with one tap — pre-fills all fields
- ✅ Company-shared templates visible to all team members

### Digital E-Signature

- ✅ Canvas signature pad (no external vendor)
- ✅ Signature stored as PNG in Supabase Storage
- ✅ Signed rate confirmations with timestamp + signatory name on bids

### Accessorial Charges

- ✅ Carriers submit charges (detention, lumper, layover, TONU, fuel surcharge)
- ✅ Broker approves or denies each charge
- ✅ Invoice total auto-updates with approved accessorials

### Audit Trail

- ✅ Every load, bid, booking, and payment action logged
- ✅ Diff viewer shows before/after state
- ✅ Admin dashboard audit trail page with filters

### Saved Searches + Lane Alerts

- ✅ Save any filter combination with a name
- ✅ Enable/disable email + SMS alerts per saved search
- ✅ In-app notification when matching load is posted

### Broker Credit Score

- ✅ Avg days-to-pay displayed on load cards and detail views
- ✅ On-time payment percentage
- ✅ Color-coded trust signal (green/yellow/red)

### Preferred Carrier Lists & Blocking

- ✅ Mark carriers as preferred or blocked
- ✅ Loads can be restricted to preferred carriers only
- ✅ Blocked carriers cannot see or bid on company loads (RLS enforced)

### Lane Rate Intelligence

- ✅ Historical rate/mile data captured on every booking
- ✅ Market rate display on load posting form
- ✅ get_lane_stats() RPC for avg/min/max over any window
- ✅ Daily trend data for sparkline charts

### AI Rate Suggestions (Claude Sonnet)

- ✅ Low/Mid/High rate range for any lane
- ✅ Confidence level based on sample size
- ✅ One-tap to apply suggested rate to posting form
- ✅ Falls back to national averages when no history exists

### Scale Infrastructure

- ✅ Server-side pagination on all list queries (25 rows/page)
- ✅ Full-text search with GIN indexes + generated tsvector column
- ✅ Edge rate limiting (Vercel KV sliding window)
- ✅ GPS location cleanup scheduled via pg_cron
