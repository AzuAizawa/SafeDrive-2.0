# SafeDrive 2.0 Car Rental System Design

## 1. System Overview

SafeDrive 2.0 is a peer-to-peer car rental platform that connects car owners (listers) with renters. The system consists of two separate single-page applications (SPAs):
- User-facing application (user.safedrive.com) for browsing, booking, and managing rentals
- Admin-facing application (admin.safedrive.com) for verifying users, approving vehicles, and managing the platform

Both applications share the same Supabase backend for data storage and authentication.

## 2. User SPA (user.safedrive.com)

### 2.1 Authentication Flow
- Landing page with Sign Up and Log In buttons
- Sign Up requires valid email and password confirmation
- Email verification via Supabase confirmation email
- Log In with email and password
- Free user status after login
- Verification required for full system access

### 2.2 User Verification Process
- Access via profile icon dropdown → Verify button
- Required information:
  - Full name (first, middle, last)
  - Contact number
  - Address
  - Birthday
  - Driver's license number
  - National ID number
- Required images (JPG/PNG, max 5MB each):
  - Driver's license front
  - Driver's license back
  - national id front
  - national id back
  - Selfie holding the ID
  - Selfie
- Submission sends data to admins for approval

### 2.3 Renter Mode (Default)
- Browse Car tab: View available cars with body type filters
- My Bookings tab: View ongoing and past bookings

### 2.4 Lister Mode (Toggled via profile icon)
- My Vehicles tab: Manage listed vehicles (up to 5 slots, expandable via subscription)
- Bookings tab: View and manage incoming booking requests

### 2.5 Booking Process (Renter)
1. Search and select car
2. View car details page
3. Select start and end dates
4. Confirm dates → sends approval request to owner
5. Owner has 24 hours to accept/reject
6. If accepted, 24-hour window for renter to pay downpayment (50% of total)
7. Downpayment held in system via PayMongo (test mode)
8. Remaining balance due during rental period before end date
9. After completion, both parties click "Complete" session
10. Admin releases payment to owner (minus commission and taxes)

### 2.6 Payment Processing
- Uses PayMongo in test mode
- Downpayment processed through system
- Commission: 10% of rental original price set by owner
- Example: 2,000/day price → 200 commission per day (10% of 2,000)
- For 3-day rental: 6,600 total (6,000 base + 200 commission)
- Downpayment: 50% of total (3,100 in example)
- Remaining balance: 3,100
- After completion, admin manually transfers funds to owner (minus PayMongo fees and system commission)

## 3. Admin SPA (admin.safedrive.com)

### 3.1 Dashboard
- Overview of platform statistics
- Navigation tabs: Users, Car Catalog, Vehicle Approval, Audit Trail, Send Payments

### 3.2 Users Tab
- Table of users submitted for verification
- Modal view shows all submitted information and images
- Admin can Approve or Reject
- Approved users gain full system access
- Rejected users receive notification with admin-provided reason

### 3.3 Car Catalog Tab
- Manage car brands and models
- For each brand, add models
- For each model, specify:
  - Body type (sedan, SUV, etc.)
  - Automatic seat count based on body type
  - Fuel type
- This catalog defines what users can list

### 3.4 Vehicle Approval Tab
- Table of vehicles submitted by users for listing
- Modal view shows:
  - Car brand and model (from catalog)
  - Preset info from catalog
  - User-provided: plate number, mileage, pricing, pickup/drop-off location
  - ORCR image (admin-only)
  - Up to 4 car images
  - Rental agreement file
  - Additional information text box
  - Owner contact number
- Admin can Accept or Reject
- Verification includes cross-checking owner name with verified user info
- Accepted vehicles become available for browsing

### 3.5 Audit Trail Tab
- Logs all significant actions:
  - User verification submissions and approvals
  - Vehicle submission and approvals
  - Booking creations, payments, completions
  - Admin actions

### 3.6 Send Payments Tab
- Interface for admins to transfer funds to owners after rental completion
- Shows completed rentals ready for payout
- Allows admin to select rental and initiate payment to owner via manual transfer
- Also processes refunds to renters if needed (e.g., cancellations, disputes)
- Displays payment status and history

## 4. Shared Backend (Supabase)

### 4.1 Database Schema
- Users table: profile information, verification status, role
- Cars table: vehicle information, owner reference, status
- Bookings table: rental transactions, dates, payment status
- Payments table: transaction records with PayMongo
- Audit log table: system actions for trail

### 4.2 Authentication
- Supabase Auth for email/password management
- Role-based access control (user vs admin)
- Separate subdomains handled via frontend routing

### 4.3 Storage
- Supabase Storage for user verification images
- Supabase Storage for vehicle documents (ORCR, car images, rental agreements)
- Bucket structure organized by type and user/vehicle ID

## 5. Authentication and Authorization

### 5.1 User Roles
- Free user: logged in but not verified
- Verified user: completed verification process
- Admin: platform administrators (predefined in Supabase)

### 5.2 Access Control
- User SPA: accessible to all, but verified status required for listing/booking
- Admin SPA: restricted to admin roles only
- Route protection implemented in each SPA

## 6. Image Storage

- All images stored in Supabase Storage
- Verification images: private bucket, accessible only to admins
- Vehicle images: public bucket for car browsing, private for ORCR
- Image validation: JPG/PNG format, max 5MB per file

## 7. Payment Processing (PayMongo Test Mode)

- Integration via PayMongo API
- Test mode allows simulation without real transactions
- Manual fund transfer by admin after rental completion
- Commission and tax calculations applied as described

## 8. Key Features and Workflows

### 8.1 User Verification Workflow
1. User submits verification form with required data and images
2. Data stored in pending verification state
3. Admin reviews submission in Users tab
4. Admin approves or rejects with optional reason
5. User notified of outcome
6. Approved users gain verified status

### 8.2 Vehicle Listing Workflow
1. Verified user submits vehicle listing form
2. Data stored in pending vehicle approval state
3. Admin reviews submission in Vehicle Approval tab
4. Admin verifies owner identity matches verified user
5. Admin approves or rejects with optional reason
6. Approved vehicles appear in browse catalog

### 8.3 Booking Workflow
1. Renter searches and selects vehicle
2. Renter selects dates and submits booking request
3. Booking stored as pending owner approval
4. Owner notified and has 24 hours to respond
5. If accepted, renter notified to pay downpayment within 24 hours
6. Downpayment processed via PayMongo (test mode)
7. System holds funds
8. Renter pays remaining balance before end date via system
9. After completion, both parties confirm session end
10. Admin releases funds to owner (minus fees and commission)

### 8.4 Subscription Model
- Users can subscribe for additional vehicle slots
- 399 for 15 additional slots for 1 month
- Managed via Supabase payments or integrated billing

## 9. Non-Functional Requirements

### 9.1 Performance
- Responsive design for mobile and desktop
- Efficient data fetching with Supabase real-time capabilities
- Image optimization for faster loading

### 9.2 Security
- Email verification for account authenticity
- Secure image storage with proper access controls
- Role-based access preventing unauthorized admin access
- Payment data handled securely via PayMongo (no card details stored on our servers)

### 9.3 Scalability
- Separate SPAs allow independent scaling
- Supabase provides scalable backend
- Modular design facilitates feature additions

## 10. Future Enhancements

- Real-time chat between renters and owners
- Insurance integration
- Rating and review system
- Advanced analytics dashboard for admins
- Mobile applications (React Native)