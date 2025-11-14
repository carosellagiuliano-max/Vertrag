"""Customer profile loading helpers."""
from __future__ import annotations

import json
import logging
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml
from pydantic import BaseModel, Field

LOGGER = logging.getLogger(__name__)

DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "customer_profiles.yaml"
DEFAULT_PROFILE_ID = "default"
DEFAULT_FORM_ID = "default_form"


class CustomerForm(BaseModel):
    """Metadata for a specific document layout used by a customer."""

    id: str
    description: Optional[str] = None
    label_aliases: Dict[str, List[str]] = Field(default_factory=dict)
    example_orders: List[Dict[str, Any]] = Field(default_factory=list)
    reasoning_notes: List[str] = Field(default_factory=list)
    schema_name: Optional[str] = None


class CustomerProfile(BaseModel):
    """Represents a customer-specific extraction profile."""

    id: str
    default_currency: Optional[str] = None
    label_aliases: Dict[str, List[str]] = Field(default_factory=dict)
    example_orders: List[Dict[str, Any]] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    forms: Dict[str, CustomerForm] = Field(default_factory=dict)

    @classmethod
    def load(cls, profile_id: Optional[str]) -> "CustomerProfile":
        """Return the requested profile via the default repository."""

        repo = CustomerProfileRepository()
        return repo.load(profile_id)

    def resolve_form(self, form_id: Optional[str]) -> CustomerForm | None:
        if form_id and form_id in self.forms:
            return self.forms[form_id]
        if DEFAULT_FORM_ID in self.forms:
            return self.forms[DEFAULT_FORM_ID]
        return None

    def to_prompt_metadata(self, form_id: Optional[str]) -> str:
        form = self.resolve_form(form_id)
        alias_map: Dict[str, List[str]] = {key: list(values) for key, values in self.label_aliases.items()}
        if form:
            for label, values in form.label_aliases.items():
                alias_map.setdefault(label, [])
                alias_map[label].extend(values)
        alias_text = ", ".join(
            f"{label}: {', '.join(sorted(set(values)))}" for label, values in alias_map.items() if values
        )
        if not alias_text:
            alias_text = "none"
        metadata_text = ", ".join(f"{key}={value}" for key, value in self.metadata.items()) or "no extra metadata"
        form_text = f"Active form: {form.id} ({form.description})" if form else "Active form: default"
        defaults = self.default_currency or "unspecified"
        notes = " ".join(form.reasoning_notes) if form else ""
        return (
            f"Profile {self.id} – default currency: {defaults}. {form_text}. Label aliases: {alias_text}. Metadata: {metadata_text}."
            f" {notes}"
        ).strip()

    def few_shot_examples(self, form_id: Optional[str]) -> str:
        base_examples = list(self.example_orders)
        form = self.resolve_form(form_id)
        if form:
            base_examples.extend(form.example_orders)
        if not base_examples:
            return ""
        formatted = [json.dumps(example, ensure_ascii=False) for example in base_examples]
        return "\n".join(formatted)


class CustomerProfileRepository:
    """Loads and caches customer profiles with form metadata."""

    def __init__(self, data_path: Optional[Path] = None) -> None:
        self.data_path = data_path or DATA_PATH

    def load(self, profile_id: Optional[str]) -> CustomerProfile:
        profile_key = profile_id or DEFAULT_PROFILE_ID
        data = _read_profiles(self.data_path)
        if profile_key not in data:
            LOGGER.warning("Profile '%s' not found. Falling back to default.", profile_key)
            profile_key = DEFAULT_PROFILE_ID
        payload = data.get(profile_key, {})
        payload = {**payload, "id": profile_key}
        return CustomerProfile(**payload)


@lru_cache(maxsize=4)
def _read_profiles(path: Path) -> Dict[str, Dict[str, Any]]:
    if not path.exists():
        LOGGER.warning("Customer profile file %s not found. Returning empty map.", path)
        return {}
    with path.open("r", encoding="utf-8") as handle:
        raw = yaml.safe_load(handle) or {}
    normalized: Dict[str, Dict[str, Any]] = {}
    for profile_id, payload in raw.items():
        forms_payload = payload.get("forms", {})
        normalized_forms = {}
        for form_id, form_payload in forms_payload.items():
            normalized_forms[form_id] = CustomerForm(id=form_id, **form_payload).model_dump()
        payload = {**payload, "forms": normalized_forms}
        normalized[profile_id] = payload
    return normalized
