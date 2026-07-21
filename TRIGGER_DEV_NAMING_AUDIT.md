# Trigger.dev Job/Event Naming Audit & Recommendations

**Report Date:** 2026-07-18  
**Status:** 🔴 Naming inconsistencies found | ⚠️ Best practice violations

---

## Executive Summary

Your Trigger.dev integration uses **9 jobs** across multiple files. Analysis reveals:
- ✅ **3 issues** with naming consistency
- ✅ **2 issues** with event/job function misalignment  
- ✅ **1 issue** with overly generic naming

---

## Current Job Registry

| Event Name Triggered | Job Function Name | File | Pattern | Status |
|---|---|---|---|---|
| `social-post-publisher` | `socialPostPublisherJob()` | [trigger/jobs/social-post-publisher.ts](trigger/jobs/social-post-publisher.ts) | kebab-case | ✅ Aligned |
| `inventory.low-stock` | `lowStockAlertJob()` | [trigger/jobs/low-stock-alert.ts](trigger/jobs/low-stock-alert.ts) | dot-notation → camelCase | ⚠️ Misaligned |
| `appointment.reminder-scheduled` | `appointmentRemindersJob()` | [trigger/jobs/appointment-reminders.ts](trigger/jobs/appointment-reminders.ts) | dot-notation → camelCase | ⚠️ Misaligned |
| `appointment.confirmed` | `appointmentConfirmedJob()` | [trigger/jobs/appointment-confirmed.ts](trigger/jobs/appointment-confirmed.ts) | dot-notation → camelCase | ⚠️ Misaligned |
| N/A | `leadFollowUpJob()` | [trigger/jobs/lead-follow-up.ts](trigger/jobs/lead-follow-up.ts) | No trigger found | ⚠️ Orphaned |
| N/A | `dailySummaryJob()` | [trigger/jobs/daily-summary.ts](trigger/jobs/daily-summary.ts) | No trigger found | ⚠️ Orphaned |
| N/A | `monthlyStatementsJob()` | [trigger/jobs/monthly-statements.ts](trigger/jobs/monthly-statements.ts) | No trigger found | ⚠️ Orphaned |
| N/A | `customerJourneySyncJob()` | [trigger/jobs/customer-journey-sync.ts](trigger/jobs/customer-journey-sync.ts) | No trigger found | ⚠️ Orphaned |
| `export-job` | `exportStatementJob()` | [trigger/jobs/export-statement.tsx](trigger/jobs/export-statement.tsx) | generic → specific | ⚠️ Generic |

---

## Issues Identified

### Issue #1: Inconsistent Naming Patterns
**Severity:** 🟠 Medium  
**Current State:** Three different patterns used:
- kebab-case: `social-post-publisher`
- dot-notation: `inventory.low-stock`, `appointment.reminder-scheduled`
- Generic: `export-job`

**Recommendation:** Standardize to **hierarchical dot-notation** (Trigger.dev best practice):
```
social.posts.publish
inventory.alerts.low-stock
appointments.reminders.send
appointments.confirmations.send
exports.statements.generate
lead.followups.send
summaries.daily.generate
statements.monthly.generate
customers.journeys.sync
```

**Why:** Dot-notation provides:
- Clear organization in Trigger.dev dashboard
- Natural hierarchical grouping
- Better filtering/searching in monitoring
- Professional consistency

---

### Issue #2: Event/Job Function Name Misalignment
**Severity:** 🟠 Medium  

Currently, event triggers don't match their job function names:

#### Problem Examples:
```typescript
// ❌ Event name doesn't match job name
triggerClient.triggerEvent("inventory.low-stock", {...})
// executes → lowStockAlertJob() ✗ Different naming

triggerClient.triggerEvent("appointment.reminder-scheduled", {...})
// executes → appointmentRemindersJob() ✗ Different naming
```

**Impact:**
- Hard to trace event → job relationship
- Maintenance confusion
- Dashboard naming inconsistency

---

### Issue #3: Orphaned Scheduled Jobs
**Severity:** 🟡 Low  

These jobs are defined but **never triggered** via `triggerClient.triggerEvent()`:
- `leadFollowUpJob()` - Expected: scheduled daily via cron
- `dailySummaryJob()` - Expected: scheduled daily via cron
- `monthlyStatementsJob()` - Expected: scheduled monthly via cron
- `customerJourneySyncJob()` - Expected: scheduled daily via cron

**Recommendation:** Add trigger configuration or cron scheduling in Trigger.dev dashboard.

---

### Issue #4: Generic Event Name
**Severity:** 🟡 Low  

`export-job` is too generic. Should be:
- `exports.statements.generate` (hierarchical)
- `exports.pdf.generate` (more specific)

---

## Recommended Job Registry (Standardized)

```typescript
// Hierarchical dot-notation standard
const TRIGGER_EVENTS = {
  // Social Media
  SOCIAL_POSTS_PUBLISH: "social.posts.publish",
  
  // Inventory
  INVENTORY_ALERTS_LOW_STOCK: "inventory.alerts.low-stock",
  
  // Appointments
  APPOINTMENTS_REMINDERS_SEND: "appointments.reminders.send",
  APPOINTMENTS_CONFIRMATIONS_SEND: "appointments.confirmations.send",
  
  // Leads
  LEADS_FOLLOWUPS_SEND: "leads.followups.send",
  
  // Summaries
  SUMMARIES_DAILY_GENERATE: "summaries.daily.generate",
  
  // Statements
  STATEMENTS_MONTHLY_GENERATE: "statements.monthly.generate",
  EXPORTS_STATEMENTS_GENERATE: "exports.statements.generate",
  
  // Customers
  CUSTOMERS_JOURNEYS_SYNC: "customers.journeys.sync",
} as const;
```

**Migration Path:**
1. Update event trigger names in `lib/actions/*`
2. Rename job functions to match event names (kebab-case converted to camelCase)
3. Update all `triggerClient.triggerEvent()` calls
4. Test end-to-end before deploying to production

---

## Quick Reference: Event Usage Locations

| Event Name | Currently Called From |
|---|---|
| `social-post-publisher` | [lib/actions/social-media.ts](lib/actions/social-media.ts#L79) |
| `inventory.low-stock` | [lib/actions/sales.ts](lib/actions/sales.ts#L378), [lib/actions/inventory.ts](lib/actions/inventory.ts#L399) |
| `appointment.reminder-scheduled` | [lib/actions/appointments.ts](lib/actions/appointments.ts#L315) |
| `appointment.confirmed` | [lib/actions/appointments.ts](lib/actions/appointments.ts#L415) |

---

## Trigger.dev Best Practices Applied

✅ Use dot-notation for hierarchy  
✅ Use lowercase with dots/hyphens  
✅ Make names action-oriented  
✅ Group related events under common prefix  
✅ Maintain consistency across codebase  

**References:**
- [Trigger.dev Job Naming Docs](https://trigger.dev/docs/tasks/overview)
- Industry standard: Kafka topic naming conventions (similar principles)

