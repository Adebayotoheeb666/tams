import { z } from "zod";

// Marketing Campaigns
export const createMarketingCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().optional(),
  campaignType: z.enum(["product_launch", "flash_sale", "referral", "seasonal", "awareness"]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  targetPlatforms: z.array(z.string()), // ['instagram', 'tiktok', etc]
  goalDescription: z.string().optional(),
  budgetAllocation: z.number().optional().default(0),
});

export const updateMarketingCampaignSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["draft", "scheduled", "active", "completed", "paused"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  targetPlatforms: z.array(z.string()).optional(),
  goalDescription: z.string().optional(),
  budgetAllocation: z.number().optional(),
});

// Content Calendar
export const createContentPostSchema = z.object({
  campaignId: z.preprocess((value) => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed.length ? trimmed : undefined;
    }
    return value;
  }, z.string().optional()),
  platform: z.enum(["instagram", "tiktok", "youtube", "whatsapp", "email"]),
  contentType: z.enum([
    "product_showcase",
    "behind_the_scenes",
    "social_proof",
    "tutorial",
    "engagement",
    "offer",
    "story",
  ]),
  title: z.string().min(1, "Title is required"),
  caption: z.string().optional(),
  contentUrl: z.string().url().optional(),
  scheduledDate: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  targetAudience: z.string().optional(),
  callToAction: z.string().optional(),
});

export const updateContentPostSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  caption: z.string().optional(),
  status: z.enum(["draft", "scheduled", "posted", "cancelled"]).optional(),
  scheduledDate: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
});

// Leads
export const createLeadSchema = z.object({
  source: z.enum([
    "instagram_dm",
    "tiktok_comment",
    "whatsapp",
    "youtube_comment",
    "campus_popup",
    "referral",
    "other",
  ]),
  sourceUrl: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  whatsappNumber: z.string().optional(),
  interestedIn: z.array(z.string()).optional(), // ['thrift', 'nails']
  initialMessage: z.string().optional(),
  campaignId: z.string().optional(),
  status: z.enum(["new", "contacted", "interested", "converted", "lost", "nurturing"]).optional(),
  notes: z.string().optional(),
});

export const updateLeadSchema = z.object({
  id: z.string(),
  status: z.enum(["new", "contacted", "interested", "converted", "lost", "nurturing"]).optional(),
  assignedTo: z.string().optional(),
  followUpDate: z.string().optional(),
  notes: z.string().optional(),
});

export const updateLeadStatusSchema = z.object({
  leadId: z.string(),
  newStatus: z.enum(["new", "contacted", "interested", "converted", "lost", "nurturing"]),
});

const optionalStringId = z.preprocess((value) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }
  return value;
}, z.string().optional());

// Testimonials
export const submitTestimonialSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
  productId: optionalStringId,
  rating: z.number().min(1).max(5),
  textReview: z.string().optional(),
  imageUrl: z.string().optional(),
  platformShared: z.enum(["instagram", "tiktok", "whatsapp", "in_person"]),
});

export const approveTestimonialSchema = z.object({
  testimonialId: z.string(),
  featured: z.boolean().optional(),
  featuredUntil: z.string().optional(),
});

// Referral Program
export const generateReferralCodeSchema = z.object({
  customerId: z.string(),
});

export const completeReferralSchema = z.object({
  referralId: z.string(),
  referredCustomerId: z.string(),
});

// Broadcast
export const createBroadcastSchema = z.object({
  campaignId: optionalStringId,
  broadcastText: z.string().min(1, "Message is required"),
  broadcastImageUrl: z.string().optional(),
  recipientsSegment: z.enum(["vip", "repeat_customer", "new_customer", "inactive", "all"]),
  scheduledDate: z.string().optional(),
});

export const updateBroadcastSchema = z.object({
  id: z.string(),
  campaignId: optionalStringId,
  broadcastText: z.string().optional(),
  broadcastImageUrl: z.string().optional(),
  recipientsSegment: z.enum(["vip", "repeat_customer", "new_customer", "inactive", "all"]).optional(),
  scheduledDate: z.string().optional(),
});

export const sendBroadcastSchema = z.object({
  broadcastId: z.string(),
});

// Broadcast List
export const addToBroadcastListSchema = z.object({
  customerId: z.string(),
  whatsappNumber: z.string(),
  firstName: z.string().optional(),
  segment: z
    .enum(["vip", "repeat_customer", "new_customer", "inactive", "all"])
    .optional()
    .default("all"),
});

export const removeBroadcastListMemberSchema = z.object({
  memberId: z.string(),
});

// KPI
export const updateKpiSchema = z.object({
  metricName: z.string(),
  metricValue: z.number(),
  targetValue: z.number().optional(),
  platform: z.string().optional(),
  period: z.enum(["daily", "weekly", "monthly", "6_month"]),
  periodStartDate: z.string(),
  periodEndDate: z.string().optional(),
  dataSource: z.string().optional(),
});

// Types for use throughout the app
export type CreateMarketingCampaign = z.infer<typeof createMarketingCampaignSchema>;
export type UpdateMarketingCampaign = z.infer<typeof updateMarketingCampaignSchema>;
export type CreateContentPost = z.infer<typeof createContentPostSchema>;
export type UpdateContentPost = z.infer<typeof updateContentPostSchema>;
export type CreateLead = z.infer<typeof createLeadSchema>;
export type UpdateLead = z.infer<typeof updateLeadSchema>;
export type SubmitTestimonial = z.infer<typeof submitTestimonialSchema>;
export type ApproveTestimonial = z.infer<typeof approveTestimonialSchema>;
export type GenerateReferralCode = z.infer<typeof generateReferralCodeSchema>;
export type CompleteReferral = z.infer<typeof completeReferralSchema>;
export type CreateBroadcast = z.infer<typeof createBroadcastSchema>;
export type SendBroadcast = z.infer<typeof sendBroadcastSchema>;
export type AddToBroadcastList = z.infer<typeof addToBroadcastListSchema>;
