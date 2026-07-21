/**
 * Trigger.dev Cron Scheduling Configuration
 * 
 * Defines recurring job schedules for automated workflows
 * 
 * Note: These cron configurations should be set up in your Trigger.dev dashboard
 * or deployed via your task configuration system.
 * 
 * Format: "minute hour day month day-of-week"
 * Reference: https://crontab.guru/
 */

export const TRIGGER_CRON_SCHEDULES = {
  /**
   * Lead Follow-up: Daily at 9 AM (9:00)
   * Sends follow-up messages to leads who haven't been contacted recently
   */
  LEADS_FOLLOWUPS_SEND: {
    schedule: "0 9 * * *",
    description: "Send daily follow-up messages to leads",
    timezone: "Africa/Lagos", // Adjust to your business timezone
  },

  /**
   * Daily Summary: Daily at 6 PM (18:00)
   * Generates and sends daily sales summary to N8N webhook
   */
  SUMMARIES_DAILY_GENERATE: {
    schedule: "0 18 * * *",
    description: "Generate and send daily sales summary",
    timezone: "Africa/Lagos",
  },

  /**
   * Monthly Statements: 1st of month at midnight (00:00)
   * Generates monthly financial statements and sends via N8N
   */
  STATEMENTS_MONTHLY_GENERATE: {
    schedule: "0 0 1 * *",
    description: "Generate monthly financial statements",
    timezone: "Africa/Lagos",
  },

  /**
   * Customer Journey Sync: Daily at midnight (00:00)
   * Auto-advances customers through journey stages
   * Awareness → Interest → Desire → Action
   */
  CUSTOMERS_JOURNEYS_SYNC: {
    schedule: "0 0 * * *",
    description: "Sync customer journey stages",
    timezone: "Africa/Lagos",
  },
} as const;

/**
 * Maps event names to their cron configurations
 * Use this when registering scheduled tasks in Trigger.dev
 */
export const TRIGGER_EVENT_SCHEDULES = {
  "leads.followups.send": TRIGGER_CRON_SCHEDULES.LEADS_FOLLOWUPS_SEND,
  "summaries.daily.generate": TRIGGER_CRON_SCHEDULES.SUMMARIES_DAILY_GENERATE,
  "statements.monthly.generate": TRIGGER_CRON_SCHEDULES.STATEMENTS_MONTHLY_GENERATE,
  "customers.journeys.sync": TRIGGER_CRON_SCHEDULES.CUSTOMERS_JOURNEYS_SYNC,
} as const;
