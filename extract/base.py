"""Extraction interfaces that keep the pipeline swappable."""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Sequence, Tuple


@dataclass
class DocumentExtractionContext:
    """Hints that downstream engines can use."""

    raw_filename: str
    customer_profile_id: str
    hints: Dict[str, Any] = field(default_factory=dict)
    force_ocr: bool = False


@dataclass
class PageExtraction:
    """Per-page output emitted by an extraction engine."""

    page_number: int
    text: str
    layout: List[Dict[str, Any]] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class TextExtractionResult:
    """Normalized payload emitted by any extraction engine."""

    combined_text: str = ""
    pages: List[PageExtraction] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    errors: List[str] = field(default_factory=list)

    @property
    def text(self) -> str:
        return self.combined_text


# Backwards compatibility alias
ExtractionArtifacts = TextExtractionResult


class TextExtractionEngine(ABC):
    """Abstract text/vision extractor."""

    name: str = "base"
    priority: int = 0
    capabilities: Tuple[str, ...] = ("text",)

    @abstractmethod
    async def extract(
        self, source: Path, context: DocumentExtractionContext
    ) -> TextExtractionResult:
        """Extract textual artifacts from the provided document."""


class ChainedTextExtractor(TextExtractionEngine):
    """Tries multiple engines in priority order with quality heuristics."""

    def __init__(
        self,
        engines: Sequence[TextExtractionEngine],
        *,
        min_characters: int = 200,
        min_alpha_ratio: float = 0.05,
    ) -> None:
        self.engines = sorted(engines, key=lambda engine: engine.priority)
        self.name = "+".join(engine.name for engine in self.engines)
        self.capabilities = tuple({cap for engine in self.engines for cap in engine.capabilities})
        self.min_characters = min_characters
        self.min_alpha_ratio = min_alpha_ratio

    async def extract(
        self, source: Path, context: DocumentExtractionContext
    ) -> TextExtractionResult:
        errors: List[str] = []
        best_result: TextExtractionResult | None = None
        hint_value = context.hints.get("force_ocr")
        if isinstance(hint_value, str):
            hint_force = hint_value.lower() in {"1", "true", "yes"}
        else:
            hint_force = bool(hint_value)
        force_ocr = context.force_ocr or hint_force
        for engine in self.engines:
            try:
                result = await engine.extract(source, context)
            except Exception as exc:  # noqa: BLE001 - log upstream
                errors.append(f"{engine.name}: {exc}")
                continue
            result.metadata.setdefault("engine_name", engine.name)
            quality_ok, reason = self._is_sufficient(result, force_ocr, engine)
            if not best_result or len(result.text) > len(best_result.text):
                best_result = result
            if quality_ok:
                if errors:
                    result.errors.extend(errors)
                result.metadata.setdefault("fallback_chain", self.name)
                return result
            errors.append(f"{engine.name}: {reason}")
        if best_result:
            best_result.errors.extend(errors)
            best_result.metadata.setdefault("fallback_chain", self.name)
            return best_result
        return TextExtractionResult(
            combined_text="",
            metadata={"engine_name": self.name, "fallback_chain": self.name},
            errors=errors,
        )

    def _is_sufficient(
        self,
        result: TextExtractionResult,
        force_ocr: bool,
        engine: TextExtractionEngine,
    ) -> tuple[bool, str]:
        text = result.text.strip()
        if force_ocr and "ocr" not in engine.capabilities:
            return False, "force_ocr requested"
        if not text:
            return False, "empty output"
        if len(text) < self.min_characters:
            return False, f"insufficient text ({len(text)} chars)"
        alpha_chars = sum(ch.isalnum() for ch in text)
        ratio = alpha_chars / max(len(text), 1)
        if ratio < self.min_alpha_ratio:
            return False, f"low signal ratio ({ratio:.2f})"
        return True, ""
