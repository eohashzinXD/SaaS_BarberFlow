import {
  verifyAbacatePayWebhookSignature
} from "@/lib/abacate-pay";
import { env } from "@/lib/env";
import {
  markPendingSignupCheckoutPaid,
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
    return new Response("Invalid webhook secret.", { status: 401 });
  }

  const signature = getWebhookSignature(request);

  if (!signature) {
    return new Response("Missing AbacatePay signature.", { status: 400 });
  }

  const rawBody = await request.text();

  try {
    if (!verifyAbacatePayWebhookSignature(rawBody, signature)) {
      return new Response("Webhook signature verification failed.", { status: 400 });
    }
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Webhook validation failed.",
      { status: 500 }
    );
  }

  const event = JSON.parse(rawBody) as AbacatePayWebhookEvent;

  const eventName = event.event ?? event.type;

  switch (eventName) {
    case "checkout.completed":
      await markPendingSignupCheckoutPaid(
        event.data as Parameters<typeof markPendingSignupCheckoutPaid>[0]
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
      break;
  }

  return Response.json({ received: true });
}
