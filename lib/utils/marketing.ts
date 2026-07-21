export interface MarketingHealthScoreInput {
  campaigns?: Array<{ status?: string }>;
  leads?: Array<{ status?: string }>;
  broadcasts?: Array<{ status?: string }>;
  testimonials?: Array<{ status?: string }>;
  referrals?: Array<{ status?: string }>;
  kpis?: Array<{ metricValue?: number | null; targetValue?: number | null }>;
}

export interface LeadScoringInput {
  source?: string;
  initialMessage?: string | null;
  interestedIn?: string[] | null;
}

export interface BroadcastPerformanceInput {
  totalRecipients?: number | null;
  sentCount?: number | null;
  readCount?: number | null;
  clickCount?: number | null;
}

export function calculateBroadcastPerformance(broadcast: BroadcastPerformanceInput) {
  const totalRecipients = Math.max(0, Number(broadcast.totalRecipients ?? 0));
  const sentCount = Math.max(0, Number(broadcast.sentCount ?? 0));
  const readCount = Math.max(0, Number(broadcast.readCount ?? 0));
  const clickCount = Math.max(0, Number(broadcast.clickCount ?? 0));

  const deliveryRate = totalRecipients > 0 ? Math.round((sentCount / totalRecipients) * 100) : 0;
  const readRate = sentCount > 0 ? Math.round((readCount / sentCount) * 100) : 0;
  const clickRate = sentCount > 0 ? Math.round((clickCount / sentCount) * 100) : 0;

  return {
    deliveryRate,
    readRate,
    clickRate,
    engagementRate: clickRate,
  };
}

export function calculateLeadScore(lead: LeadScoringInput) {
  const sourceScores: Record<string, number> = {
    whatsapp: 30,
    instagram_dm: 25,
    tiktok_comment: 20,
    youtube_comment: 15,
    campus_popup: 20,
    referral: 35,
    other: 10,
  };

  let score = sourceScores[lead.source ?? "other"] ?? 10;

  if (lead.initialMessage && lead.initialMessage.trim().length > 20) {
    score += 15;
  }

  const interestedCategories = Array.isArray(lead.interestedIn) ? lead.interestedIn : [];
  score += Math.min(interestedCategories.length * 10, 30);

  return Math.min(100, Math.round(score));
}

export function buildFollowUpDateForLead(date = new Date()) {
  const followUpDate = new Date(date);
  followUpDate.setDate(followUpDate.getDate() + 2);

  if (followUpDate.getDay() === 0) {
    followUpDate.setDate(followUpDate.getDate() + 1);
  } else if (followUpDate.getDay() === 6) {
    followUpDate.setDate(followUpDate.getDate() + 2);
  }

  return followUpDate.toISOString();
}

export function getMarketingHealthScore(input: MarketingHealthScoreInput) {
  const breakdown = {
    campaigns: (input.campaigns ?? []).filter((campaign) => campaign.status && ["active", "completed", "scheduled"].includes(campaign.status)).length,
    leads: (input.leads ?? []).filter((lead) => lead.status === "converted").length,
    broadcasts: (input.broadcasts ?? []).filter((broadcast) => ["sent", "scheduled"].includes(broadcast.status ?? "")).length,
    testimonials: (input.testimonials ?? []).filter((testimonial) => ["featured", "approved"].includes(testimonial.status ?? "")).length,
    referrals: (input.referrals ?? []).filter((referral) => referral.status === "completed").length,
    kpis: (input.kpis ?? []).filter((kpi) => typeof kpi.metricValue === "number" && typeof kpi.targetValue === "number" && kpi.metricValue >= kpi.targetValue).length,
  };

  const score = Math.min(100, 20 + breakdown.campaigns * 8 + breakdown.leads * 10 + breakdown.broadcasts * 6 + breakdown.testimonials * 5 + breakdown.referrals * 7 + breakdown.kpis * 4);

  return {
    score,
    breakdown,
    label: score >= 80 ? "Healthy" : score >= 60 ? "Growing" : "Needs attention",
  };
}
