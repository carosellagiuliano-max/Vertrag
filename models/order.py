"""Pydantic models representing the structured order output."""
from __future__ import annotations

from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field


class OrderLine(BaseModel):
    line_no: Optional[int]
    customer_item_no: Optional[str]
    internal_item_no: Optional[str] = None
    description: Optional[str]
    quantity: Optional[float]
    unit: Optional[str]
    unit_price: Optional[Decimal]
    discount_percent: Optional[float]
    line_total: Optional[Decimal]


class OrderHeader(BaseModel):
    customer_name: Optional[str]
    customer_number: Optional[str]
    customer_po_number: Optional[str]
    order_date: Optional[str]
    currency: Optional[str]
    delivery_address: Optional[str]
    billing_address: Optional[str]
    payment_terms: Optional[str]
    raw_filename: Optional[str]


class OrderTotals(BaseModel):
    subtotal: Optional[Decimal]
    tax_amount: Optional[Decimal]
    grand_total: Optional[Decimal]


class OrderExtractionResult(BaseModel):
    customer_profile_id: str
    header: OrderHeader
    lines: List[OrderLine] = Field(default_factory=list)
    totals: Optional[OrderTotals] = None
    confidence: Optional[float] = None

    class Config:
        json_encoders = {Decimal: lambda v: str(v) if v is not None else None}
