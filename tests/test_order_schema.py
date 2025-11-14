from decimal import Decimal

from models.order import OrderExtractionResult


def test_order_schema_validates_and_casts_decimal():
    payload = {
        "customer_profile_id": "demo",
        "header": {
            "customer_name": "Acme",
            "raw_filename": "order.pdf",
        },
        "lines": [
            {
                "line_no": 10,
                "customer_item_no": "ABC",
                "description": "Widgets",
                "quantity": 5,
                "unit": "EA",
                "unit_price": "12.50",
                "line_total": 62.5,
            }
        ],
        "totals": {
            "subtotal": "62.5",
            "tax_amount": None,
            "grand_total": 62.5,
        },
        "confidence": 0.9,
    }
    result = OrderExtractionResult.model_validate(payload)
    assert isinstance(result.lines[0].unit_price, Decimal)
    assert result.lines[0].unit_price == Decimal("12.50")
    assert result.totals.grand_total == Decimal("62.5")
