/**
 * Trigger.dev Jobs Registry & Configuration
 * 
 * This file documents all jobs available in the system and how to configure them.
 * 
 * Job Types:
 * 1. Event-driven: Triggered when a specific event occurs
 * 2. Scheduled (Cron): Triggered on a recurring schedule
 * 3. Manual: Can be triggered manually via API
 */

import { TRIGGER_EVENTS } from "./client";
import { TRIGGER_CRON_SCHEDULES } from "./schedules";

/**
 * Event-Driven Jobs
 * These jobs are triggered when their corresponding event occurs
 */
export const EVENT_DRIVEN_JOBS = {
  /**
   * Social Posts Publisher
   * Event: social.posts.publish
   * Triggered when: A scheduled social media post's time arrives
   * Handler: trigger/jobs/social-post-publisher.ts
   * Integration: Buffer (Instagram, TikTok), YouTube Data API
   */
  SOCIAL_POSTS_PUBLISH: {
    event: TRIGGER_EVENTS.SOCIAL_POSTS_PUBLISH,
    description: "Publish scheduled social media posts to Instagram, TikTok, YouTube",
    inputSchema: {
      postId: "UUID of the scheduled social post",
    },
  },

  /**
   * Inventory Alerts (Low Stock)
   * Event: inventory.alerts.low-stock
   * Triggered when: Product quantity falls below reorder level (during stock adjustment or sale)
   * Handler: trigger/jobs/low-stock-alert.ts
   * Notification: N8N webhook to inventory team
   */
  INVENTORY_ALERTS_LOW_STOCK: {
    event: TRIGGER_EVENTS.INVENTORY_ALERTS_LOW_STOCK,
    description: "Send low stock alerts to inventory team via N8N",
    inputSchema: {
      productId: "UUID of product",
      productName: "Product name",
      currentQuantity: "Current stock quantity",
      reorderLevel: "Reorder threshold",
    },
  },

  /**
   * Appointment Reminders
   * Event: appointments.reminders.send
   * Triggered when: An appointment is created (24 hours before)
   * Handler: trigger/jobs/appointment-reminders.ts
   * Notification: WhatsApp via Twilio + N8N webhook
   */
  APPOINTMENTS_REMINDERS_SEND: {
    event: TRIGGER_EVENTS.APPOINTMENTS_REMINDERS_SEND,
    description: "Send appointment reminders to customers via WhatsApp",
    inputSchema: {
      appointmentId: "UUID of appointment",
      customerName: "Customer name",
      customerPhone: "Customer phone (E.164 format)",
      appointmentDate: "YYYY-MM-DD",
      appointmentTime: "HH:MM",
    },
  },

  /**
   * Appointment Confirmations
   * Event: appointments.confirmations.send
   * Triggered when: An appointment is confirmed by staff
   * Handler: trigger/jobs/appointment-confirmed.ts
   * Notification: Customer marketing data sent to N8N
   */
  APPOINTMENTS_CONFIRMATIONS_SEND: {
    event: TRIGGER_EVENTS.APPOINTMENTS_CONFIRMATIONS_SEND,
    description: "Send appointment confirmation data to N8N for marketing",
    inputSchema: {
      appointmentId: "UUID of appointment",
      customerName: "Customer name",
      customerPhone: "Customer phone",
      appointmentDate: "YYYY-MM-DD",
      appointmentTime: "HH:MM",
    },
  },

  /**
   * Export Statements (Manual/On-Demand)
   * Event: exports.statements.generate
   * Triggered when: User requests PDF/Excel export from dashboard
   * Handler: trigger/jobs/export-statement.tsx
   * Output: File uploaded to Cloudinary, webhook callback with URL
   */
  EXPORTS_STATEMENTS_GENERATE: {
    event: TRIGGER_EVENTS.EXPORTS_STATEMENTS_GENERATE,
    description: "Generate and upload financial statement exports",
    inputSchema: {
      jobId: "UUID of export job",
      exportType: "pdf | excel",
      dateRange: "{ from: ISO8601, to: ISO8601 }",
    },
  },
} as const;

/**
 * Scheduled (Cron) Jobs
 * These jobs run on a recurring schedule
 * 
 * Setup in Trigger.dev:
 * 1. Go to your Trigger.dev dashboard
 * 2. For each job below, create a new scheduled task
 * 3. Set the cron expression from TRIGGER_CRON_SCHEDULES
 * 4. Set the timezone (Africa/Lagos recommended for TBH)
 * 5. Configure the input payload (usually empty object {})
 * 
 * Alternatively, if self-hosting Trigger.dev, configure via:
 * - environment variables
 * - CI/CD pipeline task scheduler
 * - systemd timer (Linux)
 */
