"use server";

import { db } from "@/lib/db";
import {
  marketingCampaigns,
  contentCalendar,
  leads,
  customerJourney,
  customerTestimonials,
  referralProgram,
  broadcastListMembers,
  whatsappBroadcasts,
  marketingKpis,
  customers,
  orders,
  socialPosts,
} from "@/lib/db/schema";
import { eq, desc, and, like, gte, lte, sql } from "drizzle-orm";
import { auth } from "@/auth";
import Sentiment from "sentiment";
import {
  createMarketingCampaignSchema,
  updateMarketingCampaignSchema,
  createContentPostSchema,
  createLeadSchema,
  updateLeadSchema,
  submitTestimonialSchema,
  createBroadcastSchema,
  addToBroadcastListSchema,
  updateKpiSchema,
} from "@/lib/validations/marketing";
import { ZodError } from "zod";
import { revalidatePath } from "next/cache";
import { scheduleSocialPost } from "@/lib/actions/social-media";
import {
  buildFollowUpDateForLead,
  calculateBroadcastPerformance,
  calculateLeadScore as calculateLeadScoreFromInput,
} from "@/lib/utils/marketing";
import { normalizeContentPostInput } from "@/lib/utils/marketing/content-calendar";
import { buildSocialAnalyticsKpiRows } from "@/lib/utils/marketing/social-analytics";
import { generateReferralCode as generateCode } from "@/lib/utils/referral";

// ============ CAMPAIGNS ============

export async function createMarketingCampaign(input: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized", success: false };
    }

    const validated = createMarketingCampaignSchema.parse(input);

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(marketingCampaigns).values({
      id,
      ...validated,
      targetPlatforms: JSON.stringify(validated.targetPlatforms),
      createdBy: session.user.id,
      createdAt: now,
      updatedAt: now,
    });

    revalidatePath("/marketing/campaigns");
    revalidatePath("/marketing");

    return { success: true, data: { id } };
  } catch (error) {
    if (error instanceof ZodError) {
      return { error: error.issues[0]?.message || "Validation failed", success: false };
    }
    return { error: "Failed to create campaign", success: false };
  }
}

export async function getCampaigns() {
  try {
    const campaigns = await db
      .select()
      .from(marketingCampaigns)
      .orderBy(desc(marketingCampaigns.createdAt));

    return {
      success: true,
      data: campaigns.map((c) => ({
        ...c,
        targetPlatforms: typeof c.targetPlatforms === "string" ? JSON.parse(c.targetPlatforms) : c.targetPlatforms,
      })),
    };
  } catch (error) {
    return { error: "Failed to fetch campaigns", success: false, data: [] };
  }
}

export async function updateCampaignStatus(campaignId: string, status: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized", success: false };
    }

    const now = new Date().toISOString();
    await db
      .update(marketingCampaigns)
      .set({ status: status as any, updatedAt: now })
      .where(eq(marketingCampaigns.id, campaignId));

    return { success: true };
  } catch (error) {
    return { error: "Failed to update campaign", success: false };
  }
}

// ============ CONTENT CALENDAR ============

export async function createContentPost(input: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized", success: false };
    }

    const normalizedInput = await normalizeContentPostInput(input as any);
    const validated = createContentPostSchema.parse(normalizedInput);

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const status = validated.scheduledDate ? "scheduled" : "draft";

    await db.insert(contentCalendar).values({
      id,
      ...validated,
      status,
      hashtags: validated.hashtags ? JSON.stringify(validated.hashtags) : null,
      createdBy: session.user.id,
      createdAt: now,
      updatedAt: now,
    });

    if (validated.scheduledDate) {
      const socialPostId = await scheduleSocialPost(
        {
          platform: validated.platform,
          caption: validated.caption || validated.title,
          imageUrl: validated.contentUrl,
          hashtags: validated.hashtags?.join(" "),
          scheduledAt: new Date(validated.scheduledDate).toISOString(),
        },
        { returnId: true },
      );

      await db
        .update(contentCalendar)
        .set({ bufferPostId: socialPostId, updatedAt: new Date().toISOString() })
        .where(eq(contentCalendar.id, id));
    }

    revalidatePath("/marketing/content-calendar");
    revalidatePath("/marketing");

    return { success: true, data: { id } };
  } catch (error) {
    if (error instanceof ZodError) {
      return { error: error.issues[0]?.message || "Validation failed", success: false };
    }
    return { error: "Failed to create content post", success: false };
  }
}

export async function getContentCalendar(filters?: { platform?: string; status?: string }) {
  try {
    let query = db.select().from(contentCalendar);

    if (filters?.platform) {
      query = query.where(eq(contentCalendar.platform, filters.platform as any)) as any;
    }
    if (filters?.status) {
      query = query.where(eq(contentCalendar.status, filters.status as any)) as any;
    }

    const items = await query.orderBy(desc(contentCalendar.scheduledDate));

    return {
      success: true,
      data: items.map((item) => ({
        ...item,
        hashtags: typeof item.hashtags === "string" ? JSON.parse(item.hashtags || "[]") : [],
      })),
    };
  } catch (error) {
    return { error: "Failed to fetch content calendar", success: false, data: [] };
  }
}

