import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { getTestimonials, submitTestimonialWithSentiment, getTestimonialsBySentiment, approveTestimonial, repostTestimonialToSocial, getCustomers, getProducts } from "@/lib/actions/marketing";
import { TestimonialSentimentChart } from "@/components/marketing/testimonial-sentiment-chart";

async function createTestimonialAction(formData: FormData) {
  "use server";

  const selectedCustomerId = formData.get("customerIdSelect")?.toString();
  const manualCustomerId = formData.get("customerId")?.toString();
  const selectedProductId = formData.get("productIdSelect")?.toString();
  const manualProductId = formData.get("productId")?.toString();

  await submitTestimonialWithSentiment(
    selectedCustomerId?.trim() || manualCustomerId?.trim() || "",
    selectedProductId?.trim() || manualProductId?.trim() || undefined,
    Number(formData.get("rating") || 5),
    formData.get("textReview")?.toString() || "",
    formData.get("platformShared")?.toString() || "in_person",
    formData.get("imageUrl")?.toString() || undefined,
  );
}

async function approveTestimonialAction(formData: FormData) {
  "use server";

  const testimonialId = formData.get("testimonialId")?.toString();
  if (!testimonialId) return;

  await approveTestimonial(testimonialId, false);
}

async function repostTestimonialAction(formData: FormData) {
  "use server";

  const testimonialId = formData.get("testimonialId")?.toString();
  const platform = formData.get("platform")?.toString() || "instagram";
  if (!testimonialId) return;

  await repostTestimonialToSocial(testimonialId, platform);
}

const COLORS = {
  positive: "#10b981",
  neutral: "#6b7280",
  negative: "#ef4444",
};

