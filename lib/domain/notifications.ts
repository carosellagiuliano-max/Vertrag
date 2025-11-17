const allowedTemplates = ["booking_confirmation", "cancellation", "order_receipt"] as const;
export type TemplateKey = (typeof allowedTemplates)[number];

export function validateTemplate(key: string): key is TemplateKey {
  return (allowedTemplates as readonly string[]).includes(key);
}

export function prepareNotificationPayload(key: TemplateKey, variables: Record<string, string>) {
  const required = {
    booking_confirmation: ["customerName", "appointmentTime"],
    cancellation: ["customerName", "appointmentTime"],
    order_receipt: ["customerName", "orderNumber", "total"],
  } as const;

  const missing = required[key].filter((varKey) => !variables[varKey]);
  if (missing.length) {
    return { ok: false, missing } as const;
  }
  return { ok: true, payload: { template: key, variables } } as const;
}