export const SCHEDULED_JOBS = {
  /**
   * Lead Follow-ups: Daily at 9 AM
   * Handler: trigger/jobs/lead-follow-up.ts
   * Action: Sends follow-up messages to leads via N8N webhook
   * Setup: Create cron task with schedule from TRIGGER_CRON_SCHEDULES.LEADS_FOLLOWUPS_SEND
   */
  LEADS_FOLLOWUPS_SEND: {
    event: TRIGGER_EVENTS.LEADS_FOLLOWUPS_SEND,
    ...TRIGGER_CRON_SCHEDULES.LEADS_FOLLOWUPS_SEND,
    handler: "trigger/jobs/lead-follow-up.ts",
  },

  /**
   * Daily Summary: Daily at 6 PM (18:00)
   * Handler: trigger/jobs/daily-summary.ts
   * Action: Generates daily sales summary and sends to N8N webhook
   * Webhook: N8N_WEBHOOK_BASE_URL + /webhook/daily-summary
   * Setup: Create cron task with schedule from TRIGGER_CRON_SCHEDULES.SUMMARIES_DAILY_GENERATE
   */
  SUMMARIES_DAILY_GENERATE: {
    event: TRIGGER_EVENTS.SUMMARIES_DAILY_GENERATE,
    ...TRIGGER_CRON_SCHEDULES.SUMMARIES_DAILY_GENERATE,
    handler: "trigger/jobs/daily-summary.ts",
  },

  /**
   * Monthly Statements: 1st of month at midnight (00:00)
   * Handler: trigger/jobs/monthly-statements.ts
   * Action: Generates monthly financial reports and sends to N8N webhook
   * Webhook: N8N_WEBHOOK_BASE_URL + /webhook/monthly-report
   * Setup: Create cron task with schedule from TRIGGER_CRON_SCHEDULES.STATEMENTS_MONTHLY_GENERATE
   */
  STATEMENTS_MONTHLY_GENERATE: {
    event: TRIGGER_EVENTS.STATEMENTS_MONTHLY_GENERATE,
    ...TRIGGER_CRON_SCHEDULES.STATEMENTS_MONTHLY_GENERATE,
    handler: "trigger/jobs/monthly-statements.ts",
  },

  /**
   * Customer Journey Sync: Daily at midnight (00:00)
   * Handler: trigger/jobs/customer-journey-sync.ts
   * Action: Auto-advances customers through journey stages
   * Stages: awareness → interest → desire → action
   * Setup: Create cron task with schedule from TRIGGER_CRON_SCHEDULES.CUSTOMERS_JOURNEYS_SYNC
   */
  CUSTOMERS_JOURNEYS_SYNC: {
    event: TRIGGER_EVENTS.CUSTOMERS_JOURNEYS_SYNC,
    ...TRIGGER_CRON_SCHEDULES.CUSTOMERS_JOURNEYS_SYNC,
    handler: "trigger/jobs/customer-journey-sync.ts",
  },
} as const;

/**
 * Setup Instructions for Scheduled Jobs
 * 
 * Option 1: Using Trigger.dev Cloud Dashboard
 * -----------------------------------------
 * 1. Log in to https://cloud.trigger.dev/
 * 2. Go to your project
 * 3. Click "Create Task" → "Scheduled Task"
 * 4. Fill in:
 *    - Name: e.g., "Daily Sales Summary"
 *    - Event: e.g., "summaries.daily.generate"
 *    - Cron: Use value from TRIGGER_CRON_SCHEDULES
 *    - Timezone: "Africa/Lagos"
 *    - Payload: {} (empty object)
 * 5. Click "Create"
 * 
 * Option 2: Self-Hosted Trigger.dev
 * -----------------------------------
 * In your deployment, use the task definitions in this file
 * and configure your job scheduler to call the API endpoints.
 * 
 * Option 3: Local Development
 * ----------------------------
 * Use a local cron scheduler like node-cron:
 *   import cron from 'node-cron';
 *   cron.schedule('0 18 * * *', async () => {
 *     await triggerClient.triggerEvent(TRIGGER_EVENTS.SUMMARIES_DAILY_GENERATE, {});
 *   });
 *
 * Option 4: Docker/systemd
 * -------------------------
 * Use a separate container running node-cron or use systemd timers
 */

export function printScheduleSetupGuide() {
  console.log("\n📅 Trigger.dev Scheduled Jobs Setup Guide\n");
  console.log("Copy these cron expressions to your Trigger.dev dashboard:\n");

  for (const [jobName, jobConfig] of Object.entries(SCHEDULED_JOBS)) {
    console.log(`${jobName}:`);
    console.log(`  Event: ${jobConfig.event}`);
    console.log(`  Cron:  ${jobConfig.schedule}`);
    console.log(`  TZ:    ${jobConfig.timezone}`);
    console.log(`  Desc:  ${jobConfig.description}\n`);
  }
}