export default async function TestimonialsPage() {
  const [allResult, pendingResult, customersResult, productsResult] = await Promise.all([
    getTestimonials(),
    getTestimonials("pending_approval"),
    getCustomers(),
    getProducts(),
  ]);

  const testimonials = allResult.success ? allResult.data : [];
  const pendingTestimonials = pendingResult.success ? pendingResult.data : [];
  const customerOptions = customersResult.success ? customersResult.data : [];
  const productOptions = productsResult.success ? productsResult.data : [];
  const sentimentResult = await getTestimonialsBySentiment();
  const sentimentData = sentimentResult.success ? sentimentResult.data : null;

  const chartData = sentimentData
    ? [
        { name: "Positive", value: sentimentData.positive },
        { name: "Neutral", value: sentimentData.neutral },
        { name: "Negative", value: sentimentData.negative },
      ]
    : [];

  const getSentimentBadgeColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-100 text-green-800";
      case "negative":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <MarketingPageShell title="Testimonials & Reviews" description="Capture customer feedback and analyze sentiment.">
      {/* Sentiment Analytics */}
      {sentimentData && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{sentimentData.total}</div>
              <p className="text-xs text-muted-foreground">submitted and analyzed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Positive</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{sentimentData.positive}</div>
              <p className="text-xs text-muted-foreground">
                {sentimentData.total > 0 ? ((sentimentData.positive / sentimentData.total) * 100).toFixed(0) : 0}% of reviews
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Neutral</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-600">{sentimentData.neutral}</div>
              <p className="text-xs text-muted-foreground">
                {sentimentData.total > 0 ? ((sentimentData.neutral / sentimentData.total) * 100).toFixed(0) : 0}% of reviews
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Negative</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{sentimentData.negative}</div>
              <p className="text-xs text-muted-foreground">
                {sentimentData.total > 0 ? ((sentimentData.negative / sentimentData.total) * 100).toFixed(0) : 0}% of reviews
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sentiment Distribution Chart */}
      {chartData.length > 0 && <TestimonialSentimentChart chartData={chartData} />}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Submit Review Form */}
        <Card>
          <CardHeader>
            <CardTitle>Submit a review</CardTitle>
            <CardDescription>Collect testimonials & auto-analyze sentiment</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createTestimonialAction} className="grid gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="customerIdSelect">
                  Customer
                </label>
                <select
                  id="customerIdSelect"
                  name="customerIdSelect"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                >
                  <option value="">Select existing customer</option>
                  {customerOptions.map((customer: any) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.id})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">Or enter a customer ID manually</p>
                <Input id="customerId" name="customerId" placeholder="customer-id" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="productIdSelect">
                  Product
                </label>
                <select
                  id="productIdSelect"
                  name="productIdSelect"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                >
                  <option value="">Select existing product</option>
                  {productOptions.map((product: any) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">Optional: or enter a product ID manually</p>
                <Input id="productId" name="productId" placeholder="product-id" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="rating">
                  Rating
                </label>
                <Input id="rating" name="rating" type="number" min="1" max="5" defaultValue="5" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="platformShared">
                  Platform
                </label>
                <select
                  id="platformShared"
                  name="platformShared"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                  defaultValue="in_person"
                >
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="in_person">In person</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="imageUrl">
                  Image URL
                </label>
                <Input id="imageUrl" name="imageUrl" placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="textReview">
                  Review text
                </label>
                <Textarea id="textReview" name="textReview" placeholder="Share your honest feedback..." required />
              </div>
              <Button type="submit" className="w-full">
                Submit & Analyze
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Sentiment Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Analysis</CardTitle>
            <CardDescription>Auto-detect positive, neutral, and negative feedback</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-green-100 text-green-800">Positive</Badge>
                  <span className="text-xs font-medium">Score: +1 to +5</span>
                </div>
                <p className="text-sm text-muted-foreground">Enthusiastic, satisfied, recommends</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-gray-100 text-gray-800">Neutral</Badge>
                  <span className="text-xs font-medium">Score: 0</span>
                </div>
                <p className="text-sm text-muted-foreground">Factual, balanced, no strong opinion</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-red-100 text-red-800">Negative</Badge>
                  <span className="text-xs font-medium">Score: -1 to -5</span>
                </div>
                <p className="text-sm text-muted-foreground">Critical, dissatisfied, needs improvement</p>
              </div>
            </div>

            <div className="pt-4 border-t space-y-2 text-xs text-muted-foreground">
              <p>💡 Sentiment analysis helps you:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Flag negative reviews for quick response</li>
                <li>Feature positive testimonials on social</li>
                <li>Track customer satisfaction trends</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending UGC Gallery */}
      {pendingTestimonials.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending UGC Approval</CardTitle>
            <CardDescription>Review submissions before reposting to social media.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {pendingTestimonials.map((testimonial: any) => (
                <Card key={testimonial.id} className="border-yellow-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-sm">{testimonial.rating}/5 ⭐</CardTitle>
                        <CardDescription>{testimonial.platformShared}</CardDescription>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {testimonial.imageUrl ? (
                      <img src={testimonial.imageUrl} alt="UGC preview" className="w-full rounded-md object-cover h-48" />
                    ) : null}
                    <p className="text-sm text-muted-foreground">{testimonial.textReview}</p>
                    <div className="flex flex-wrap gap-2">
                      <form action={approveTestimonialAction} className="inline">
                        <input type="hidden" name="testimonialId" value={testimonial.id} />
                        <Button type="submit" className="px-3 py-1">
                          Approve
                        </Button>
                      </form>
                      <form action={repostTestimonialAction} className="inline">
                        <input type="hidden" name="testimonialId" value={testimonial.id} />
                        <input type="hidden" name="platform" value="instagram" />
                        <Button type="submit" className="px-3 py-1">
                          Repost Instagram
                        </Button>
                      </form>
                      <form action={repostTestimonialAction} className="inline">
                        <input type="hidden" name="testimonialId" value={testimonial.id} />
                        <input type="hidden" name="platform" value="tiktok" />
                        <Button type="submit" className="px-3 py-1">
                          Repost TikTok
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Testimonials List Grouped by Sentiment */}
      {sentimentData?.testimonials && (
        <div className="space-y-6">
          {Object.entries(sentimentData.testimonials).map(([sentiment, items]: [string, any]) => {
            if (!items.length) return null;

            return (
              <div key={sentiment}>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Badge className={getSentimentBadgeColor(sentiment)}>
                    {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">({items.length})</span>
                </h3>

                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((testimonial: any) => (
                    <Card key={testimonial.id} className={`${sentiment === "negative" ? "border-red-200" : sentiment === "positive" ? "border-green-200" : ""}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-sm">{testimonial.rating}/5 ⭐</CardTitle>
                            <CardDescription>{testimonial.platformShared}</CardDescription>
                          </div>
                          <Badge className={getSentimentBadgeColor(sentiment)} variant="secondary">
                            {testimonial.sentimentScore > 0 ? "+" : ""}{testimonial.sentimentScore}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <p className="text-muted-foreground italic line-clamp-3">{testimonial.textReview}</p>
                        <p className="text-xs text-muted-foreground">Status: {testimonial.status}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fallback for regular testimonials list */}
      {(!sentimentData || !sentimentData.testimonials) && testimonials.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial: any) => (
            <Card key={testimonial.id}>
              <CardHeader>
                <CardTitle className="text-sm">{testimonial.rating}/5 ⭐</CardTitle>
                <CardDescription>{testimonial.status}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>{testimonial.textReview || "Review pending"}</p>
                <p>Platform: {testimonial.platformShared}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </MarketingPageShell>
  );
}
