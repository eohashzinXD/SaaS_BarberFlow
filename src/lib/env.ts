const fallbackTimezone = "America/Sao_Paulo";

export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  timezone: process.env.APP_TIMEZONE ?? fallbackTimezone,
  abacatePayApiUrl: process.env.ABACATEPAY_API_URL ?? "https://api.abacatepay.com/v2",
  abacatePayApiKey: process.env.ABACATEPAY_API_KEY,
  abacatePayProductId: process.env.ABACATEPAY_PRODUCT_ID,
  abacatePayWebhookSecret: process.env.ABACATEPAY_WEBHOOK_SECRET,
  abacatePayWebhookPublicKey: process.env.ABACATEPAY_WEBHOOK_PUBLIC_KEY
};
