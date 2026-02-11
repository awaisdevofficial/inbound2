# Call Analysis Implementation Summary

## Overview
This implementation adds AI-powered call analysis and categorization to the Inbound Genie system. When calls are completed, they can be automatically analyzed to extract customer information, categorize the call type (order, appointment, support, etc.), and update the leads system.

## Changes Made

### 1. Database Schema Updates

#### Files Created:
- `frontend/supabase/009_add_call_analysis.sql` - Adds analysis columns to `calls` table
- `frontend/supabase/010_add_page_leads_categorization.sql` - Adds categorization columns to `page_leads` table

#### New Columns in `calls` table:
- `call_type` - Category of call (order, appointment, support, etc.)
- `analyzed` - Boolean flag indicating if call has been analyzed
- `analysis` - JSONB field storing full AI analysis
- `call_outcome`, `sentiment`, `urgency_level`, `confidence_score`
- `intent_summary`, `call_summary`
- `is_lead`, `lead_strength`
- `extracted_customer_data` - JSONB with customer info
- `updated_at` - Timestamp for updates

#### New Columns in `page_leads` table:
- All categorization fields (call_type, lead_strength, etc.)
- Appointment fields (appointment_date, appointment_time, etc.)
- Order fields (order_items, order_total, order_type, etc.)
- Support fields (support_issue, resolution_provided)
- Analysis fields (sentiment, urgency_level, confidence_score)
- `transcript`, `extracted_data`, `source`, `last_call_at`

### 2. Backend Implementation

#### Files Created:
- `backend/services/callAnalysis.js` - OpenAI analysis service

#### Files Modified:
- `backend/server.js` - Added `/api/calls/analyze` endpoint
- `backend/package.json` - Added `openai` and `@supabase/supabase-js` dependencies

#### New Endpoint:
- `POST /api/calls/analyze` - Analyzes a call transcript and updates database

### 3. Frontend Implementation

#### Files Created:
- `frontend/src/hooks/useCallAnalysis.ts` - Hook for calling analysis endpoint

#### Files Modified:
- `frontend/src/types/database.ts` - Updated `Call` and `PageLead` interfaces
- `frontend/src/pages/Leads.tsx` - Added categorization, filtering, and analysis features

#### New Features in Leads.tsx:
- Category filter dropdown (All, Orders, Appointments, Support, etc.)
- Call type badges with color coding
- "Analyze" button for unanalyzed calls
- Enhanced export CSV with new fields
- Category display in tables

## Setup Instructions

### 1. Run Database Migrations
Execute the SQL migration files in order:
```sql
-- Run in Supabase SQL Editor or via migration tool
-- 009_add_call_analysis.sql
-- 010_add_page_leads_categorization.sql
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Configure Environment Variables

#### Backend `.env`:
```env
OPENAI_API_KEY=your_openai_api_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=3001
```

#### Frontend `.env`:
```env
VITE_BACKEND_URL=http://localhost:3001
```

### 4. Start Backend Server
```bash
cd backend
npm start
# or for development
npm run dev
```

## Usage

### Analyzing a Call
1. Navigate to Leads page
2. Go to "Call Leads" tab
3. Find a call with transcript that hasn't been analyzed
4. Click "Analyze" button
5. Wait for analysis to complete (toast notification will appear)
6. Call will be automatically categorized and lead will be updated

### Filtering by Category
1. Use the "Filter by Category" dropdown at the top
2. Select a category (Orders, Appointments, Support, etc.)
3. Tables will show only leads/calls matching that category

### Sending Emails by Category
1. Filter leads by category
2. Click email icon on any lead
3. Email dialog will use category-specific information
4. AI email generation will incorporate category data

## AI Analysis Output

The AI analyzes transcripts and extracts:
- **Call Type**: order, appointment, sales_inquiry, support, billing, complaint, etc.
- **Customer Info**: name, email, phone, address
- **Lead Qualification**: is_lead, lead_strength (hot/warm/cold)
- **Call Details**: summary, intent, outcome, sentiment, urgency
- **Category-Specific Data**: 
  - Orders: items, total, payment method
  - Appointments: date, time, timezone, type
  - Support: issue, resolution provided
  - Billing: billing issue, refund requested
  - Complaints: complaint reason
- **Next Steps**: type and details for follow-up

## Notes

- Analysis is performed asynchronously
- Failed analyses are stored with error information
- Leads are automatically created/updated based on analysis
- Real-time subscriptions update the UI when analysis completes
- Export CSV includes all new categorization fields

## Troubleshooting

### Analysis Fails
- Check OpenAI API key is set correctly
- Verify transcript exists and is not empty
- Check backend logs for detailed error messages

### Leads Not Updating
- Verify Supabase service role key has proper permissions
- Check that call has transcript before analyzing
- Ensure database migrations have been run

### Frontend Not Showing Categories
- Clear browser cache
- Verify TypeScript types are updated
- Check that database columns exist