export async function updateContentStatus(postId: string, status: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized", success: false };
    }

    const now = new Date().toISOString();
    await db
      .update(contentCalendar)
      .set({ status: status as any, updatedAt: now })
      .where(eq(contentCalendar.id, postId));

    return { success: true };
  } catch (error) {
    return { error: "Failed to update content status", success: false };
  }
}

// ============ LEADS ============

export async function createLead(input: unknown) {
  try {
    const validated = createLeadSchema.parse(input);

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const calculatedLeadScore = calculateLeadScoreFromInput({
      source: validated.source,
      initialMessage: validated.initialMessage,
      interestedIn: validated.interestedIn,
    });
    const followUpDate = buildFollowUpDateForLead(new Date());

    await db.insert(leads).values({
      id,
      ...validated,
      leadScore: calculatedLeadScore,
      followUpDate,
      interestedIn: validated.interestedIn ? JSON.stringify(validated.interestedIn) : null,
      createdAt: now,
      updatedAt: now,
    } as any);

    revalidatePath("/marketing/leads");
    revalidatePath("/marketing");

    return { success: true, data: { id } };
  } catch (error) {
    if (error instanceof ZodError) {
      return { error: error.issues[0]?.message || "Validation failed", success: false };
    }
    return { error: "Failed to create lead", success: false };
  }
}

export async function getLeads(filters?: { status?: string; assignedTo?: string }) {
  try {
    let query = db.select().from(leads);

    if (filters?.status) {
      query = query.where(eq(leads.status, filters.status as any)) as any;
    }
    if (filters?.assignedTo) {
      query = query.where(eq(leads.assignedTo, filters.assignedTo)) as any;
    }

    const leadsData = await query.orderBy(desc(leads.createdAt));

    return {
      success: true,
      data: leadsData.map((lead) => ({
        ...lead,
        interestedIn: typeof lead.interestedIn === "string" ? JSON.parse(lead.interestedIn || "[]") : [],
      })),
    };
  } catch (error) {
    return { error: "Failed to fetch leads", success: false, data: [] };
  }
}

export async function getLeadById(leadId: string) {
  try {
    const lead = await db.query.leads.findFirst({
      where: eq(leads.id, leadId),
    });

    if (!lead) {
      return { error: "Lead not found", success: false };
    }

    return {
      success: true,
      data: {
        ...lead,
        interestedIn: typeof lead.interestedIn === "string" ? JSON.parse(lead.interestedIn || "[]") : [],
      },
    };
  } catch (error) {
    return { error: "Failed to fetch lead", success: false };
  }
}

export async function updateLead(input: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized", success: false };
    }

    const validated = updateLeadSchema.parse(input);
    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = { updatedAt: now };

    if (validated.status) {
      updateData.status = validated.status as any;
    }
    if (validated.assignedTo !== undefined) {
      updateData.assignedTo = validated.assignedTo || null;
    }
    if (validated.followUpDate !== undefined) {
      updateData.followUpDate = validated.followUpDate || null;
    }
    if (validated.notes !== undefined) {
      updateData.notes = validated.notes || null;
    }

    await db.update(leads).set(updateData).where(eq(leads.id, validated.id));

    revalidatePath("/marketing/leads");
    revalidatePath("/marketing");

    return { success: true };
  } catch (error) {
    if (error instanceof ZodError) {
      return { error: error.issues[0]?.message || "Validation failed", success: false };
    }
    return { error: "Failed to update lead", success: false };
  }
}

export async function updateLeadStatus(leadId: string, status: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized", success: false };
    }

    const now = new Date().toISOString();
    await db
      .update(leads)
      .set({ status: status as any, updatedAt: now })
      .where(eq(leads.id, leadId));

    return { success: true };
  } catch (error) {
    return { error: "Failed to update lead status", success: false };
  }
}

export async function assignLead(leadId: string, userId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized", success: false };
    }

    const now = new Date().toISOString();
    await db
      .update(leads)
      .set({ assignedTo: userId, updatedAt: now })
      .where(eq(leads.id, leadId));

    return { success: true };
  } catch (error) {
    return { error: "Failed to assign lead", success: false };
  }
}

// Calculate lead score based on engagement
export async function calculateLeadScore(leadId: string): Promise<number> {
  try {
    const leadData = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);

    if (!leadData.length) return 0;

    const lead = leadData[0];
    let score = 0;

    // Source scoring
    const sourceScores: Record<string, number> = {
      whatsapp: 30,
      instagram_dm: 25,
      tiktok_comment: 20,
      youtube_comment: 15,
      campus_popup: 20,
      referral: 35,
      other: 10,
    };
    score += sourceScores[lead.source] || 0;

    // Initial message scoring
    if (lead.initialMessage && lead.initialMessage.length > 20) {
      score += 15;
    }

    // Number of interested categories
    const interestedIn = typeof lead.interestedIn === "string" ? JSON.parse(lead.interestedIn || "[]") : [];
    score += Math.min(interestedIn.length * 10, 30);

    return Math.min(score, 100);
  } catch (error) {
    return 0;
  }
}

