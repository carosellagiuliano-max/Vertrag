"""Pydantic models representing the structured order output."""
from __future__ import annotations

from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field


class OrderLine(BaseModel):
    line_no: Optional[int] = None
    customer_item_no: Optional[str] = None
    internal_item_no: Optional[str] = None
    description: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    unit_price: Optional[Decimal] = None
    discount_percent: Optional[float] = None
    line_total: Optional[Decimal] = None


class OrderHeader(BaseModel):
    customer_name: Optional[str] = None
    customer_number: Optional[str] = None
    customer_po_number: Optional[str] = None
    order_date: Optional[str] = None
    currency: Optional[str] = None
    delivery_address: Optional[str] = None
    billing_address: Optional[str] = None
    payment_terms: Optional[str] = None
    raw_filename: Optional[str] = None


class OrderTotals(BaseModel):
    subtotal: Optional[Decimal] = None
    tax_amount: Optional[Decimal] = None
    grand_total: Optional[Decimal] = None


class OrderExtractionResult(BaseModel):
    customer_profile_id: str
    header: OrderHeader
    lines: List[OrderLine] = Field(default_factory=list)
    totals: Optional[OrderTotals] = None
    confidence: Optional[float] = None

    class Config:
        json_encoders = {Decimal: lambda v: str(v) if v is not None else None}
