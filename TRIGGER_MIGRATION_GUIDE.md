# Trigger.dev Event Naming Migration Guide

**Migration Date:** 2026-07-18  
**Status:** Ready for Deployment

---

## Summary

This guide documents the migration from inconsistent event naming patterns to a standardized hierarchical dot-notation system for Trigger.dev jobs.

### What Changed

All event names now use the pattern: `resource.action.detail` (hierarchical dot-notation)

| Old Event Name | New Event Name | File Updated | Status |
|---|---|---|---|
| `social-post-publisher` | `social.posts.publish` | [lib/actions/social-media.ts](../lib/actions/social-media.ts) | ✅ Updated |
| `inventory.low-stock` | `inventory.alerts.low-stock` | [lib/actions/sales.ts](../lib/actions/sales.ts), [lib/actions/inventory.ts](../lib/actions/inventory.ts) | ✅ Updated |
| `appointment.reminder-scheduled` | `appointments.reminders.send` | [lib/actions/appointments.ts](../lib/actions/appointments.ts) | ✅ Updated |
| `appointment.confirmed` | `appointments.confirmations.send` | [lib/actions/appointments.ts](../lib/actions/appointments.ts) | ✅ Updated |
| `export-job` | `exports.statements.generate` | [trigger/client.ts](../trigger/client.ts) | ✅ Updated |

### New Events Added (Scheduled Jobs)

| New Event Name | Schedule | Handler | Status |
|---|---|---|---|
| `leads.followups.send` | Daily 9:00 AM | [trigger/jobs/lead-follow-up.ts](../trigger/jobs/lead-follow-up.ts) | ⏳ Needs Setup |
| `summaries.daily.generate` | Daily 6:00 PM | [trigger/jobs/daily-summary.ts](../trigger/jobs/daily-summary.ts) | ⏳ Needs Setup |
| `statements.monthly.generate` | 1st of month, midnight | [trigger/jobs/monthly-statements.ts](../trigger/jobs/monthly-statements.ts) | ⏳ Needs Setup |
| `customers.journeys.sync` | Daily midnight | [trigger/jobs/customer-journey-sync.ts](../trigger/jobs/customer-journey-sync.ts) | ⏳ Needs Setup |

---

## Deployment Steps

### Phase 1: Update Production Code (Immediate)

The code has already been updated in these files:

1. ✅ `trigger/client.ts` - Added `TRIGGER_EVENTS` constants
2. ✅ `lib/actions/sales.ts` - Updated all event names
3. ✅ `lib/actions/appointments.ts` - Updated all event names
4. ✅ `lib/actions/inventory.ts` - Updated all event names
5. ✅ `lib/actions/social-media.ts` - Updated all event names
6. ✅ `trigger/client.ts` - Updated `runExport()` to use new event name

**To deploy:**
```bash
# 1. Commit changes
git add -A
git commit -m "refactor: standardize Trigger.dev event naming to hierarchical dot-notation"

# 2. Push to your branch
git push origin feature/trigger-naming-migration

# 3. Deploy to staging first
npm run build
npm run start

# 4. Test event triggers (see Testing section)

# 5. Deploy to production
# ... (your deployment process)
```

### Phase 2: Setup Scheduled Jobs in Trigger.dev Dashboard

**Prerequisites:**
- Trigger.dev Cloud account logged in
- Your project selected
- `TRIGGER_API_KEY` configured in production environment

**Steps:**

1. **Go to Trigger.dev Dashboard**
   - https://cloud.trigger.dev/
   - Select your TBH-IMS project

2. **For each scheduled job, create a new scheduled task:**

   ```
   📅 Job 1: Daily Sales Summary
   ├─ Name: "Daily Sales Summary Report"
   ├─ Event: summaries.daily.generate
   ├─ Schedule: 0 18 * * *
   ├─ Timezone: Africa/Lagos
   ├─ Payload: {}
   └─ Enabled: ✓

   📅 Job 2: Lead Follow-ups
   ├─ Name: "Daily Lead Follow-ups"
   ├─ Event: leads.followups.send
   ├─ Schedule: 0 9 * * *
   ├─ Timezone: Africa/Lagos
   ├─ Payload: {}
   └─ Enabled: ✓

   📅 Job 3: Monthly Statements
   ├─ Name: "Monthly Financial Statements"
   ├─ Event: statements.monthly.generate
   ├─ Schedule: 0 0 1 * *
   ├─ Timezone: Africa/Lagos
   ├─ Payload: {}
   └─ Enabled: ✓

   📅 Job 4: Customer Journey Sync
   ├─ Name: "Daily Customer Journey Sync"
   ├─ Event: customers.journeys.sync
   ├─ Schedule: 0 0 * * *
   ├─ Timezone: Africa/Lagos
   ├─ Payload: {}
   └─ Enabled: ✓
   ```

3. **Click "Create" for each task**

---

## Testing

### Pre-Deployment Testing

