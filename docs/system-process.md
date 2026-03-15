# SafeDrive 2.0 — Complete System Process Flow

## Overview

SafeDrive 2.0 is a **peer-to-peer car rental platform** similar to Airbnb but for cars. It connects car owners (listers) with renters through a verified, commission-based system using PayMongo for payment processing (test mode).

**Architecture:** Two separate SPAs (User App + Admin App) sharing the same Supabase backend and code repository.

---

## 1. User Registration & Authentication

### 1.1 Sign Up Flow
1. User visits landing page → clicks **"Get Started"** or **"Sign Up"**
2. User enters:
   - Valid email address
   - Password
   - Confirm password (must match)
3. System calls `supabase.auth.signUp()` → Supabase sends a **confirmation email**
4. User clicks confirmation link in email → account activated
5. Upon first login, a DB trigger (`handle_new_user`) auto-creates a profile row with:
   - `role = 'user'`
   - `verified_status = 'unverified'`
   - `is_lister = false`
6. User is now a **free user** — can browse but cannot book or list

### 1.2 Login Flow
1. User enters email + password → clicks **"Sign In"**
2. System calls `supabase.auth.signInWithPassword()`
3. On success → redirect to `/browse` (renter mode is the default)
4. Profile is fetched from `profiles` table to determine verification/role state

---

## 2. Identity Verification

### 2.1 User Side
1. User clicks **profile icon** → dropdown shows **"Get Verified"** label
2. User clicks "Get Verified" → navigates to `/verify`
3. User fills out the verification form:
   - **Personal Info:** First name, middle name, last name
   - **Contact:** Phone number
   - **Address:** Full address
   - **Birthday:** Date of birth
   - **Driver's License Number:** Text input
   - **National ID Number:** Text input
   - **6 Required Images:**
     - Driver's license FRONT
     - Driver's license BACK
      - National ID FRONT
      - National ID BACK
     - Selfie holding the ID
     - Selfie (face only)
   - File restrictions: JPG/PNG only, max 5MB each
4. User clicks **"Submit for Verification"**
5. Images uploaded to Supabase Storage bucket `user-verification`
6. Image paths stored in `verification_images` table
7. Profile updated: `verified_status = 'pending'`
8. Audit log entry created: `verification_submitted`
9. User sees "Verification Pending" status until admin reviews

### 2.2 Admin Side (User Verification)
1. Admin navigates to **"Users"** tab in admin dashboard
2. Table shows all users with their verification status
3. Admin clicks a pending user → **modal opens** showing:
   - Full name, email, phone, address, birthday
   - Driver's license number, National ID number
   - All 6 uploaded images (viewable/downloadable)
4. Admin inspects all information and images
5. Admin can:
   - **Approve** → `verified_status = 'verified'`, audit log entry created
   - **Reject** → Modal asks for **rejection reason** (text input), `verified_status = 'rejected'`, `rejection_reason` saved, audit log entry created
6. If rejected, user sees rejection message + reason on their verification page and can resubmit

---

## 3. Renter Mode (Default User Mode)

After login, the default user role is **Renter**. Navigation shows:
- **Browse Cars** — view all listed vehicles
- **My Bookings** — track rental requests and active bookings

### 3.1 Browse Cars
1. User sees a **card grid** of all approved/active vehicles
2. Each card shows: brand, model, body type, seats, fuel type, price/day, location, car image
3. **Filters available:** search by name/location, filter by body type
4. Clicking a card → navigates to **Car Detail page**

### 3.2 Car Detail & Booking
1. Car detail page shows:
   - **Image gallery** with carousel (up to 4 images)
   - Vehicle specs: brand, model, body type, seats, fuel type, mileage
   - Location (pickup/dropoff)
   - Additional info from owner
   - Owner's contact number
   - **Rental agreement** download (if uploaded)
   - ❌ ORCR is NOT shown (admin only)
2. **Booking form** (sticky sidebar):
   - Start date picker
   - End date picker
3. On clicking **"Request to Book"**:
   - **Pricing calculated:**
     - `base_price = price_per_day × total_days` (goes to owner)
     - `commission = price_per_day × 0.10 × total_days` (our 10% commission + PayMongo fees)
     - `total_price = base_price + commission`
     - `downpayment = total_price × 0.50` (50% of total)
     - `balance = total_price - downpayment`
   - Booking created with status: `pending_owner`
   - `owner_response_deadline` set to **24 hours from now**
   - Audit log: `booking_created`

### 3.3 Booking Lifecycle

```
pending_owner ──→ owner_accepted ──→ pending_payment ──→ downpayment_paid ──→ active
     │                                      │                                    │
     │ (24hr timeout)                       │ (24hr timeout)                     │
     ▼                                      ▼                                    │
   expired                               expired                                │
                                                                                 │
     owner_rejected ←── manual reject                                            │
                                                                                 │
                                                              pending_balance ←──┘
                                                                   │
                                                                   ▼
                                                              fully_paid ──→ completed
```

