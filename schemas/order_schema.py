"""Canonical NAV order schema definitions."""
ORDER_SCHEMA_LITERAL = """class OrderLine(BaseModel):
    line_no: int | None
    customer_item_no: str | None
    internal_item_no: str | None = None  # never invent!
    description: str | None
    quantity: float | None
    unit: str | None
    unit_price: Decimal | None
    discount_percent: float | None
    line_total: Decimal | None

class OrderHeader(BaseModel):
    customer_name: str | None
    customer_number: str | None
    customer_po_number: str | None
    order_date: str | None  # ISO-8601
    currency: str | None
    delivery_address: str | None
    billing_address: str | None
    payment_terms: str | None
    raw_filename: str | None

class OrderTotals(BaseModel):
    subtotal: Decimal | None
    tax_amount: Decimal | None
    grand_total: Decimal | None

class OrderExtractionResult(BaseModel):
    customer_profile_id: str
    header: OrderHeader
    lines: list[OrderLine]
    totals: OrderTotals | None = None
    confidence: float | None = None"""

ORDER_JSON_SCHEMA = {
    "name": "order_extraction_schema",
    "schema": {
        "type": "object",
        "properties": {
            "customer_profile_id": {"type": "string"},
            "header": {
                "type": "object",
                "properties": {
                    "customer_name": {"type": ["string", "null"]},
                    "customer_number": {"type": ["string", "null"]},
                    "customer_po_number": {"type": ["string", "null"]},
                    "order_date": {"type": ["string", "null"]},
                    "currency": {"type": ["string", "null"]},
                    "delivery_address": {"type": ["string", "null"]},
                    "billing_address": {"type": ["string", "null"]},
                    "payment_terms": {"type": ["string", "null"]},
                    "raw_filename": {"type": ["string", "null"]},
                },
                "required": [
                    "customer_name",
                    "customer_number",
                    "customer_po_number",
                    "order_date",
                    "currency",
                    "delivery_address",
                    "billing_address",
                    "payment_terms",
                    "raw_filename",
                ],
                "additionalProperties": False,
            },
            "lines": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "line_no": {"type": ["integer", "null"]},
                        "customer_item_no": {"type": ["string", "null"]},
                        "internal_item_no": {"type": ["string", "null"]},
                        "description": {"type": ["string", "null"]},
                        "quantity": {"type": ["number", "null"]},
                        "unit": {"type": ["string", "null"]},
                        "unit_price": {"type": ["number", "string", "null"]},
                        "discount_percent": {"type": ["number", "null"]},
                        "line_total": {"type": ["number", "string", "null"]},
                    },
                    "required": [
                        "line_no",
                        "customer_item_no",
                        "internal_item_no",
                        "description",
                        "quantity",
                        "unit",
                        "unit_price",
                        "discount_percent",
                        "line_total",
                    ],
                    "additionalProperties": False,
                },
            },
            "totals": {
                "type": ["object", "null"],
                "properties": {
                    "subtotal": {"type": ["number", "string", "null"]},
                    "tax_amount": {"type": ["number", "string", "null"]},
                    "grand_total": {"type": ["number", "string", "null"]},
                },
                "required": ["subtotal", "tax_amount", "grand_total"],
                "additionalProperties": False,
            },
            "confidence": {"type": ["number", "null"]},
        },
        "required": ["customer_profile_id", "header", "lines", "totals", "confidence"],
        "additionalProperties": False,
    },
    "strict": True,
}
