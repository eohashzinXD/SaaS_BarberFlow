import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "@/lib/env";

type AbacatePayApiResponse<T> = {
  data: T;
  error: string | { message?: string } | null;
  success: boolean;
};

type AbacatePayCustomerResponse = {
  id: string;
  email: string;
  name?: string | null;
};

export type AbacatePayCheckoutResponse = {
  id: string;
  externalId: string | null;
  url: string;
  amount: number;
  paidAmount: number | null;
  status: string;
  customerId: string | null;
  receiptUrl: string | null;
  returnUrl: string | null;
  completionUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

type CreateAbacatePayCustomerInput = {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
};

type CreateAbacatePaySubscriptionCheckoutInput = {
  itemId: string;
  customerId?: string;
  returnUrl?: string;
  completionUrl?: string;
  externalId?: string;
  metadata?: Record<string, string>;
};

function getAbacatePayApiKey() {
  if (!env.abacatePayApiKey) {
    throw new Error("ABACATEPAY_API_KEY is not configured.");
  }

  return env.abacatePayApiKey;
}

async function abacatePayRequest<T>(path: string, body: unknown) {
  const response = await fetch(`${env.abacatePayApiUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getAbacatePayApiKey()}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body),
    cache: "no-store"
  });

  const payload = (await response.json()) as AbacatePayApiResponse<T>;

  if (!response.ok || !payload.success) {
    const message =
      typeof payload.error === "string"
        ? payload.error
        : payload.error?.message ?? `AbacatePay request failed with status ${response.status}.`;

    throw new Error(message);
  }

  return payload.data;
}

function isCustomerPayloadShapeError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return message.includes("expected property 'email'") || message.includes('expected property "email"');
}

export async function createAbacatePayCustomer(input: CreateAbacatePayCustomerInput) {
  const rootPayload = {
    email: input.email,
    name: input.name,
    metadata: input.metadata
  };

  try {
    return await abacatePayRequest<AbacatePayCustomerResponse>("/customers/create", rootPayload);
  } catch (error) {
    if (!isCustomerPayloadShapeError(error)) {
      throw error;
    }

    return abacatePayRequest<AbacatePayCustomerResponse>("/customers/create", {
      data: {
        email: input.email,
        name: input.name
      },
      metadata: input.metadata
    });
  }
}

export async function createAbacatePaySubscriptionCheckout(
  input: CreateAbacatePaySubscriptionCheckoutInput
) {
  return abacatePayRequest<AbacatePayCheckoutResponse>("/subscriptions/create", {
    items: [
      {
        id: input.itemId,
        quantity: 1
      }
    ],
    customerId: input.customerId,
    methods: ["CARD"],
    returnUrl: input.returnUrl,
    completionUrl: input.completionUrl,
    externalId: input.externalId,
    metadata: input.metadata
  });
}

export function verifyAbacatePayWebhookSignature(rawBody: string, signatureFromHeader: string) {
  if (!env.abacatePayWebhookPublicKey) {
    throw new Error("ABACATEPAY_WEBHOOK_PUBLIC_KEY is not configured.");
  }

  const expectedSignature = createHmac("sha256", env.abacatePayWebhookPublicKey)
    .update(Buffer.from(rawBody, "utf8"))
    .digest("base64");

  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(signatureFromHeader);

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}