**State transitions:**
1. `pending_owner` → Owner has 24 hours to respond
   - Accept → `owner_accepted` → auto-transitions to `pending_payment`
   - Reject → `owner_rejected`
   - Timeout (24hr) → `expired` (auto by Supabase Edge Function cron)
2. `pending_payment` → Renter has 24 hours to pay downpayment
   - Pay via PayMongo → `downpayment_paid`
   - Timeout (24hr) → `expired` (auto by cron)
3. `downpayment_paid` → Waiting for rental start date → becomes `active` on start date
4. `active` → Rental in progress
   - Before end date, renter should pay **remaining balance**
   - If not paid, accumulates demerit/reputation impact
5. `pending_balance` → Balance paid → `fully_paid`
6. `fully_paid` → Both renter and owner click **"Mark Complete"** → `completed`
   - If neither party reports issues within 2 days after end date → auto-complete
7. `completed` → Admin manually sends owner payout via PayMongo dashboard

### 3.4 My Bookings (Renter)
Shows all bookings with:
- Car info (brand, model, plate number)
- Start/end dates, total days
- Pricing breakdown (total, downpayment, balance)
- Booking status badge
- **Actions by status:**
  - `pending_payment` → "Pay Downpayment" button → PayMongo checkout
  - `active` / `pending_balance` → "Pay Balance" button
  - `active` / `fully_paid` → "Mark Complete" button
  - Rental agreement download

---

## 4. Lister Mode

### 4.1 Switching to Lister
1. User clicks **profile icon** → dropdown shows **"Switch to Lister"** toggle
2. Profile updated: `is_lister = true` 
3. Navigation changes to show: **My Vehicles** + **Bookings Received**
4. Browse Cars and My Bookings remain accessible
5. To switch back: click **"Switch to Renter"**

### 4.2 My Vehicles
- Shows all vehicles listed by the user
- **Free users get 5 vehicle slots**
- Want more? Subscribe (₱399/month for 15 additional slots via PayMongo payment link)
- Each vehicle shows: brand, model, plate, price/day, status badge

### 4.3 Adding a Vehicle
1. Click **"Add Vehicle"** → form opens:
   - **Brand** (select from admin-managed car catalog)
   - **Model** (select, filtered by brand — pre-filled body type, seats, fuel type)
   - **Plate Number** (LTO format, 7 characters)
   - **Mileage** (numbers only)
   - **Daily Price** (₱)
   - **Pickup/Dropoff Location** (text)
   - **Additional Info** (text box)
   - **Owner Contact Number** (phone)
   - **Car Images** (up to 4, JPG/PNG)
   - **ORCR Document** (image upload — shown to admin only)
   - **Rental Agreement** (file upload — available to renter for download/print)
2. Click **"Submit for Approval"**
3. Files uploaded to Supabase Storage `vehicle-documents`
4. Car created with `status = 'pending'`
5. Audit log: `vehicle_submitted`

### 4.4 Bookings Received (Lister)
Shows all booking requests for the lister's cars:
- Renter info: selfie, name, birthday, address, phone
- Car details: which car was booked, plate number
- Booking dates: start, end, total days
- Pickup/dropoff location
- Total price
- Payment status (downpayment paid, balance paid)
- **Actions:**
  - `pending_owner` → **Accept** or **Reject** buttons
  - `active` / `fully_paid` → **"Mark Complete"** button
  - Can see renter's verification info to confirm identity at meetup

---

## 5. Admin Dashboard

**Separate SPA** at `/admin` route (same codebase, different layout). Accessible only to users with `role = 'admin'`.

### 5.1 Dashboard
- Overview stats: total users, pending verifications, active listings, active bookings, revenue
- Quick links to pending items

### 5.2 Users Tab
- **Table** of all users with columns: name, email, verification status, role, date joined
- Filter by status (unverified, pending, verified, rejected)
- Click row → **Modal** opens with:
  - All personal info (name, phone, address, birthday)
  - Driver's license & national ID numbers
  - All 6 verification images (viewable)
  - **Approve** button → sets `verified_status = 'verified'`
  - **Reject** button → opens text input for reason → sets `verified_status = 'rejected'`

### 5.3 Car Catalog
Admin manages the master list of car brands and models:
1. **Car Brands** — Add/edit brand names (e.g., Toyota, Honda, Ford)
2. **Car Models** — Under each brand, add models with:
   - Model name (e.g., Vios, Civic, Ranger)
   - Body type (sedan, suv, hatchback, van, pickup, coupe, convertible, wagon, mpv)
   - **Seats auto-set by body type:**
     - Sedan: 5, Coupe: 4, Hatchback: 5, SUV: 7, Van: 12-15, Pickup: 5, Convertible: 4, Wagon: 5, MPV: 7
   - Fuel type (gasoline, diesel, electric, hybrid)
3. This catalog is used by listers when adding vehicles