export async function convertLeadToCustomer(leadId: string, customerId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized", success: false };
    }

    const now = new Date().toISOString();

    // Update lead
    await db
      .update(leads)
      .set({
        status: "converted",
        convertedCustomerId: customerId,
        conversionDate: now,
        updatedAt: now,
      })
      .where(eq(leads.id, leadId));

    // Create customer journey entry if it doesn't exist
    const journeyExists = await db
      .select()
      .from(customerJourney)
      .where(eq(customerJourney.customerId, customerId))
      .limit(1);

    if (!journeyExists.length) {
      const journeyId = crypto.randomUUID();
      await db.insert(customerJourney).values({
        id: journeyId,
        customerId,
        leadId,
        stage: "action",
        stageEnteredAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true };
  } catch (error) {
    return { error: "Failed to convert lead", success: false };
  }
}

export async function convertLeadToCustomerRecord(leadId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized", success: false };
    }

    const lead = await db.query.leads.findFirst({
      where: eq(leads.id, leadId),
    });

    if (!lead) {
      return { error: "Lead not found", success: false };
    }

    if (lead.convertedCustomerId) {
      return { success: true, data: { customerId: lead.convertedCustomerId } };
    }

    const customerName = [lead.firstName, lead.lastName].filter(Boolean).join(" ").trim() || "Customer";
    const customerId = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(customers).values({
      id: customerId,
      name: customerName,
      phone: lead.whatsappNumber || lead.phone || null,
      email: lead.email || null,
      totalSpend: 0,
      createdAt: now,
      updatedAt: now,
    });

    await db.update(leads).set({
      status: "converted",
      convertedCustomerId: customerId,
      conversionDate: now,
      updatedAt: now,
    }).where(eq(leads.id, leadId));

    if (lead.whatsappNumber) {
      await autoAddToBroadcastList(customerId, lead.whatsappNumber, customerName);
    }

    const journeyId = crypto.randomUUID();
    await db.insert(customerJourney).values({
      id: journeyId,
      customerId,
      leadId,
      stage: "action",
      stageEnteredAt: now,
      touchpoints: JSON.stringify([]),
      lastInteraction: lead.initialMessage || "Converted from lead",
      lastInteractionDate: now,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, data: { customerId } };
  } catch (error) {
    console.error("Failed to convert lead to customer record:", error);
    return { error: "Failed to convert lead", success: false };
  }
}

// ============ BROADCAST LIST ============

export async function addCustomerToBroadcastList(input: unknown) {
  try {
    const validated = addToBroadcastListSchema.parse(input);

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(broadcastListMembers).values({
      id,
      ...validated,
      consentDate: now,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, data: { id } };
  } catch (error) {
    if (error instanceof ZodError) {
      return { error: error.issues[0]?.message || "Validation failed", success: false };
    }
    return { error: "Failed to add to broadcast list", success: false };
  }
}

export async function getBroadcastList(segment?: string) {
  try {
    const query = segment
      ? db
          .select()
          .from(broadcastListMembers)
          .where(and(eq(broadcastListMembers.status, "active"), eq(broadcastListMembers.segment, segment as any)))
      : db
          .select()
          .from(broadcastListMembers)
          .where(eq(broadcastListMembers.status, "active"));

    const members = await query.orderBy(desc(broadcastListMembers.createdAt));

    return { success: true, data: members };
  } catch (error) {
    return { error: "Failed to fetch broadcast list", success: false, data: [] };
  }
}

export async function generateReferralCodeForCustomer(customerId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized", success: false };
    }

    const existing = await db.query.referralProgram.findFirst({
      where: eq(referralProgram.referrerCustomerId, customerId),
    });

    if (existing) {
      return { success: true, data: { code: existing.referralCode, id: existing.id } };
    }

    const id = crypto.randomUUID();
    const code = generateCode(customerId);
    const now = new Date().toISOString();

    await db.insert(referralProgram).values({
      id,
      referrerCustomerId: customerId,
      referralCode: code,
      status: "pending",
      referralDate: now,
      createdAt: now,
      updatedAt: now,
    } as any);

    return { success: true, data: { code, id } };
  } catch (error) {
    console.error("Failed to generate referral code:", error);
    return { error: "Failed to generate referral code", success: false };
  }
}

// Internal helper to auto-add customers after orders (no validation needed)
export async function autoAddToBroadcastList(
  customerId: string,
  whatsappNumber: string,
  firstName?: string | null,
) {
  try {
    const existing = await db.query.broadcastListMembers.findFirst({
      where: and(eq(broadcastListMembers.whatsappNumber, whatsappNumber), eq(broadcastListMembers.status, "active")),
    });

    if (existing) {
      return { success: true, data: { id: existing.id } };
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(broadcastListMembers).values({
      id,
      customerId,
      whatsappNumber,
      firstName: firstName || null,
      segment: "repeat_customer",
      status: "active",
      consentGiven: 1,
      consentDate: now,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, data: { id } };
  } catch (error) {
    console.error("Failed to auto-add customer to broadcast list:", error);
    return { success: false, error: "Failed to add to broadcast list" };
  }
}

// ============ BROADCASTS ============

export async function createBroadcast(input: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized", success: false };
    }

    const validated = createBroadcastSchema.parse(input);

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const recipientRows = await db
      .select({ count: sql<number>`count(*)` })
      .from(broadcastListMembers)
      .where(and(eq(broadcastListMembers.segment, validated.recipientsSegment as any), eq(broadcastListMembers.status, "active")));
    const totalRecipients = recipientRows[0]?.count ?? 0;
    const status = validated.scheduledDate ? "scheduled" : "draft";

    await db.insert(whatsappBroadcasts).values({
      id,
      ...validated,
      totalRecipients,
      status,
      createdBy: session.user.id,
      createdAt: now,
      updatedAt: now,
    });

    revalidatePath("/marketing/broadcasts");
    revalidatePath("/marketing");

    return { success: true, data: { id } };
  } catch (error) {
    if (error instanceof ZodError) {
      return { error: error.issues[0]?.message || "Validation failed", success: false };
    }
    return { error: "Failed to create broadcast", success: false };
  }
}