```bash
# 1. Start dev server
npm run dev

# 2. Test event-driven jobs manually:

# Test Social Post Publisher
curl -X POST http://localhost:3000/api/test/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "event": "social.posts.publish",
    "payload": {"postId": "test-post-id"}
  }'

# Test Low Stock Alert
curl -X POST http://localhost:3000/api/test/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "event": "inventory.alerts.low-stock",
    "payload": {"productId": "test-product-id", "productName": "Test Product"}
  }'

# Test Appointment Reminder
curl -X POST http://localhost:3000/api/test/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "event": "appointments.reminders.send",
    "payload": {"appointmentId": "test-appt-id"}
  }'

# 3. Monitor console logs for successful triggers
```

### Production Testing (After Deployment)

```bash
# 1. Create a test social post scheduled for immediate publication
# Via dashboard: Settings → Social Media → Create Test Post

# 2. Monitor Trigger.dev dashboard for job execution

# 3. Check N8N webhooks for incoming data:
# - Low stock: N8N_LOW_STOCK_PATH
# - Daily summary: N8N_WEBHOOK_BASE_URL + /webhook/daily-summary
# - Monthly statements: N8N_WEBHOOK_BASE_URL + /webhook/monthly-report

# 4. Verify YouTube uploads working (if scheduled for YouTube)
# Via dashboard: Check YouTube Studio for new video
```

---

## Rollback Plan (If Issues Arise)

If problems occur with the new event names:

```bash
# 1. Identify which event is failing
# Check Trigger.dev dashboard for error logs

# 2. Find the old event name mapping
# Old events: social-post-publisher, inventory.low-stock, etc.
# See "What Changed" table above

# 3. Revert the specific file(s) with issues:
git checkout HEAD~1 -- lib/actions/sales.ts  # Example

# 4. Re-deploy to production
# Your CI/CD pipeline here

# 5. Delete the problematic event from Trigger.dev dashboard
# Don't delete the new events - they should continue running

# 6. Once fixed, re-apply the changes and test again
```

---

## Code References

### Using the Event Constants

Instead of hardcoding event names, always import and use the constants:

```typescript
// ✅ GOOD
import { TRIGGER_EVENTS } from "@/trigger/client";

await triggerClient.triggerEvent(TRIGGER_EVENTS.INVENTORY_ALERTS_LOW_STOCK, {
  productId: "123",
});

// ❌ BAD
await triggerClient.triggerEvent("inventory.alerts.low-stock", {
  productId: "123",
});
```

### Job Handlers

Each job handler needs to be updated to match the new event name. The job files already handle this:

```typescript
// trigger/jobs/low-stock-alert.ts
export async function lowStockAlertJob(input?: { productId?: string }) {
  // Handler implementation
  // This job responds to event: inventory.alerts.low-stock
}
```

### Trigger Configuration

All scheduled jobs are configured in [trigger/jobs-registry.ts](../trigger/jobs-registry.ts):

```typescript
export const SCHEDULED_JOBS = {
  SUMMARIES_DAILY_GENERATE: {
    event: TRIGGER_EVENTS.SUMMARIES_DAILY_GENERATE,
    schedule: "0 18 * * *",    // Daily at 6 PM
    timezone: "Africa/Lagos",
    handler: "trigger/jobs/daily-summary.ts",
  },
  // ... more jobs
};
```

---

## Monitoring

### Trigger.dev Dashboard Monitoring

1. Go to https://cloud.trigger.dev/
2. Select your TBH-IMS project
3. View recent job executions:
   - **Runs:** See all job executions with status
   - **Logs:** View detailed logs for each run
   - **Errors:** Filter to show only failed runs
   - **Performance:** Check execution times

### Console Logging

All jobs log to console:
```
[Trigger] Event triggered: inventory.alerts.low-stock
[Trigger] Payload: { productId: "abc123", productName: "Widget" }
[Trigger] Job completed: ✅ Success / ❌ Failed
```

### N8N Webhooks

Monitor incoming webhooks in N8N to verify data is being sent:

- **Low Stock:** `N8N_WEBHOOK_BASE_URL/webhook/low-stock`
- **Daily Summary:** `N8N_WEBHOOK_BASE_URL/webhook/daily-summary`
- **Monthly Report:** `N8N_WEBHOOK_BASE_URL/webhook/monthly-report`
- **Appointments:** `N8N_WEBHOOK_BASE_URL/webhook/appointment-booked`

---

## FAQ

**Q: Will old events still work?**  
A: No. Once deployed, only the new event names will work. The old names are completely replaced.

**Q: When should I deploy this?**  
A: This can be deployed immediately. The changes are backward-compatible internally (using constants).

**Q: Do I need to update Trigger.dev dashboard first?**  
A: No. Deploy code first (Phase 1), then setup scheduled jobs (Phase 2).

**Q: What about in-flight jobs?**  
A: Any jobs currently queued with old event names will fail. This is expected behavior post-migration.

**Q: Can I test in staging first?**  
A: Yes! Strongly recommended. Deploy to staging, create test scheduled jobs, verify everything works.

---

## Support

Questions or issues? Check these files:

- **Event constants:** [trigger/client.ts](../trigger/client.ts)
- **Job registry:** [trigger/jobs-registry.ts](../trigger/jobs-registry.ts)
- **Cron schedules:** [trigger/schedules.ts](../trigger/schedules.ts)
- **Original audit:** [TRIGGER_DEV_NAMING_AUDIT.md](../TRIGGER_DEV_NAMING_AUDIT.md)