### 5.4 Vehicle Approval
- **Table** of all submitted vehicles with `status = 'pending'`
- Click row → **Modal** shows:
  - Car brand & model (from catalog)
  - Preset info (body type, seats, fuel type)
  - User-provided info: plate number, mileage, pricing, location, additional info
  - Car images (up to 4)
  - **ORCR document** (only visible here, not to public)
  - **Owner's personal info** (from their verification) for cross-checking:
    - Name on ORCR should match user's verified name
  - **Approve** → `status = 'approved'` → car gets listed publicly
  - **Reject** → reason required → notification to user

### 5.5 Audit Trail
- **Chronological log** of all system actions:
  - User actions: verification submitted, vehicle listed, booking created, payment made
  - Admin actions: user approved/rejected, vehicle approved/rejected, payout sent
- Table with columns: timestamp, user/admin, action, entity type, details
- Search/filter by action type, user, or date range

### 5.6 Send Payments (Payout Management)
- Shows all **completed bookings** where payout hasn't been sent
- Each entry shows: booking details, total price, commission deducted, net payout amount
- **Payout calculation:**
  - `owner_receives = base_price` (the daily rate × days, without commission)
  - Commission stays with SafeDrive platform
- Admin clicks **"Mark as Sent"** after manually sending via PayMongo dashboard
- Creates payment record with `payment_type = 'payout'`

---

## 6. Payment Flow (PayMongo Test Mode)

Since PayMongo's split-payment requires a legitimate business, we use **test mode with manual payout:**

### 6.1 Downpayment (Renter → System)
1. After owner accepts booking, renter has 24 hours to pay
2. Renter clicks **"Pay Downpayment"** → system creates PayMongo checkout session
3. Amount = `downpayment_amount` (50% of total)
4. Renter completes payment on PayMongo checkout page
5. PayMongo webhook confirms payment → booking status → `downpayment_paid`
6. Payment stored with admin PayMongo account

### 6.2 Balance Payment (Renter → System)
1. Before or during rental period, renter pays remaining balance
2. Renter clicks **"Pay Balance"** → PayMongo checkout session
3. Amount = `balance_amount`
4. On completion → booking status → `fully_paid`

### 6.3 Owner Payout (Admin → Owner, Manual)
1. After booking is `completed`
2. Admin reviews in **Send Payments** tab
3. Admin manually sends money to owner via PayMongo dashboard/bank transfer
4. Admin clicks **"Mark as Sent"** in the system
5. Audit log: `payout_sent`

### 6.4 Refund (Owner No-Show)
1. If owner does not show up for the meetup
2. Renter reports issue
3. Admin can process **refund** of the downpayment
4. Refund handled manually through PayMongo dashboard
5. Admin marks refund in system → `payment_type = 'refund'`

### 6.5 Subscription Payment (Lister → System)
1. Listers wanting more than 5 vehicle slots
2. ₱399/month for 15 additional slots
3. Payment via PayMongo payment link
4. On completion → subscription record created in `subscriptions` table

---

## 7. Automatic Timeouts (Supabase Edge Function Cron)

### 7.1 Owner Response Timeout
- Runs every hour
- Checks bookings with `status = 'pending_owner'` where `owner_response_deadline` has passed
- Auto-update to `status = 'expired'`

### 7.2 Payment Timeout
- Runs every hour
- Checks bookings with `status = 'pending_payment'` where `payment_deadline` has passed
- Auto-update to `status = 'expired'`

### 7.3 Auto-Complete
- Runs daily
- Checks bookings with `status = 'fully_paid'` or `status = 'active'` where `end_date + 2 days` has passed
- If no disputes reported → auto-update both `renter_completed = true`, `owner_completed = true`, `status = 'completed'`
- Notifies admin to send payout

---

## 8. Commission & Pricing Model

### For a ₱2,000/day car rented for 3 days:
| Item | Calculation | Amount |
|------|------------|--------|
| Base price (owner gets) | ₱2,000 × 3 days | ₱6,000 |
| Commission (10%) | ₱2,000 × 0.10 × 3 | ₱600 |
| **Total price (renter pays)** | | **₱6,600** |
| Downpayment (50%) | ₱6,600 × 0.50 | ₱3,300 |
| Balance remaining | ₱6,600 - ₱3,300 | ₱3,300 |
| **Owner payout** | Base price only | **₱6,000** |
| **Platform keeps** | Commission | **₱600** |

---

## 9. System Security & Access Control

### Row Level Security (RLS)
- Users can only read/update their own profiles
- Users can see approved/active cars (public browse)
- Users can only see their own bookings (renter) or bookings for their cars (lister)
- Admins can read/update all records
- Audit log: insert-only for users, read-all for admins

### Role-Based Access
- `role = 'user'` → User SPA (renter + lister modes)
- `role = 'admin'` → Admin SPA (dashboard, user mgmt, vehicle approval, audit, payouts)

---

## 10. Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend (User) | React 18, TypeScript, Vite, Tailwind CSS |
| Frontend (Admin) | Same codebase, separate routes/layout |
| UI Components | shadcn/ui (Button, Card, Input, Select, Table, etc.) |
| Backend | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| Payments | PayMongo (Test Mode) |
| State Management | React Context (Auth), TanStack React Query |
| Forms | React Hook Form + Zod validation |
| Routing | React Router v6 |
