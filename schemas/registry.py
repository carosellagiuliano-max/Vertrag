"""Registry for structured output schemas."""
from __future__ import annotations

from typing import Dict

from schemas.order_schema import ORDER_JSON_SCHEMA, ORDER_SCHEMA_LITERAL


class SchemaRegistry:
    """Holds multiple JSON schemas plus literal descriptions."""

    def __init__(self) -> None:
        self._schemas: Dict[str, Dict] = {"order_v1": ORDER_JSON_SCHEMA}
        self._literals: Dict[str, str] = {"order_v1": ORDER_SCHEMA_LITERAL}

    def register(self, name: str, json_schema: Dict, literal: str) -> None:
        self._schemas[name] = json_schema
        self._literals[name] = literal

    def get_json_schema(self, name: str) -> Dict:
        if name not in self._schemas:
            raise KeyError(f"Schema '{name}' not registered")
        return self._schemas[name]

    def get_literal(self, name: str) -> str:
        if name not in self._literals:
            raise KeyError(f"Schema literal '{name}' not registered")
        return self._literals[name]


schema_registry = SchemaRegistry()
