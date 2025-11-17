import { env } from "@/lib/config/env";

type EmailPayload = {
  to: string;
  subject: string;
  body: string;
};

export async function sendBookingConfirmation(payload: EmailPayload) {
  console.info("[email] booking confirmation", payload);
  return {
    delivered: false,
    provider: "console",
    note: "No SMTP/Resend configured; logged for dev",
    preview: `${env.baseUrl}/booking`,
  };
}

export async function sendCancellationEmail(payload: EmailPayload) {
  console.info("[email] cancellation", payload);
  return {
    delivered: false,
    provider: "console",
    note: "No SMTP/Resend configured; logged for dev",
  };
}
