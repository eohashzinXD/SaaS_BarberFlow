import {
  verifyAbacatePayWebhookSignature
} from "@/lib/abacate-pay";
import { env } from "@/lib/env";
import {
  markPendingSignupCheckoutPaid,
  provisionPaidSignupFromCheckout,
  provisionPaidSignupFromSubscription,
  syncTenantFromSubscriptionEvent
} from "@/server/billing";

type AbacatePayWebhookEvent =
  | {
      event?: "checkout.completed";
      type?: "checkout.completed";
      data: {
        checkout: {
          id: string;
          externalId: string | null;
          customerId?: string | null;
          status?: string | null;
        };
        customer?: {
          id: string;
          email?: string | null;
          name?: string | null;
        } | null;
      };
    }
  | {
      event?:
        | "subscription.completed"
        | "subscription.renewed"
        | "subscription.cancelled";
      type?:
        | "subscription.completed"
        | "subscription.renewed"
        | "subscription.cancelled";
      data: {
        checkout?: {
          id: string;
          externalId: string | null;
        } | null;
        customer?: {
          id: string;
          email?: string | null;
          name?: string | null;
        } | null;
        payment?: {
          externalId: string | null;
        } | null;
        subscription: {
          id: string;
          status: string | null;
        };
      };
    };

function getWebhookSignature(request: Request) {
  return (
    request.headers.get("x-webhook-signature") ??
    request.headers.get("x-abacate-signature") ??
    request.headers.get("x-hmac-signature")
  );
}

function hasValidWebhookSecret(request: Request) {
  const url = new URL(request.url);
  const requestSecret =
    url.searchParams.get("webhookSecret") ??
    url.searchParams.get("secret") ??
    url.searchParams.get("token");

  return Boolean(env.abacatePayWebhookSecret) && requestSecret === env.abacatePayWebhookSecret;
}

export async function POST(request: Request) {
  if (!hasValidWebhookSecret(request)) {
    console.warn("[abacatepay:webhook] invalid webhook secret");
    return new Response("Invalid webhook secret.", { status: 401 });
  }

  const signature = getWebhookSignature(request);

  if (!signature) {
    console.warn("[abacatepay:webhook] missing signature header");
    return new Response("Missing AbacatePay signature.", { status: 400 });
  }

  const rawBody = await request.text();

  try {
    if (!verifyAbacatePayWebhookSignature(rawBody, signature)) {
      console.warn("[abacatepay:webhook] signature verification failed");
      return new Response("Webhook signature verification failed.", { status: 400 });
    }
  } catch (error) {
    console.error("[abacatepay:webhook] validation error", error);
    return new Response(
      error instanceof Error ? error.message : "Webhook validation failed.",
      { status: 500 }
    );
  }

  const event = JSON.parse(rawBody) as AbacatePayWebhookEvent;

  const eventName = event.event ?? event.type;

  console.info("[abacatepay:webhook] received event", {
    eventName,
    checkoutId: "checkout" in event.data && event.data.checkout ? event.data.checkout.id : null,
    checkoutExternalId:
      "checkout" in event.data && event.data.checkout ? event.data.checkout.externalId : null,
    paymentExternalId: "payment" in event.data && event.data.payment ? event.data.payment.externalId : null,
    subscriptionId: "subscription" in event.data ? event.data.subscription.id : null
  });

  try {
    switch (eventName) {
      case "checkout.completed":
        await markPendingSignupCheckoutPaid(
          event.data as Parameters<typeof markPendingSignupCheckoutPaid>[0]
        );
        await provisionPaidSignupFromCheckout(
          event.data as Parameters<typeof provisionPaidSignupFromCheckout>[0]
        );
        break;
      case "subscription.completed":
        await provisionPaidSignupFromSubscription(
          event.data as Parameters<typeof provisionPaidSignupFromSubscription>[0]
        );
        await syncTenantFromSubscriptionEvent(
          event.data as Parameters<typeof syncTenantFromSubscriptionEvent>[0]
        );
        break;
      case "subscription.renewed":
      case "subscription.cancelled":
        await syncTenantFromSubscriptionEvent(
          event.data as Parameters<typeof syncTenantFromSubscriptionEvent>[0]
        );
        break;
      default:
        console.info("[abacatepay:webhook] ignored event", { eventName });
        break;
    }
  } catch (error) {
    console.error("[abacatepay:webhook] processing error", { eventName, error });
    return new Response("Webhook processing failed.", { status: 500 });
  }

  return Response.json({ received: true });
}
