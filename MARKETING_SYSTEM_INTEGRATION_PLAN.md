# TAMS BEAUTY HUB — MARKETING SYSTEM INTEGRATION PLAN

**Date:** July 2026  
**Objective:** Convert the TAMS_BEAUTY_HUB_Marketing_Strategy_Updated.md into an integrated platform system within TBH-IMS

---

## EXECUTIVE SUMMARY

The marketing strategy document outlines a 6-month plan across Instagram, TikTok, YouTube, and WhatsApp with automation. This plan translates that into a modular system integrated into the TBH-IMS platform using Next.js server actions and Trigger.dev scheduled jobs, enabling owner/marketing team to:

- Manage content calendars and scheduling
- Track leads & customer journeys
- Execute campaigns and broadcasts
- Monitor KPIs and analytics
- Automate workflows (WhatsApp, email, follow-ups)
- Manage referral programs and loyalty
- Track social proof (testimonials, reviews, UGC)

---

## PHASE 1: CORE DATABASE & DATA MODEL

### 1.1 New Database Tables

#### **marketing_campaigns**
```sql
CREATE TABLE marketing_campaigns (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('draft', 'scheduled', 'active', 'completed', 'paused'),
  campaign_type ENUM('product_launch', 'flash_sale', 'referral', 'seasonal', 'awareness'),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  target_platforms TEXT[] (json: ['instagram', 'tiktok', 'whatsapp', 'youtube']),
  goal_description TEXT,
  budget_allocation DECIMAL(10, 2),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **content_calendar**
```sql
CREATE TABLE content_calendar (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES marketing_campaigns(id),
  platform ENUM('instagram', 'tiktok', 'youtube', 'whatsapp', 'email'),
  content_type ENUM('product_showcase', 'behind_the_scenes', 'social_proof', 'tutorial', 'engagement', 'offer', 'story'),
  title VARCHAR(255),
  caption TEXT,
  content_url VARCHAR(500), -- cloudinary link
  scheduled_date TIMESTAMP,
  posted_date TIMESTAMP,
  status ENUM('draft', 'scheduled', 'posted', 'cancelled'),
  hashtags TEXT[],
  target_audience VARCHAR(255),
  expected_reach INTEGER,
  actual_reach INTEGER, -- to be updated post-posting
  engagement_rate DECIMAL(5, 2),
  call_to_action VARCHAR(255),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **leads**
```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY,
  source ENUM('instagram_dm', 'tiktok_comment', 'whatsapp', 'youtube_comment', 'campus_popup', 'referral', 'other'),
  source_url VARCHAR(500),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  whatsapp_number VARCHAR(20),
  interested_in TEXT[] (json: ['thrift', 'nails']),
  initial_message TEXT,
  lead_score INTEGER DEFAULT 0, -- 0-100 for qualification
  status ENUM('new', 'contacted', 'interested', 'converted', 'lost', 'nurturing'),
  assigned_to UUID REFERENCES users(id),
  campaign_id UUID REFERENCES marketing_campaigns(id),
  converted_customer_id UUID REFERENCES customers(id),
  conversion_date TIMESTAMP,
  follow_up_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **customer_journey**
```sql
CREATE TABLE customer_journey (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  lead_id UUID REFERENCES leads(id),
  stage ENUM('awareness', 'interest', 'desire', 'action', 'loyalty'),
  stage_entered_at TIMESTAMP,
  touchpoints TEXT[], -- json array of touchpoint ids
  last_interaction VARCHAR(500),
  last_interaction_date TIMESTAMP,
  lifetime_value DECIMAL(12, 2),
  next_action VARCHAR(255),
  next_action_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **customer_testimonials**
```sql
CREATE TABLE customer_testimonials (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  product_id UUID REFERENCES products(id),
  rating INTEGER (1-5),
  text_review TEXT,
  image_url VARCHAR(500), -- cloudinary link
  platform_shared ENUM('instagram', 'tiktok', 'whatsapp', 'in_person'),
  status ENUM('pending_approval', 'approved', 'featured', 'archived'),
  featured_until TIMESTAMP,
  engagement_count INTEGER DEFAULT 0,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **referral_program**
```sql
CREATE TABLE referral_program (
  id UUID PRIMARY KEY,
  referrer_customer_id UUID REFERENCES customers(id),
  referred_customer_id UUID REFERENCES customers(id),
  referral_code VARCHAR(20) UNIQUE,
  status ENUM('pending', 'completed', 'failed'),
  reward_given_amount DECIMAL(10, 2),
  reward_given_date TIMESTAMP,
  referral_date TIMESTAMP,
  conversion_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **broadcast_list_members**
```sql
CREATE TABLE broadcast_list_members (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  whatsapp_number VARCHAR(20),
  first_name VARCHAR(100),
  segment ENUM('vip', 'repeat_customer', 'new_customer', 'inactive', 'all'),
  status ENUM('active', 'unsubscribed', 'bounced'),
  consent_given BOOLEAN DEFAULT true,
  consent_date TIMESTAMP,
  last_broadcast_date TIMESTAMP,
  broadcasts_received_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **whatsapp_broadcasts**
```sql
CREATE TABLE whatsapp_broadcasts (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES marketing_campaigns(id),
  broadcast_text TEXT,
  broadcast_image_url VARCHAR(500),
  recipients_segment VARCHAR(255), -- 'vip', 'all', etc.
  total_recipients INTEGER,
  sent_count INTEGER DEFAULT 0,
  read_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  scheduled_date TIMESTAMP,
  sent_date TIMESTAMP,
  status ENUM('draft', 'scheduled', 'sent', 'failed'),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **marketing_kpis**
```sql
CREATE TABLE marketing_kpis (
  id UUID PRIMARY KEY,
  metric_name VARCHAR(255), -- 'instagram_followers', 'tiktok_views', etc.
  metric_value DECIMAL(12, 2),
  target_value DECIMAL(12, 2),
  period ENUM('daily', 'weekly', 'monthly', '6_month'),
  period_start_date DATE,
  period_end_date DATE,
  platform VARCHAR(100), -- 'instagram', 'tiktok', 'overall'
  data_source VARCHAR(255), -- 'api_pull', 'manual_entry', 'calculated'
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## PHASE 2: FEATURE MODULES

### 2.1 Content Calendar & Scheduling Module

**Location:** `/app/(dashboard)/marketing/content-calendar`

**Features:**
- **Calendar View**: Month/week view showing all scheduled posts
- **Content Types**: Filter by platform (Instagram, TikTok, YouTube, WhatsApp)
- **Scheduling**: Drag-and-drop to reschedule, bulk schedule
- **Content Form**: Create/edit with title, caption, hashtags, CTA, image upload
- **Buffer Integration**: Auto-sync to Buffer for Instagram/TikTok scheduling
- **Approval Workflow**: Draft → Pending Review → Approved → Scheduled
- **Performance Tracking**: Track reach, engagement, clicks post-launch

**Components to Build:**
- `ContentCalendarView.tsx` (calendar component)
- `CreateContentForm.tsx` (form for new content)
- `ContentScheduler.tsx` (batch scheduling)
- `BufferIntegration.ts` (server action)
- `PerformanceMetrics.tsx` (post-analytics)

**Server Actions:**
- `createContentPost()`
- `scheduleContent()`
- `updateContentStatus()`
- `fetchPostPerformance()`
- `syncWithBuffer()`

---

### 2.2 Lead Management & Tracking

**Location:** `/app/(dashboard)/marketing/leads`

**Features:**
- **Lead Inbox**: All enquiries from all platforms in one place
- **Lead Scoring**: Auto-score leads based on engagement, message type
- **Lead Status Pipeline**: New → Contacted → Interested → Converted → Lost
- **Bulk Assign**: Assign multiple leads to team members
- **Follow-up Reminders**: Auto-reminders for follow-up dates
- **Lead Source Analytics**: See which platform/campaign brings best leads
- **Integration with Orders**: Auto-convert leads to customers when they purchase

**Components to Build:**
- `LeadInbox.tsx`
- `LeadDetailPanel.tsx`
- `LeadScoringEngine.ts` (algorithm)
- `LeadPipeline.tsx` (kanban board)
- `FollowUpReminders.tsx`
- `LeadSourceAnalytics.tsx`

**Server Actions:**
- `createLead()`
- `updateLeadStatus()`
- `calculateLeadScore()`
- `assignLeadToUser()`
- `sendFollowUpMessage()`
- `convertLeadToCustomer()`

---

### 2.3 Customer Journey Tracking

**Location:** `/app/(dashboard)/marketing/customer-journey`

**Features:**
- **Journey Map Dashboard**: Visual showing customers moving through stages
- **Stage Breakdown**: Awareness → Interest → Desire → Action → Loyalty
- **Customer Profile**: Click customer to see full journey history
- **Touchpoint Timeline**: Timeline of all interactions (posts viewed, DMs, purchases)
- **Automated Stage Advancement**: Rules to auto-move customers based on actions
- **Predictive Analytics**: Suggest next best action for each customer

**Components to Build:**
- `JourneyMapDashboard.tsx`
- `CustomerJourneyVisualization.tsx` (flow diagram)
- `TouchpointTimeline.tsx`
- `StageBreakdownChart.tsx`
- `JourneyInsights.tsx`

**Server Actions:**
- `advanceCustomerStage()`
- `recordTouchpoint()`
- `getJourneyMetrics()`
- `suggestNextAction()`

---

### 2.4 Referral Program Management

**Location:** `/app/(dashboard)/marketing/referrals`

**Features:**
- **Referral Code Generation**: Auto-generate unique codes for customers
- **Referral Tracking**: Track who referred whom, when conversion happened
- **Reward Fulfillment**: Manual or auto-reward (e.g., ₦500 credit)
- **Leaderboard**: Top referrers in the period
- **Campaign Setup**: Define referral incentives (₦500 off, free nails, etc.)
- **Referral Widgets**: Code to embed referral CTAs in app/emails

**Components to Build:**
- `ReferralDashboard.tsx`
- `ReferralCodeGenerator.tsx`
- `ReferralLeaderboard.tsx`
- `ReferralRewardForm.tsx`
- `ReferralWidgetPreview.tsx`

**Server Actions:**
- `generateReferralCode()`
- `trackReferral()`
- `completeReferral()`
- `fulfillReward()`
- `getReferralMetrics()`

---

### 2.5 WhatsApp Broadcast Manager

**Location:** `/app/(dashboard)/marketing/whatsapp-broadcasts`

**Features:**
- **Broadcast List Management**: Add/remove/segment customers
- **Template Builder**: Pre-made templates (flash sale, new arrival, appointment reminder)
- **Audience Segmentation**: Send to 'VIP', 'Repeat Customers', 'All', custom lists
- **Scheduled Broadcasts**: Queue broadcasts for specific times
- **Message Preview**: Preview how broadcast looks on phone
- **Delivery Tracking**: Track sent/read/click rates
- **A/B Testing**: Test two message variants, auto-send winner

**Components to Build:**
- `BroadcastListManager.tsx`
- `SegmentBuilder.tsx`
- `BroadcastTemplateBuilder.tsx`
- `BroadcastScheduler.tsx`
- `BroadcastAnalytics.tsx`
- `DeliveryTracker.tsx`

**Server Actions:**
- `createBroadcastList()`
- `segmentCustomers()`
- `scheduleBroadcast()`
- `sendBroadcast()` (send via Twilio + server actions)
- `trackBroadcastDelivery()`
- `getSegmentMetrics()`

---

### 2.6 Social Proof & Testimonials Gallery

**Location:** `/app/(dashboard)/marketing/testimonials`

**Features:**
- **Testimonial Submission**: Customers can submit reviews + photos (post-purchase)
- **Approval Queue**: Review testimonials before featuring
- **Featured Testimonials**: Pin 5-10 best testimonials for social media
- **UGC Management**: Organize customer photos by product/category
- **Repost Widget**: Easy 1-click repost to Instagram Stories/TikTok
- **Sentiment Analysis**: Auto-flag positive/negative reviews
- **Gallery View**: Browse all testimonials by rating, date, product

**Components to Build:**
- `TestimonialSubmissionForm.tsx`
- `TestimonialApprovalQueue.tsx`
- `FeaturedTestimonialsList.tsx`
- `UGCGallery.tsx`
- `RepostWidget.tsx`
- `SentimentAnalyzer.ts`

**Server Actions:**
- `submitTestimonial()`
- `approveTestimonial()`
- `featureTestimonial()`
- `getTestimonialStats()`

---

### 2.7 Campaign & KPI Dashboard

**Location:** `/app/(dashboard)/marketing/analytics`

**Features:**
- **Campaign Overview**: Current/past campaigns with status, dates, KPIs
- **KPI Tracking**: Instagram followers, TikTok views, email opens, lead count, conversion rate
- **KPI vs Target**: Visual progress toward 6-month goals (Month 1, 3, 6 targets)
- **Channel Performance**: Compare performance across Instagram, TikTok, YouTube, WhatsApp
- **ROI Calculation**: Track cost vs revenue per campaign
- **Trend Analysis**: Charts showing growth over weeks/months
- **Data Export**: Export reports to CSV/PDF

**Components to Build:**
- `CampaignOverview.tsx`
- `KPIDashboard.tsx`
- `KPICard.tsx` (individual metric)
- `ChannelComparison.tsx`
- `PerformanceTrends.tsx`
- `ROICalculator.tsx`
- `ReportExporter.ts`

**Server Actions:**
- `getCampaignStats()`
- `getKPIMetrics()`
- `updateKPIValue()`
- `generateReport()`
- `calculateROI()`

---

### 2.8 Automation Workflows (Native Implementation)

**Location:** `/app/(dashboard)/marketing/automations`

**Architecture:** Uses Next.js server actions + Trigger.dev scheduled jobs (no external automation platform needed)

**Features:**
- **Automation Templates**: Pre-built automation patterns (lead follow-up, broadcast scheduling, order follow-up)
- **Manual Trigger**: Manually fire automations on-demand (e.g., send broadcast now, send follow-up message)
- **Scheduled Jobs**: Trigger.dev cron jobs for daily/weekly automations
- **Execution Logs**: View history of all automation runs with results/errors
- **Simple Config Forms**: Update automation settings without coding
  - Lead follow-up delay (hours)
  - Broadcast scheduling time
  - Auto-response messages
  - Reminder timing

**Components to Build:**
- `AutomationTemplates.tsx` (list available automations)
- `AutomationConfig.tsx` (configure each automation)
- `ExecutionLogs.tsx` (view run history)
- `ManualTriggerPanel.tsx` (trigger on-demand)
- `AutomationStatus.tsx` (green/red status)

**Server Actions:**
- `sendLeadFollowUp()` (send WhatsApp follow-up)
- `sendBroadcast()` (send to broadcast list)
- `advanceCustomerStage()` (move customer through journey)
- `createAppointmentReminder()` (schedule reminder)
- `fulfillReferralReward()` (process referral reward)

---

## PHASE 3: INTEGRATION POINTS

### 3.1 Sales ↔ Marketing Integration

**Trigger:** When an order is created (existing `/lib/actions/sales.ts`):
1. **Auto-create Customer Journey entry** if new customer
2. **Add to Broadcast List** (if not already)
3. **Trigger Follow-up Workflow**: Schedule 2-day "How are you?" message + 7-day referral offer
4. **Update Customer LTV**: Track lifetime value for segment analysis

**Code Location:** Extend `createSale()` in `/lib/actions/sales.ts`

---

### 3.2 Appointments ↔ Marketing Integration

**Trigger:** When appointment is booked/confirmed:
1. **Send Appointment Confirmation** via WhatsApp (Twilio + server action)
2. **Add to VIP List** (nail service = high-value customer)
3. **Send Pre-Appointment Reminder** (24h before via Trigger.dev job)
4. **Post-Appointment Request**: Ask for testimonial/before-after photo

**Code Location:** Extend `createAppointment()` in `/lib/actions/appointments.ts`

**Implementation:**
```typescript
// In /lib/actions/appointments.ts
export async function createAppointment(...) {
  // ... existing code ...
  
  // After appointment created:
  await addCustomerToBroadcastList(customerId);
  await sendAppointmentConfirmation(appointmentId);
  // Trigger.dev job will handle 24h reminder
}
```

---

### 3.3 Inventory ↔ Marketing Integration

**Trigger:** When inventory status changes:
1. **New Product Arrival** → Auto-flag for content calendar
2. **Low Stock Alert** → Can be repurposed as "Last 3 pieces!" promo
3. **Product Milestone** (e.g., top-seller) → Feature in social posts

**Code Location:** Create `/lib/integrations/inventory-marketing.ts`

---

### 3.4 Analytics Data Aggregation

**Create:** `/lib/integrations/social-analytics.ts`

Pull data from:
- **Instagram**: Follower count, post reach, engagement (via Meta API)
- **TikTok**: Video views, follower growth (via TikTok Analytics API or Phantombuster)
- **YouTube**: Subscriber count, video views (via YouTube API)
- **Internal**: Orders, leads, customers from database

**Daily sync job:** Store in `marketing_kpis` table for dashboard

---

## PHASE 4: IMPLEMENTATION ROADMAP

### **Sprint 1 (Week 1-2): Database & Data Models**
- [ ] Create all tables in drizzle schema
- [ ] Generate migrations
- [ ] Create Zod validation schemas for each table
- [ ] Write seed data (sample campaigns, content calendar entries)

### **Sprint 2 (Week 3-4): Core Lead Management**
- [ ] Build Lead Inbox UI
- [ ] Implement lead creation/update/delete server actions
- [ ] Build Lead Scoring engine
- [ ] Create lead → customer conversion workflow
- [ ] Build Lead Source analytics

### **Sprint 3 (Week 5-6): Content Calendar & Campaigns**
- [ ] Build Content Calendar UI (month/week view)
- [ ] Create content scheduling form
- [ ] Build Buffer integration (sync scheduled posts)
- [ ] Implement post-performance tracking
- [ ] Create Campaign dashboard

### **Sprint 4 (Week 7-8): Customer Journey & Testimonials**
- [ ] Build Customer Journey visualization
- [ ] Implement stage advancement logic
- [ ] Build Testimonials gallery + approval workflow
- [ ] Create UGC repost functionality
- [ ] Build social proof analytics

### **Sprint 5 (Week 9-10): Referral & Broadcast**
- [ ] Build Referral program system
- [ ] Create Broadcast List manager
- [ ] Build Broadcast template builder
- [ ] Implement WhatsApp broadcast scheduler (via Twilio + server actions)
- [ ] Create broadcast analytics & A/B testing

### **Sprint 6 (Week 11-12): Analytics & Automation**
- [ ] Build KPI Dashboard
- [ ] Create social analytics sync jobs
- [ ] Build Automation templates UI (lead follow-up, broadcasts, etc.)
- [ ] Create Trigger.dev jobs for scheduled automations
- [ ] Build automation logs viewer
- [ ] Build manual trigger functionality
- [ ] Integrate with local automation service

### **Sprint 7 (Week 13+): Integration & Polish**
- [ ] Integrate all systems together
- [ ] Build cross-module workflows (sales → marketing, etc.)
- [ ] Performance optimization
- [ ] User testing & refinement
- [ ] Launch to production

---

## PHASE 5: DATABASE SCHEMA (Drizzle)

Create `/lib/db/schema-marketing.ts`:

```typescript
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb, enum as pgEnum } from "drizzle-orm/pg-core";
import { users, customers } from "./schema";

// [All table definitions from Phase 1 converted to Drizzle syntax]
```

---

## PHASE 6: API ROUTES & WEBHOOKS

### **Key API Endpoints:**

```
POST   /api/marketing/leads
GET    /api/marketing/leads
PATCH  /api/marketing/leads/:id

POST   /api/marketing/campaigns
GET    /api/marketing/campaigns
PATCH  /api/marketing/campaigns/:id

POST   /api/marketing/content-calendar
GET    /api/marketing/content-calendar
PATCH  /api/marketing/content-calendar/:id

POST   /api/marketing/broadcasts
GET    /api/marketing/broadcasts

GET    /api/marketing/analytics/kpis
GET    /api/marketing/analytics/campaigns
GET    /api/marketing/analytics/channels

POST   /api/webhooks/social/:platform (Instagram, TikTok DMs, etc.)
POST   /api/webhooks/testimonials (customer review submissions)
```

---

## PHASE 7: AUTOMATION WORKFLOWS (SERVER ACTIONS + TRIGGER.DEV)

### **Automation 1: Lead Auto-Response**
**Location:** `/lib/actions/marketing.ts`

```typescript
export async function sendLeadAutoResponse(leadId: string) {
  // Get lead details
  // Send WhatsApp welcome message (via Twilio)
  // Update lead status to 'contacted'
  // Schedule follow-up for 24h later via Trigger.dev
}
```

### **Automation 2: Lead Follow-Up Scheduler**
**Location:** `/trigger/jobs/daily-lead-followup.ts`

Trigger.dev cron job (daily at 10am):
- Query leads with status 'contacted' and follow_up_date <= today
- Send follow-up message via WhatsApp
- Move to 'interested' if they reply, 'lost' if no response after 2 attempts

### **Automation 3: Order → Customer Journey + Broadcast**
**Location:** Extend `/lib/actions/sales.ts`

When `createSale()` completes:
1. Create `customer_journey` entry (stage: 'action')
2. Add to `broadcast_list_members`
3. Create calendar event for 2-day follow-up via Trigger.dev
4. Log touchpoint in `customer_journey`

### **Automation 4: Broadcast Scheduler**
**Location:** `/trigger/jobs/broadcast-scheduler.ts`

Trigger.dev cron job (daily at 9am):
- Query `whatsapp_broadcasts` with status 'scheduled' and scheduled_date <= today
- Get segment members from `broadcast_list_members`
- Send broadcast via Twilio API
- Update delivery tracking

### **Automation 5: Customer Journey Advancement**
**Location:** `/trigger/jobs/customer-journey-sync.ts`

Trigger.dev cron job (daily at 11pm):
- Check for customers at each stage with trigger conditions met
- Auto-advance: Interest→Desire (after 3 interactions), Desire→Action (after purchase), Action→Loyalty (after 2nd purchase)
- Update `customer_journey` records

### **Automation 6: Broadcast List Builder**
**Location:** `/lib/actions/marketing.ts`

```typescript
export async function addCustomerToBroadcastList(customerId: string) {
  // Create broadcast_list_members entry
  // Set segment based on purchase history
  // Send welcome message
}
```

Triggered automatically after order creation.

---

## PHASE 8: UI/UX LAYOUT

```
/app/(dashboard)/marketing/
├── page.tsx (marketing home/overview)
├── content-calendar/
│   ├── page.tsx (calendar view)
│   └── [id]/ (edit content)
├── leads/
│   ├── page.tsx (lead inbox)
│   └── [id]/ (lead detail)
├── campaigns/
│   ├── page.tsx (campaigns list)
│   └── [id]/ (campaign detail)
├── customer-journey/
│   ├── page.tsx (journey map)
│   └── [id]/ (customer detail)
├── referrals/
│   └── page.tsx (referral dashboard)
├── whatsapp-broadcasts/
│   ├── page.tsx (broadcasts list)
│   └── new/ (create broadcast)
├── testimonials/
│   ├── page.tsx (testimonials gallery)
│   └── [id]/ (approve/edit)
├── automations/
│   └── page.tsx (workflow management)
└── analytics/
    └── page.tsx (KPI dashboard)
```

---

## PHASE 9: DEPENDENCIES & LIBRARIES

Add to `package.json` (most already installed):

```json
{
  "recharts": "^2.x", // KPI charts
  "react-big-calendar": "^1.x", // Content calendar
  "framer-motion": "^10.x", // Journey visualization
  "zustand": "^4.x", // State management (optional)
  "react-query": "^3.x" // Data fetching/caching (if not using tanstack-query)
}
```

**Note:** Your project already has `@trigger.dev` configured, Twilio setup, and local automation service. No additional SDKs needed.

---

## PHASE 10: SUCCESS METRICS

**By end of implementation:**

✅ Lead-to-customer conversion time reduced from 48h to <1h (via auto-response + follow-up)  
✅ Content posting time reduced from 4h/week to 30min/week (calendar + Buffer)  
✅ Customer journey visibility: 100% of customers tracked & auto-advanced  
✅ WhatsApp broadcast reach: 300+ members within 3 months  
✅ Referral program contribution: 30% of new customers by Month 6  
✅ KPI tracking: Real-time visibility into all metrics vs 6-month targets  
✅ Automation savings: 12+ hours/week recovered (lead follow-up, broadcasts, order processing)  
✅ Zero manual data entry: All customer data captured at source, synced automatically  

---

## NEXT STEPS

1. **Review this plan** with the marketing/owner team
2. **Prioritize features**: Which phase/module to start with?
3. **Assign developers** to sprints
4. **Set up design review** process for UI/UX
5. **Configure Trigger.dev jobs** for scheduled automations
6. **Create project management** board (Jira/Linear)

---

**Owner:** [Marketing Team]  
**Last Updated:** July 15, 2026  
**Status:** Ready for Development
