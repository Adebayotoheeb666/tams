# Trigger.dev Naming & Scheduling - Deployment Checklist

✅ = Complete | ⏳ = Needs Action | ❌ = Blocked

## Code Changes (✅ COMPLETE)

- ✅ [trigger/client.ts](./trigger/client.ts) - Added `TRIGGER_EVENTS` constants with hierarchical naming
- ✅ [lib/actions/sales.ts](./lib/actions/sales.ts) - Updated `inventory.low-stock` → `inventory.alerts.low-stock`
- ✅ [lib/actions/appointments.ts](./lib/actions/appointments.ts) - Updated appointment event names
- ✅ [lib/actions/inventory.ts](./lib/actions/inventory.ts) - Updated `inventory.low-stock` → `inventory.alerts.low-stock`
- ✅ [lib/actions/social-media.ts](./lib/actions/social-media.ts) - Updated `social-post-publisher` → `social.posts.publish`

## Documentation (✅ COMPLETE)

- ✅ [trigger/schedules.ts](./trigger/schedules.ts) - Cron schedules for all jobs
- ✅ [trigger/jobs-registry.ts](./trigger/jobs-registry.ts) - Job registry with setup instructions
- ✅ [TRIGGER_MIGRATION_GUIDE.md](./TRIGGER_MIGRATION_GUIDE.md) - Complete migration documentation
- ✅ [TRIGGER_DEV_NAMING_AUDIT.md](./TRIGGER_DEV_NAMING_AUDIT.md) - Original audit findings

## Pre-Deployment Testing (⏳ TODO)

**Local Testing:**
- [ ] Start dev server: `npm run dev`
- [ ] Test social post publishing event
- [ ] Test low-stock alert event
- [ ] Test appointment reminder event
- [ ] Test appointment confirmation event
- [ ] Verify console logs show new event names

**Checklist:**
```bash
# 1. Run this to build and test
npm run build
npm run dev

# 2. Check for any TypeScript errors
npm run lint

# 3. Monitor console for event triggers
# (create test records through dashboard to trigger events)
```

## Staging Deployment (⏳ TODO)

- [ ] Commit code changes
- [ ] Deploy to staging environment
- [ ] Run staging tests (see Pre-Deployment Testing)
- [ ] Monitor Trigger.dev dashboard for any errors
- [ ] Verify N8N webhooks receive events
- [ ] Check YouTube uploads if applicable

## Production Deployment (⏳ TODO)

1. **Code Deployment:**
   - [ ] Merge PR to main branch
   - [ ] Deploy to production (follow your CI/CD)
   - [ ] Monitor deployment logs

2. **Trigger.dev Setup (⏳ Manual Step):**
   - [ ] Log into https://cloud.trigger.dev/
   - [ ] Select TBH-IMS project
   - [ ] Create 4 scheduled tasks (copy specs from below)

3. **Scheduled Jobs Setup:**

   **Task 1: Daily Sales Summary**
   ```
   Name: Daily Sales Summary Report
   Event: summaries.daily.generate
   Schedule: 0 18 * * *
   Timezone: Africa/Lagos
   Payload: {}
   Enabled: ✓
   ```
   - [ ] Created

   **Task 2: Lead Follow-ups**
   ```
   Name: Daily Lead Follow-ups
   Event: leads.followups.send
   Schedule: 0 9 * * *
   Timezone: Africa/Lagos
   Payload: {}
   Enabled: ✓
   ```
   - [ ] Created

   **Task 3: Monthly Statements**
   ```
   Name: Monthly Financial Statements
   Event: statements.monthly.generate
   Schedule: 0 0 1 * *
   Timezone: Africa/Lagos
   Payload: {}
   Enabled: ✓
   ```
   - [ ] Created

   **Task 4: Customer Journey Sync**
   ```
   Name: Daily Customer Journey Sync
   Event: customers.journeys.sync
   Schedule: 0 0 * * *
   Timezone: Africa/Lagos
   Payload: {}
   Enabled: ✓
   ```
   - [ ] Created

## Post-Deployment Verification (⏳ TODO)

- [ ] All scheduled tasks appear in Trigger.dev dashboard
- [ ] No error logs in console
- [ ] N8N receives webhook data as expected
- [ ] Monitor for 24 hours for any issues
- [ ] Check that jobs execute on schedule

## Monitoring

### Daily Check
- [ ] Visit https://cloud.trigger.dev/ → Runs tab
- [ ] Verify recent job executions show success status
- [ ] No spike in error rates

### Weekly Check
- [ ] Review job execution logs
- [ ] Verify N8N webhooks are processing data
- [ ] Check that scheduled jobs are running on time

### Red Flags to Watch For
- ❌ Jobs failing to execute
- ❌ Webhook timeouts
- ❌ N8N showing errors
- ❌ Trigger.dev quota exceeded
- ❌ Console errors related to events

## Quick Reference

### Event Name Mapping

Old → New:
```
social-post-publisher → social.posts.publish
inventory.low-stock → inventory.alerts.low-stock
appointment.reminder-scheduled → appointments.reminders.send
appointment.confirmed → appointments.confirmations.send
export-job → exports.statements.generate
```

### Cron Schedules

- `0 9 * * *` — Daily 9:00 AM (leads.followups.send)
- `0 18 * * *` — Daily 6:00 PM (summaries.daily.generate)
- `0 0 1 * *` — 1st of month, midnight (statements.monthly.generate)
- `0 0 * * *` — Daily midnight (customers.journeys.sync)

### Files to Reference

1. [trigger/client.ts](./trigger/client.ts) - Event constants
2. [trigger/jobs-registry.ts](./trigger/jobs-registry.ts) - Job configuration
3. [trigger/schedules.ts](./trigger/schedules.ts) - Cron expressions
4. [TRIGGER_MIGRATION_GUIDE.md](./TRIGGER_MIGRATION_GUIDE.md) - Full guide

## Rollback Instructions

If critical issues arise:

1. Identify failing event
2. Revert affected file(s): `git checkout HEAD~1 -- <file>`
3. Re-deploy
4. Delete problematic event from Trigger.dev dashboard
5. Test before re-deploying fixed version

---

**Deployment Owner:** _____________________  
**Date Started:** _____________________  
**Date Completed:** _____________________  
**Issues Encountered:** _____________________  

