"""Extraction interfaces that keep the pipeline swappable."""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Sequence


@dataclass
class DocumentExtractionContext:
    """Hints that downstream engines can use."""

    raw_filename: str
    customer_profile_id: str
    hints: Dict[str, str] = field(default_factory=dict)


@dataclass
class ExtractionArtifacts:
    """Normalized payload emitted by any extraction engine."""

    text: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)
    errors: List[str] = field(default_factory=list)


class TextExtractionEngine(ABC):
    """Abstract text/vision extractor."""

    name: str = "base"
    priority: int = 0

    @abstractmethod
    async def extract(
        self, source: Path, context: DocumentExtractionContext
    ) -> ExtractionArtifacts:
        """Extract textual artifacts from the provided document."""


class ChainedTextExtractor(TextExtractionEngine):
    """Tries multiple engines in priority order."""

    def __init__(self, engines: Sequence[TextExtractionEngine]) -> None:
        self.engines = sorted(engines, key=lambda engine: engine.priority)
        self.name = "+".join(engine.name for engine in self.engines)

    async def extract(
        self, source: Path, context: DocumentExtractionContext
    ) -> ExtractionArtifacts:
        errors: List[str] = []
        for engine in self.engines:
            try:
                result = await engine.extract(source, context)
            except Exception as exc:  # noqa: BLE001 - log upstream
                errors.append(f"{engine.name}: {exc}")
                continue
            if result.text.strip():
                result.metadata.setdefault("engine_name", engine.name)
                if errors:
                    result.errors.extend(errors)
                return result
            errors.append(f"{engine.name}: empty output")
        return ExtractionArtifacts(text="", metadata={"engine_name": self.name}, errors=errors)