export async function getBroadcasts() {
  try {
    const broadcasts = await db
      .select()
      .from(whatsappBroadcasts)
      .orderBy(desc(whatsappBroadcasts.createdAt));

    return {
      success: true,
      data: broadcasts.map((broadcast) => ({
        ...broadcast,
        performance: calculateBroadcastPerformance({
          totalRecipients: broadcast.totalRecipients,
          sentCount: broadcast.sentCount,
          readCount: broadcast.readCount,
          clickCount: broadcast.clickCount,
        }),
      })),
    };
  } catch (error) {
    return { error: "Failed to fetch broadcasts", success: false, data: [] };
  }
}

export async function updateBroadcastDelivery(
  broadcastId: string,
  input: { status?: string; sentCount?: number; readCount?: number; clickCount?: number; sentDate?: string },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized", success: false };
    }

    const now = new Date().toISOString();
    const updates: Record<string, unknown> = { updatedAt: now };

    if (input.status) {
      updates.status = input.status as any;
    }
    if (input.sentCount !== undefined) {
      updates.sentCount = input.sentCount;
    }
    if (input.readCount !== undefined) {
      updates.readCount = input.readCount;
    }
    if (input.clickCount !== undefined) {
      updates.clickCount = input.clickCount;
    }
    if (input.sentDate) {
      updates.sentDate = input.sentDate;
    }

    if (!input.status && (input.sentCount !== undefined || input.readCount !== undefined || input.clickCount !== undefined)) {
      updates.status = "sent";
    }

    await db.update(whatsappBroadcasts).set(updates as any).where(eq(whatsappBroadcasts.id, broadcastId));

    revalidatePath("/marketing/broadcasts");
    revalidatePath("/marketing");

    return { success: true };
  } catch (error) {
    return { error: "Failed to update broadcast delivery", success: false };
  }
}

// ============ TESTIMONIALS ============

export async function submitTestimonial(input: unknown) {
  try {
    const validated = submitTestimonialSchema.parse(input);

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(customerTestimonials).values({
      id,
      ...validated,
      status: "pending_approval",
      createdAt: now,
      updatedAt: now,
    });

    revalidatePath("/marketing/testimonials");
    revalidatePath("/marketing");

    return { success: true, data: { id } };
  } catch (error) {
    if (error instanceof ZodError) {
      return { error: error.issues[0]?.message || "Validation failed", success: false };
    }
    return { error: "Failed to submit testimonial", success: false };
  }
}

export async function getTestimonials(status?: string) {
  try {
    let query = db.select().from(customerTestimonials);

    if (status) {
      query = query.where(eq(customerTestimonials.status, status as any)) as any;
    }

    const testimonials = await query.orderBy(desc(customerTestimonials.createdAt));

    return { success: true, data: testimonials };
  } catch (error) {
    return { error: "Failed to fetch testimonials", success: false, data: [] };
  }
}

export async function approveTestimonial(testimonialId: string, featured: boolean = false) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized", success: false };
    }

    const now = new Date().toISOString();
    const featuredUntil = featured ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null;

    await db
      .update(customerTestimonials)
      .set({
        status: featured ? "featured" : "approved",
        approvedBy: session.user.id,
        approvedAt: now,
        featuredUntil,
        updatedAt: now,
      })
      .where(eq(customerTestimonials.id, testimonialId));

    return { success: true };
  } catch (error) {
    console.error("Failed to approve testimonial:", error);
    return { error: "Failed to approve testimonial", success: false };
  }
}

export async function repostTestimonialToSocial(testimonialId: string, platform: string = "instagram") {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized", success: false };
    }

    const testimonial = await db.query.customerTestimonials.findFirst({
      where: eq(customerTestimonials.id, testimonialId),
    });

    if (!testimonial) {
      return { error: "Testimonial not found", success: false };
    }

    const selectedPlatform = ["instagram", "tiktok", "youtube"].includes(platform)
      ? (platform as "instagram" | "tiktok" | "youtube")
      : "instagram";

    const caption = `${testimonial.textReview || "Customer feedback"}\n\n⭐ ${testimonial.rating}/5`;

    const postId = await scheduleSocialPost(
      {
        platform: selectedPlatform,
        caption,
        imageUrl: testimonial.imageUrl || undefined,
        hashtags: ["#UGC", "#Testimonial", "#CustomerLove"],
        scheduledAt: new Date().toISOString(),
      },
      { returnId: true },
    );

    const now = new Date().toISOString();
    await db
      .update(customerTestimonials)
      .set({
        status: "featured",
        approvedBy: session.user.id,
        approvedAt: now,
        featuredUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: now,
      })
      .where(eq(customerTestimonials.id, testimonialId));

    revalidatePath("/marketing/testimonials");
    return { success: true, data: { postId } };
  } catch (error) {
    console.error("Failed to repost testimonial to social:", error);
    return { error: "Failed to repost testimonial to social", success: false };
  }
}

