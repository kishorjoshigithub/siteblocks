import { Request, Response } from "express";
import Stripe from "stripe";
import prisma from "../lib/prisma.js";

export const stripeWebhook = async (request: Request, response: Response) => {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

  if (endpointSecret) {
    let event;
    const signature = request.headers["stripe-signature"] as string;
    try {
      event = Stripe.webhooks.constructEvent(
        request.body,
        signature,
        endpointSecret
      );
    } catch (err: any) {
      console.log(`⚠️ Webhook signature verification failed.`, err.message);
      return response.sendStatus(400);
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        const sessionList = await stripe.checkout.sessions.list({
          payment_intent: paymentIntent.id,
        });

        const session = sessionList.data[0];
        const { transactionId, appId } = session.metadata as {
          transactionId: string;
          appId: string;
        };
        if (appId === "siteblocks" && transactionId) {
          const transaction = await prisma.transaction.update({
            where: { id: transactionId },
            data: {
              isPaid: true,
            },
          });

          // Add credits to user
          await prisma.user.update({
            where: { id: transaction.userId },
            data: {
              credits: { increment: transaction.credits },
            },
          });
        }
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    response.json({ received: true });
  }
};
