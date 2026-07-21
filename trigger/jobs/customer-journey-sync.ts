import { db } from "@/lib/db";
import { customerJourney, orders } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Daily job to auto-advance customers through journey stages based on:
 * - Touchpoint count
 * - Purchase history
 * - Repeat purchase indicators
 */
export async function customerJourneySyncJob() {
  const now = new Date().toISOString();

  // Get all journeys
  const allJourneys = await db.query.customerJourney.findMany();

  for (const journey of allJourneys) {
    let newStage = journey.stage;
    const touchpoints = typeof journey.touchpoints === "string" ? JSON.parse(journey.touchpoints || "[]") : [];

    switch (journey.stage) {
      case "awareness":
        // Auto-advance to interest after any interaction recorded
        if (touchpoints.length > 0) {
          newStage = "interest";
        }
        break;

      case "interest":
        // Auto-advance to desire after 3+ touchpoints
        if (touchpoints.length >= 3) {
          newStage = "desire";
        }
        break;

      case "desire":
        // Auto-advance to action after purchase (check orders table)
        if (journey.customerId) {
          const orderCount = await db.query.orders.findMany({
            where: eq(orders.customerId, journey.customerId),
          });

          if (orderCount.length > 0) {
            newStage = "action";
          }
        }
        break;

      case "action":
        // Auto-advance to loyalty after repeat purchase (2+ orders)
        if (journey.customerId) {
          const orderCount = await db.query.orders.findMany({
            where: eq(orders.customerId, journey.customerId),
          });

          if (orderCount.length >= 2) {
            newStage = "loyalty";
          }
        }
        break;

      case "loyalty":
        // Stay in loyalty - no auto-advancement
        break;
    }

    // If stage changed, update the journey
    if (newStage !== journey.stage) {
      await db
        .update(customerJourney)
        .set({
          stage: newStage as any,
          stageEnteredAt: now,
          updatedAt: now,
        })
        .where(eq(customerJourney.id, journey.id));

      console.log(
        `Advanced customer ${journey.customerId} from ${journey.stage} to ${newStage}`
      );
    }
  }

  console.log("Customer journey sync completed");
}
