export type SocialMetricsSummary = {
  instagram: { posted: number; scheduled: number; failed: number };
  tiktok: { posted: number; scheduled: number; failed: number };
  youtube: { posted: number; scheduled: number; failed: number };
  pendingUpdates: number;
};

export function buildSocialAnalyticsKpiRows(summary: SocialMetricsSummary, now: Date = new Date()) {
  const periodStartDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const periodEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

  return [
    {
      id: crypto.randomUUID(),
      metricName: "instagram_posts_published",
      metricValue: summary.instagram.posted,
      targetValue: 0,
      period: "monthly",
      periodStartDate,
      periodEndDate,
      platform: "instagram",
      dataSource: "api_pull",
      notes: "Synced from social media analytics",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: crypto.randomUUID(),
      metricName: "tiktok_posts_published",
      metricValue: summary.tiktok.posted,
      targetValue: 0,
      period: "monthly",
      periodStartDate,
      periodEndDate,
      platform: "tiktok",
      dataSource: "api_pull",
      notes: "Synced from social media analytics",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: crypto.randomUUID(),
      metricName: "youtube_posts_published",
      metricValue: summary.youtube.posted,
      targetValue: 0,
      period: "monthly",
      periodStartDate,
      periodEndDate,
      platform: "youtube",
      dataSource: "api_pull",
      notes: "Synced from social media analytics",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: crypto.randomUUID(),
      metricName: "social_pending_updates",
      metricValue: summary.pendingUpdates,
      targetValue: 0,
      period: "monthly",
      periodStartDate,
      periodEndDate,
      platform: "overall",
      dataSource: "api_pull",
      notes: "Synced from social media analytics",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];
}
