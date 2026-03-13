# SafeDrive 2.0 Car Rental System Implementation Plan

## Overview
This implementation plan outlines the steps to build the SafeDrive 2.0 peer-to-peer car rental system based on the approved design. The system consists of two separate SPAs (user and admin) sharing a Supabase backend.

## Phase 1: Project Setup and Foundation
### 1.1 Repository Structure
- Set up monorepo or two separate repositories for user and admin SPAs
- Configure shared Supabase backend
- Set up development environment with Vite, React, TypeScript

### 1.2 Supabase Configuration
- Create Supabase project
- Set up authentication (email/password)
- Design database schema:
  - Users table (id, email, full_name, phone, address, birthday, driver_license, national_id, verified_status, role)
  - Cars table (id, user_id, brand, model, body_type, seats, fuel_type, plate_number, mileage, price_per_day, status)
  - Bookings table (id, car_id, renter_id, start_date, end_date, total_price, downpayment_paid, balance_paid, status)
  - Payments table (id, booking_id, amount, payment_type, status, transaction_id)
  - Audit_log table (id, user_id, action, details, timestamp)
- Configure storage buckets:
  - user-verification (private)
  - vehicle-documents (mixed: public for car images, private for ORCR)
  - rental-agreements (private)

### 1.3 Shared Components and Utilities
- Create shared UI component library (buttons, inputs, modals, tables)
- Set up Supabase client utility
- Create authentication hooks and utilities
- Set up image upload/download utilities with validation (JPG/PNG, max 5MB)

## Phase 2: User SPA Development
### 2.1 Authentication System
- Landing page with Sign Up/Login buttons
- Sign Up form with email, password, confirm password
- Email verification via Supabase
- Login form with email/password
- Protected routes for verified users only

### 2.2 User Verification Flow
- Profile icon dropdown with Verify option
- Verification form collecting:
  - Personal info (first, middle, last name, contact, address, birthday)
  - ID numbers (driver's license, national ID)
  - Image uploads (4 images: license front/back, selfie holding ID, selfie)
- Form submission to pending verification state
- Admin notification system (to be implemented in admin SPA)

### 2.3 Renter Mode
- Browse Car page with filters (body type)
- Car listing cards showing basic info and price
- Car detail page with full information and images
- Booking form with date selection
- Booking confirmation and owner notification
- My Bookings page showing ongoing/past bookings
- Payment processing for downpayment and balance
- Session completion confirmation

### 2.4 Lister Mode (Toggled via Profile)
- My Vehicles page showing listed vehicles (max 5 slots)
- Add vehicle form (integrated with vehicle approval flow)
- Subscription management for additional slots
- Bookings received page showing incoming requests
- Communication with renters (to be enhanced with chat later)

### 2.5 Payment Processing (PayMongo Test Mode)
- Integrate PayMongo API for test mode
- Downpayment processing (50% of total)
- Balance payment processing
- Commission calculation (10% of rental original price set by owner)
- Manual fund transfer preparation (admin will handle actual transfers)

## Phase 3: Admin SPA Development
### 3.1 Authentication and Access Control
- Admin-only login (predefined admin roles in Supabase)
- Route protection for admin interfaces

### 3.2 Dashboard
- Platform statistics overview
- Navigation to all admin tabs

### 3.3 Users Tab
- Table of pending verification submissions
- Modal view showing all submitted information and images
- Approve/Reject buttons with optional rejection reason
- Notification system to inform users of verification status

### 3.4 Car Catalog Tab
- Interface to manage car brands and models
- For each model: body type, automatic seat calculation, fuel type
- This defines what users can list

### 3.5 Vehicle Approval Tab
- Table of pending vehicle submissions
- Modal view showing:
  - Car info from catalog
  - User-provided details (plate, mileage, price, location)
  - ORCR image (admin-only)
  - Car images (up to 4)
  - Rental agreement file
  - Additional information
  - Owner contact
- Verification: cross-check owner name with verified user info
- Accept/Reject with optional reason

### 3.6 Audit Trail Tab
- Log of all system actions:
  - User verification events
  - Vehicle submission/approval events
  - Booking creation/payment/completion events
  - Admin actions
- Filterable and searchable

### 3.7 Send Payments Tab
- List of completed rentals ready for payout
- Interface to select rental and initiate payment to owner
- Refund processing capability
- Payment status tracking
- Manual transfer preparation (admin executes actual transfers outside system)

## Phase 4: Integration and Testing
### 4.1 End-to-End Flows
- User registration → verification → browsing → booking → payment → completion
- Vehicle listing submission → approval → availability for booking
- Admin verification and approval workflows
- Payment flow simulation with PayMongo test mode

### 4.2 Testing
- Unit tests for components and utilities
- Integration tests for key workflows
- User acceptance testing for core features
- Performance testing for image loading and data fetching

### 4.3 Security Review
- Verify image storage access controls
- Confirm role-based access protection
- Validate input sanitization
- Review authentication flows

## Phase 5: Deployment and Launch
### 5.1 Deployment Setup
- Configure separate builds for user and admin SPAs
- Set up deployment pipelines (Vercel/Netlify or similar)
- Configure environment variables for each domain
- Set up custom domains: user.safedrive.com and admin.safedrive.com

### 5.2 Launch Preparation
- Create documentation for users and admins
- Prepare support materials
- Plan for initial user acquisition and verification
- Establish admin procedures for verification and approval

## Technical Details

### Frontend Stack
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Headless UI components (via @headlessui/react or similar)
- Form handling with React Hook Form
- State management with React Query/TanStack Query
- Routing with React Router v6

### Backend Stack
- Supabase (PostgreSQL + Auth + Storage)
- PayMongo API integration (test mode)
- Custom functions via Supabase Edge Functions if needed

### Key APIs to Integrate
- Supabase Auth and Database
- Supabase Storage
- PayMongo API (test mode)
- Optional: Email service for notifications (Supabase has built-in)

### Development Milestones
1. Week 1-2: Project setup, Supabase schema, shared components
2. Week 3-4: User SPA authentication and verification
3. Week 5-6: User SPA renter/lister modes and booking flow
4. Week 7-8: Admin SPA dashboard and users/vehicle approval tabs
5. Week 9-10: Admin SPA audit trail and send payments tabs
6. Week 11-12: Integration, testing, and deployment preparation
7. Week 13-14: Final testing, security review, and launch

## Risks and Mitigations
- **Risk**: Image upload/storage costs
  **Mitigation**: Implement image compression and optimize storage usage
- **Risk**: Payment processing complexity
  **Mitigation**: Use PayMongo test mode thoroughly before considering live mode
- **Risk**: Admin verification workload
  **Mitigation**: Build efficient UI for quick verification decisions
- **Risk**: Legal compliance for peer-to-peer rental
  **Mitigation**: Include rental agreement templates and recommend legal consultation

## Future Enhancements (Post-Launch)
- Real-time chat between renters and owners
- Rating and review system
- Insurance integration
- Advanced analytics and reporting
- Mobile applications (React Native)
- Enhanced subscription models
- Promotional and discount codes