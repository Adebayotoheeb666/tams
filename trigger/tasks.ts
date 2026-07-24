import { schedules, task } from "@trigger.dev/sdk";

import { appointmentConfirmedJob } from "./jobs/appointment-confirmed";
import { appointmentRemindersJob } from "./jobs/appointment-reminders";
import { customerJourneySyncJob } from "./jobs/customer-journey-sync";
import { dailySummaryJob } from "./jobs/daily-summary";
import { exportStatementJob } from "./jobs/export-statement";
import { leadFollowUpJob } from "./jobs/lead-follow-up";
import { lowStockAlertJob } from "./jobs/low-stock-alert";
import { monthlyStatementsJob } from "./jobs/monthly-statements";
import { socialPostPublisherJob } from "./jobs/social-post-publisher";

// Event-driven tasks
export const socialPostPublisherTask = task({
  id: "social.posts.publish",
  run: async (payload: { postId?: string }) => socialPostPublisherJob(payload),
});

export const lowStockAlertTask = task({
  id: "inventory.alerts.low-stock",
  run: async (payload: { productId?: string; productName?: string; currentQuantity?: number; reorderLevel?: number }) => {
    return lowStockAlertJob();
  },
});

export const appointmentReminderTask = task({
  id: "appointments.reminders.send",
  run: async (payload: { appointmentId?: string }) => {
    return appointmentRemindersJob();
  },
});

export const appointmentConfirmedTask = task({
  id: "appointments.confirmations.send",
  run: async (payload: { appointmentId?: string }) => {
    if (!payload.appointmentId) {
      return { ok: true, message: "No appointment ID supplied" };
    }

    return appointmentConfirmedJob(payload.appointmentId);
  },
});

export const exportStatementTask = task({
  id: "exports.statements.generate",
  run: async (payload: { jobId?: string }) => {
    if (!payload.jobId) {
      throw new Error("A jobId is required");
    }

    return exportStatementJob(payload.jobId);
  },
});

// Scheduled / recurring tasks
export const leadFollowUpTask = schedules.task({
  id: "leads.followups.send",
  cron: {
    pattern: "0 9 * * *",
    timezone: "Africa/Lagos",
  },
  run: async () => leadFollowUpJob(),
});

export const dailySummaryTask = schedules.task({
  id: "summaries.daily.generate",
  cron: {
    pattern: "0 18 * * *",
    timezone: "Africa/Lagos",
  },
  run: async () => dailySummaryJob(),
});

export const monthlyStatementsTask = schedules.task({
  id: "statements.monthly.generate",
  cron: {
    pattern: "0 0 1 * *",
    timezone: "Africa/Lagos",
  },
  run: async () => monthlyStatementsJob(),
});

export const customerJourneySyncTask = schedules.task({
  id: "customers.journeys.sync",
  cron: {
    pattern: "0 0 * * *",
    timezone: "Africa/Lagos",
  },
  run: async () => customerJourneySyncJob(),
});

export const triggerAutomations = {
  socialPostPublisherTask,
  lowStockAlertTask,
  appointmentReminderTask,
  appointmentConfirmedTask,
  exportStatementTask,
  leadFollowUpTask,
  dailySummaryTask,
  monthlyStatementsTask,
  customerJourneySyncTask,
};

export const allTriggerTasks = Object.values(triggerAutomations);
