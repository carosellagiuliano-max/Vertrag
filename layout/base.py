"""Layout analysis primitives."""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List

from extract.base import DocumentExtractionContext, ExtractionArtifacts


@dataclass
class LayoutAnalysisResult:
    """Structured view of a document's layout."""

    blocks: List[Dict[str, Any]] = field(default_factory=list)
    engine_name: str = "none"

    def to_prompt_section(self) -> str:
        """Return a condensed string for prompt injection."""

        if not self.blocks:
            return ""
        preview = self.blocks[:5]
        return "Layout summary (first blocks only):\n" + "\n".join(
            f"- {block.get('type', 'unknown')}: {block.get('text', '')}" for block in preview
        )


class LayoutAnalyzer(ABC):
    """Abstract analyzer responsible for table/visual cues."""

    name: str = "none"

    @abstractmethod
    async def analyze(
        self,
        source: Path,
        artifacts: ExtractionArtifacts,
        context: DocumentExtractionContext,
    ) -> LayoutAnalysisResult:
        """Return a normalized layout representation."""


class NullLayoutAnalyzer(LayoutAnalyzer):
    """Default analyzer that simply reports nothing."""

    name = "null"

    async def analyze(
        self,
        source: Path,
        artifacts: ExtractionArtifacts,
        context: DocumentExtractionContext,
    ) -> LayoutAnalysisResult:
        return LayoutAnalysisResult(engine_name=self.name)