// ============ REFERRALS ============

export async function generateReferralCode(customerId: string): Promise<string> {
  return `REF-${customerId.slice(0, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export async function createReferral(referrerCustomerId: string, referredCustomerId: string) {
  try {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const referralCode = await generateReferralCode(referrerCustomerId);

    await db.insert(referralProgram).values({
      id,
      referrerCustomerId,
      referredCustomerId,
      referralCode,
      status: "pending",
      referralDate: now,
      createdAt: now,
      updatedAt: now,
    });

    revalidatePath("/marketing/referrals");
    revalidatePath("/marketing");

    return { success: true, data: { id, referralCode } };
  } catch (error) {
    return { error: "Failed to create referral", success: false };
  }
}

export async function completeReferral(referralId: string, rewardAmount: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized", success: false };
    }

    const now = new Date().toISOString();

    await db
      .update(referralProgram)
      .set({
        status: "completed",
        rewardGivenAmount: rewardAmount,
        rewardGivenDate: now,
        conversionDate: now,
        updatedAt: now,
      })
      .where(eq(referralProgram.id, referralId));

    return { success: true };
  } catch (error) {
    return { error: "Failed to complete referral", success: false };
  }
}

export async function getReferrals() {
  try {
    const referrals = await db
      .select()
      .from(referralProgram)
      .orderBy(desc(referralProgram.referralDate));

    return { success: true, data: referrals };
  } catch (error) {
    return { error: "Failed to fetch referrals", success: false, data: [] };
  }
}

// ============ KPIs ============

export async function updateKpi(input: unknown) {
  try {
    const validated = updateKpiSchema.parse(input);

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(marketingKpis).values({
      id,
      ...validated,
      createdAt: now,
      updatedAt: now,
    });

    revalidatePath("/marketing/analytics");
    revalidatePath("/marketing");

    return { success: true, data: { id } };
  } catch (error) {
    if (error instanceof ZodError) {
      return { error: error.issues[0]?.message || "Validation failed", success: false };
    }
    return { error: "Failed to update KPI", success: false };
  }
}

export async function getKpis(period?: string, platform?: string) {
  try {
    let query = db.select().from(marketingKpis);

    if (period) {
      query = query.where(eq(marketingKpis.period, period as any)) as any;
    }
    if (platform) {
      query = query.where(eq(marketingKpis.platform, platform as any)) as any;
    }

    const kpis = await query.orderBy(desc(marketingKpis.createdAt));

    return { success: true, data: kpis };
  } catch (error) {
    return { error: "Failed to fetch KPIs", success: false, data: [] };
  }
}

export async function getSocialMetricsSummary() {
  try {
    const posts = await db.query.socialPosts.findMany();

    const summary = {
      instagram: { posted: 0, scheduled: 0, failed: 0 },
      tiktok: { posted: 0, scheduled: 0, failed: 0 },
      youtube: { posted: 0, scheduled: 0, failed: 0 },
      pendingUpdates: 0,
    };

    for (const post of posts) {
      const platform = post.platform as "instagram" | "tiktok" | "youtube";
      if (post.status === "posted") {
        summary[platform].posted += 1;
      } else if (post.status === "scheduled") {
        summary[platform].scheduled += 1;
        summary.pendingUpdates += 1;
      } else if (post.status === "failed") {
        summary[platform].failed += 1;
      }
    }

    return { success: true, data: summary };
  } catch (error) {
    console.error("Failed to fetch social metrics summary:", error);
    return { error: "Failed to fetch social metrics summary", success: false };
  }
}

export async function syncSocialAnalyticsMetrics() {
  try {
    const result = await getSocialMetricsSummary();
    if (!result.success) {
      return result;
    }

    const summary = result.data as {
      instagram: { posted: number; scheduled: number; failed: number };
      tiktok: { posted: number; scheduled: number; failed: number };
      youtube: { posted: number; scheduled: number; failed: number };
      pendingUpdates: number;
    };

    const now = new Date();
    const rows = buildSocialAnalyticsKpiRows(summary, now);

    await db.insert(marketingKpis).values(rows as any);
    revalidatePath("/marketing/analytics");
    revalidatePath("/marketing");

    return { success: true, data: summary };
  } catch (error) {
    console.error("Failed to sync social analytics metrics:", error);
    return { error: "Failed to sync social analytics metrics", success: false };
  }
}

// ============ CUSTOMER JOURNEY ============

export async function advanceCustomerStage(customerId: string, newStage: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized", success: false };
    }

    const now = new Date().toISOString();

    const existing = await db
      .select()
      .from(customerJourney)
      .where(eq(customerJourney.customerId, customerId))
      .limit(1);

    if (existing.length) {
      await db
        .update(customerJourney)
        .set({
          stage: newStage as any,
          stageEnteredAt: now,
          updatedAt: now,
        })
        .where(eq(customerJourney.customerId, customerId));
    } else {
      const journeyId = crypto.randomUUID();
      await db.insert(customerJourney).values({
        id: journeyId,
        customerId,
        stage: newStage as any,
        stageEnteredAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    revalidatePath("/marketing/customer-journey");
    revalidatePath("/marketing");

    return { success: true };
  } catch (error) {
    return { error: "Failed to advance customer stage", success: false };
  }
}

export async function getCustomerJourney(customerId: string) {
  try {
    const journey = await db
      .select()
      .from(customerJourney)
      .where(eq(customerJourney.customerId, customerId))
      .limit(1);

    if (!journey.length) {
      return { success: true, data: null };
    }

    const journeyData = journey[0];
    return {
      success: true,
      data: {
        ...journeyData,
        touchpoints: typeof journeyData.touchpoints === "string" ? JSON.parse(journeyData.touchpoints || "[]") : [],
      },
    };
  } catch (error) {
    return { error: "Failed to fetch customer journey", success: false };
  }
}

export async function recordTouchpoint(
  customerId: string,
  touchpointType: string,
  touchpointDescription: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized", success: false };
    }

    const now = new Date().toISOString();
    const touchpointId = `${touchpointType}-${Date.now()}`;

    const existing = await db
      .select()
      .from(customerJourney)
      .where(eq(customerJourney.customerId, customerId))
      .limit(1);

    let touchpoints: string[] = [];
    if (existing.length) {
      const existingTouchpoints = existing[0].touchpoints;
      touchpoints = typeof existingTouchpoints === "string" ? JSON.parse(existingTouchpoints || "[]") : [];
      touchpoints.push(touchpointId);

      await db
        .update(customerJourney)
        .set({
          touchpoints: JSON.stringify(touchpoints),
          lastInteraction: touchpointDescription,
          lastInteractionDate: now,
          updatedAt: now,
        })
        .where(eq(customerJourney.customerId, customerId));
    } else {
      touchpoints = [touchpointId];
      const journeyId = crypto.randomUUID();
      await db.insert(customerJourney).values({
        id: journeyId,
        customerId,
        stage: "awareness",
        stageEnteredAt: now,
        touchpoints: JSON.stringify(touchpoints),
        lastInteraction: touchpointDescription,
        lastInteractionDate: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    revalidatePath("/marketing/customer-journey");
    return { success: true };
  } catch (error) {
    return { error: "Failed to record touchpoint", success: false };
  }
}

export async function getJourneyMetrics() {
  try {
    // Get all customer journeys with related customer info
    const journeys = await db
      .select({
        id: customerJourney.id,
        customerId: customerJourney.customerId,
        stage: customerJourney.stage,
        stageEnteredAt: customerJourney.stageEnteredAt,
        touchpoints: customerJourney.touchpoints,
        lastInteraction: customerJourney.lastInteraction,
        lastInteractionDate: customerJourney.lastInteractionDate,
        lifetimeValue: customerJourney.lifetimeValue,
        customerName: customers.name,
        customerEmail: customers.email,
        customerPhone: customers.phone,
      })
      .from(customerJourney)
      .leftJoin(customers, eq(customerJourney.customerId, customers.id));

    // Calculate metrics
    const stageBreakdown = {
      awareness: 0,
      interest: 0,
      desire: 0,
      action: 0,
      loyalty: 0,
    };

    let totalLifetimeValue = 0;
    let averageTouchpoints = 0;

    for (const journey of journeys) {
      stageBreakdown[journey.stage as keyof typeof stageBreakdown]++;
      totalLifetimeValue += journey.lifetimeValue || 0;
      const touchpoints = typeof journey.touchpoints === "string" ? JSON.parse(journey.touchpoints || "[]") : [];
      averageTouchpoints += touchpoints.length;
    }

    averageTouchpoints = journeys.length > 0 ? Math.round(averageTouchpoints / journeys.length) : 0;

    return {
      success: true,
      data: {
        totalCustomers: journeys.length,
        stageBreakdown,
        totalLifetimeValue,
        averageTouchpoints,
        journeys: journeys.map((j) => ({
          ...j,
          touchpoints: typeof j.touchpoints === "string" ? JSON.parse(j.touchpoints || "[]") : [],
        })),
      },
    };
  } catch (error) {
    console.error("Failed to fetch journey metrics:", error);
    return { error: "Failed to fetch journey metrics", success: false };
  }
}

// ============ SENTIMENT ANALYSIS ============

export async function analyzeSentiment(text: string) {
  try {
    const sentiment = new Sentiment();
    const result = sentiment.analyze(text);

    // Map sentiment score to label
    let sentimentLabel: "positive" | "neutral" | "negative" = "neutral";
    if (result.score > 0) sentimentLabel = "positive";
    else if (result.score < 0) sentimentLabel = "negative";

    return {
      success: true,
      data: {
        sentiment: sentimentLabel,
        score: result.score,
        comparative: result.comparative,
      },
    };
  } catch (error) {
    console.error("Failed to analyze sentiment:", error);
    return { error: "Failed to analyze sentiment", success: false };
  }
}

export async function submitTestimonialWithSentiment(
  customerId: string,
  productId: string,
  rating: number,
  textReview: string,
  platformShared: string,
  imageUrl?: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized", success: false };
    }

    // Analyze sentiment
    const sentimentResult = await analyzeSentiment(textReview);
    const sentiment = sentimentResult.success ? sentimentResult.data?.sentiment : "neutral";
    const sentimentScore = sentimentResult.success ? sentimentResult.data?.score : 0;

    const now = new Date().toISOString();
    const testimonialId = crypto.randomUUID();

    await db.insert(customerTestimonials).values({
      id: testimonialId,
      customerId,
      productId,
      rating,
      textReview,
      imageUrl: imageUrl || null,
      platformShared: platformShared as any,
      sentiment: sentiment as any,
      sentimentScore,
      status: "pending_approval",
      createdAt: now,
      updatedAt: now,
    });

    revalidatePath("/marketing/testimonials");
    return { success: true, data: { id: testimonialId, sentiment } };
  } catch (error) {
    console.error("Failed to submit testimonial:", error);
    return { error: "Failed to submit testimonial", success: false };
  }
}

export async function getTestimonialsBySentiment() {
  try {
    const testimonials = await db.query.customerTestimonials.findMany();

    const bySentiment = {
      positive: testimonials.filter((t) => t.sentiment === "positive"),
      neutral: testimonials.filter((t) => t.sentiment === "neutral"),
      negative: testimonials.filter((t) => t.sentiment === "negative"),
    };

    return {
      success: true,
      data: {
        total: testimonials.length,
        positive: bySentiment.positive.length,
        neutral: bySentiment.neutral.length,
        negative: bySentiment.negative.length,
        testimonials: bySentiment,
      },
    };
  } catch (error) {
    console.error("Failed to fetch testimonials by sentiment:", error);
    return { error: "Failed to fetch testimonials", success: false };
  }
}

// ============ A/B TESTING FOR BROADCASTS ============

export async function createBroadcastABTest(
  campaignId: string,
  textA: string,
  textB: string,
  recipientsSegment: string,
  scheduledDate: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized", success: false };
    }

    const now = new Date().toISOString();
    const parentId = crypto.randomUUID();
    const variantAId = crypto.randomUUID();
    const variantBId = crypto.randomUUID();

    // Split recipients segment 50/50 for each variant
    const listMembers = await db
      .select()
      .from(broadcastListMembers)
      .where(eq(broadcastListMembers.segment, recipientsSegment as any));

    const halfSize = Math.ceil(listMembers.length / 2);
    const totalRecipients = Math.max(halfSize, 1);

    const status = scheduledDate ? "scheduled" : "draft";

    // Create parent broadcast (tracks winner)
    await db.insert(whatsappBroadcasts).values({
      id: parentId,
      campaignId,
      broadcastText: `A/B Test: A vs B`,
      recipientsSegment: recipientsSegment as any,
      totalRecipients: halfSize * 2,
      status,
      scheduledDate: scheduledDate || null,
      isABTest: 1,
      createdBy: session.user.id,
      createdAt: now,
      updatedAt: now,
    } as any);

    // Create variant A
    await db.insert(whatsappBroadcasts).values({
      id: variantAId,
      campaignId,
      broadcastText: textA,
      recipientsSegment: recipientsSegment as any,
      totalRecipients,
      status,
      scheduledDate: scheduledDate || null,
      isABTest: 1,
      parentBroadcastId: parentId,
      variantLabel: "A",
      createdBy: session.user.id,
      createdAt: now,
      updatedAt: now,
    } as any);

    // Create variant B
    await db.insert(whatsappBroadcasts).values({
      id: variantBId,
      campaignId,
      broadcastText: textB,
      recipientsSegment: recipientsSegment as any,
      totalRecipients,
      status,
      scheduledDate: scheduledDate || null,
      isABTest: 1,
      parentBroadcastId: parentId,
      variantLabel: "B",
      createdBy: session.user.id,
      createdAt: now,
      updatedAt: now,
    } as any);

    revalidatePath("/marketing/broadcasts");
    return {
      success: true,
      data: {
        parentId,
        variantAId,
        variantBId,
        splitSize: totalRecipients,
      },
    };
  } catch (error) {
    console.error("Failed to create A/B test:", error);
    return { error: "Failed to create A/B test", success: false };
  }
}

export async function determineABTestWinner(parentBroadcastId: string) {
  try {
    // Get both variants
    const variants = await db
      .select()
      .from(whatsappBroadcasts)
      .where(eq(whatsappBroadcasts.parentBroadcastId, parentBroadcastId));

    if (variants.length < 2) {
      return { error: "A/B test variants not found", success: false };
    }

    // Calculate engagement rates
    const rates = variants.map((v) => ({
      id: v.id,
      variant: v.variantLabel,
      sentCount: v.sentCount || 0,
      readCount: v.readCount || 0,
      clickCount: v.clickCount || 0,
      engagementRate:
        (v.sentCount || 0) > 0 ? ((v.readCount || 0) + (v.clickCount || 0)) / (v.sentCount || 0) : 0,
    }));

    // Find winner
    const winner = rates.reduce((prev, current) =>
      current.engagementRate > prev.engagementRate ? current : prev
    );

    // Update parent with winner
    const now = new Date().toISOString();
    await db
      .update(whatsappBroadcasts)
      .set({
        winnerVariant: winner.variant,
        updatedAt: now,
      })
      .where(eq(whatsappBroadcasts.id, parentBroadcastId));

    revalidatePath("/marketing/broadcasts");
    return {
      success: true,
      data: {
        winner: winner.variant,
        rates,
      },
    };
  } catch (error) {
    console.error("Failed to determine winner:", error);
    return { error: "Failed to determine winner", success: false };
  }
}

export async function syncBroadcastWinnerToBuffer(parentBroadcastId: string, platform: "instagram" | "tiktok" | "youtube" = "instagram") {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized", success: false };
    }

    const parent = await db.query.whatsappBroadcasts.findFirst({
      where: eq(whatsappBroadcasts.id, parentBroadcastId),
    });

    if (!parent || !parent.winnerVariant) {
      return { error: "No winner available to sync", success: false };
    }

    const winner = await db.query.whatsappBroadcasts.findFirst({
      where: and(
        eq(whatsappBroadcasts.parentBroadcastId, parentBroadcastId),
        eq(whatsappBroadcasts.variantLabel, parent.winnerVariant),
      ),
    });

    if (!winner) {
      return { error: "Winner variant not found", success: false };
    }

    const scheduledAt = winner.scheduledDate || new Date().toISOString();
    const bufferPostId = await scheduleSocialPost(
      {
        platform,
        caption: winner.broadcastText,
        imageUrl: winner.broadcastImageUrl || undefined,
        hashtags: undefined,
        scheduledAt,
      },
      { returnId: true },
    );

    const now = new Date().toISOString();
    await db
      .update(whatsappBroadcasts)
      .set({
        bufferPostId,
        updatedAt: now,
      })
      .where(eq(whatsappBroadcasts.id, winner.id));

    revalidatePath("/marketing/broadcasts");

    return {
      success: true,
      data: {
        bufferPostId,
        platform,
      },
    };
  } catch (error) {
    console.error("Failed to sync broadcast winner to Buffer:", error);
    return { error: "Failed to sync winner to Buffer", success: false };
  }
}

export async function getABTestResults(parentBroadcastId: string) {
  try {
    const parent = await db.query.whatsappBroadcasts.findFirst({
      where: eq(whatsappBroadcasts.id, parentBroadcastId),
    });

    const variants = await db
      .select()
      .from(whatsappBroadcasts)
      .where(eq(whatsappBroadcasts.parentBroadcastId, parentBroadcastId));

    const results = variants.map((v) => ({
      id: v.id,
      variant: v.variantLabel,
      text: v.broadcastText,
      sentCount: v.sentCount || 0,
      readCount: v.readCount || 0,
      clickCount: v.clickCount || 0,
      engagementRate:
        (v.sentCount || 0) > 0 ? (((v.readCount || 0) + (v.clickCount || 0)) / (v.sentCount || 0) * 100).toFixed(1) : "0",
    }));

    return {
      success: true,
      data: {
        parentId: parentBroadcastId,
        winner: parent?.winnerVariant,
        variants: results,
      },
    };
  } catch (error) {
    console.error("Failed to fetch A/B test results:", error);
    return { error: "Failed to fetch A/B test results", success: false };
  }
}

// ============ BUFFER INTEGRATION ============

export async function syncContentToBuffer(contentId: string, bufferAccessToken?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized", success: false };
    }

    const content = await db.query.contentCalendar.findFirst({
      where: eq(contentCalendar.id, contentId),
    });

    if (!content) {
      return { error: "Content not found", success: false };
    }

    const supportedPlatforms = ["instagram", "tiktok", "youtube"];
    const platform = supportedPlatforms.includes(content.platform as string)
      ? (content.platform as "instagram" | "tiktok" | "youtube")
      : "instagram";

    const scheduledAt = content.scheduledDate || new Date().toISOString();

    const postId = await scheduleSocialPost(
      {
        platform,
        caption: content.caption || content.title,
        imageUrl: content.contentUrl || undefined,
        hashtags: content.hashtags ? JSON.parse(content.hashtags as string) : undefined,
        scheduledAt,
      },
      { returnId: true },
    );

    const now = new Date().toISOString();
    await db
      .update(contentCalendar)
      .set({
        bufferPostId: postId,
        status: "scheduled",
        updatedAt: now,
      })
      .where(eq(contentCalendar.id, contentId));

    revalidatePath("/marketing/content-calendar");
    return {
      success: true,
      data: {
        bufferId: postId,
        message: "Content synced to Buffer successfully",
      },
    };
  } catch (error) {
    console.error("Failed to sync to Buffer:", error);
    return { error: "Failed to sync to Buffer", success: false };
  }
}

export async function getBufferStats(bufferAccessToken?: string) {
  try {
    const token = bufferAccessToken || process.env.BUFFER_ACCESS_TOKEN;
    if (!token) {
      return {
        error: "Buffer access token not configured",
        success: false,
      };
    }

    // Fetch Buffer profiles
    const profilesResponse = await fetch("https://api.bufferapp.com/1/profiles.json?access_token=" + token);

    if (!profilesResponse.ok) {
      return { error: "Failed to fetch Buffer profiles", success: false };
    }

    const profiles = await profilesResponse.json();

    // Get updates pending for each profile
    const allUpdates = [];
    for (const profile of profiles) {
      const updatesResponse = await fetch(
        `https://api.bufferapp.com/1/profiles/${profile.id}/updates/pending.json?access_token=${token}&limit=10`
      );

      if (updatesResponse.ok) {
        const updates = await updatesResponse.json();
        allUpdates.push(...(updates.updates || []));
      }
    }

    return {
      success: true,
      data: {
        profilesCount: profiles.length,
        pendingUpdates: allUpdates.length,
        profiles,
      },
    };
  } catch (error) {
    console.error("Failed to fetch Buffer stats:", error);
    return { error: "Failed to fetch Buffer stats", success: false };
  }
}
