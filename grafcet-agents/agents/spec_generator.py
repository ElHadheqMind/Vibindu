"""
Multimodal spec generator for converting PDF documentation into requirements.
Uses Gemini's native PDF understanding capabilities.
"""

import os
import json
import aiohttp
from typing import Optional
from dataclasses import dataclass

# Load environment variables EARLY (before importing genai)
from dotenv import load_dotenv
load_dotenv()

# Gemini client setup - deferred initialization to allow for late env loading
genai_client = None
_genai_module = None

def _get_genai_client():
    """Lazy initialization of Gemini client."""
    global genai_client, _genai_module
    if genai_client is not None:
        return genai_client

    try:
        from google import genai as genai_mod
        _genai_module = genai_mod
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            genai_client = genai_mod.Client(api_key=api_key)
            print(f"[SpecGenerator] ✅ Gemini client initialized")
        else:
            print("[SpecGenerator] ⚠️ GEMINI_API_KEY not set")
    except ImportError as e:
        print(f"[SpecGenerator] Warning: google-genai not available: {e}")

    return genai_client


@dataclass
class SpecResult:
    """Result of spec generation."""
    success: bool
    spec_content: str
    error: Optional[str] = None
    images_described: int = 0


SPEC_GENERATION_PROMPT = """You are an expert industrial automation specification analyst.

Analyze this PDF document and generate a comprehensive Markdown specification document.

## YOUR TASK
1. **Read the entire document** - Extract all text, tables, and structured data
2. **Describe ALL images/diagrams** - For each visual element:
   - Identify the type (P&ID, timing diagram, flowchart, wiring diagram, etc.)
   - Describe ALL visible components, connections, and labels
   - Extract any values, annotations, or specifications shown
   - Explain the relationships between elements
3. **Generate a well-structured Markdown document** with all extracted information

## OUTPUT FORMAT
Generate a Markdown document with this structure. Use emojis for visual appeal:

```markdown
# 📋 [Document Title]

## 📝 Executive Summary
[Brief overview of what this specification describes]

## ⚙️ Process Description
[Detailed description of the process/system]

## 📊 Diagrams and Figures

### Figure 1: [Diagram Title]
**Type:** [P&ID / Timing Diagram / Flowchart / etc.]
**Description:** [Detailed description of what the diagram shows]
- [Component 1]: [Description]
- [Component 2]: [Description]
- [Connections and relationships]

### Figure 2: [Diagram Title]
...

## 🔧 Equipment and Components
[List of all equipment, sensors, actuators mentioned]

## 📥 I/O Configuration

### Inputs (Sensors/Buttons)
| Name | Type | Description |
|------|------|-------------|
| S_EXAMPLE | Digital | Example sensor description |

### Outputs (Actuators/Motors)
| Name | Type | Description |
|------|------|-------------|
| M_EXAMPLE | PWM | Example motor description |

## 🔄 Sequence of Operations
[Step-by-step process flow]

## ⏱️ Timing Requirements
[Any timing constraints, delays, durations]

## 🛡️ Safety Requirements
[Emergency stops, interlocks, safety conditions]

## 📌 Notes
[Any additional information]
```

## ⚠️ CRITICAL MARKDOWN TABLE FORMATTING RULES

When generating tables, you MUST follow these rules EXACTLY:

1. **NO blank lines between table rows** - Every row must be on consecutive lines
2. **Header, separator, and data rows must be adjacent** - No empty lines anywhere in the table
3. **Use consistent pipe alignment**

✅ CORRECT table format:
```
| Name | Type | Description |
|------|------|-------------|
| Sensor1 | Digital | First sensor |
| Sensor2 | Analog | Second sensor |
```

❌ WRONG - DO NOT add blank lines:
```
| Name | Type | Description |

|------|------|-------------|

| Sensor1 | Digital | First sensor |
```

IMPORTANT:
- Be thorough - extract EVERY piece of information
- Image descriptions should be detailed enough to understand the diagram without seeing it
- Use proper Markdown formatting with emojis for section headers
- Include all technical specifications and values
- Tables must have NO blank lines between rows
"""


class SpecGenerator:
    """
    Generates spec.md from PDF using Gemini directly.
    
    This is independent of the ADK agent system.
    """
    
    def __init__(self, api_url: str = "http://localhost:3001/api/simulation/save-spec"):
        self.api_url = api_url
        self.model = "gemini-3-pro-preview"  # Gemini 3 for PDF analysis
    
    async def generate_spec_from_pdf(
        self,
        file_uri: str,
        mime_type: str = "application/pdf",
        project_path: Optional[str] = None,
        stream_callback=None
    ) -> SpecResult:
        """
        Generate spec.md content from an uploaded PDF with streaming support.

        Args:
            file_uri: Gemini file URI (from PDFHandler upload)
            mime_type: MIME type of the file
            project_path: Optional project path to save spec.md
            stream_callback: Optional async callback(text_chunk) for real-time streaming

        Returns:
            SpecResult with generated Markdown content
        """
        # Get the client lazily
        client = _get_genai_client()
        if not client:
            return SpecResult(
                success=False,
                spec_content="",
                error="Gemini client not available"
            )

        try:
            print(f"[SpecGenerator] 📄 Generating spec from: {file_uri}")

            # Build the content with PDF file reference
            contents = [
                {
                    "role": "user",
                    "parts": [
                        {"file_data": {"file_uri": file_uri, "mime_type": mime_type}},
                        {"text": SPEC_GENERATION_PROMPT}
                    ]
                }
            ]

            # Use streaming if callback provided
            if stream_callback:
                # Stream the response in real-time
                spec_content = ""
                response_stream = client.models.generate_content_stream(
                    model=self.model,
                    contents=contents
                )

                for chunk in response_stream:
                    if chunk.text:
                        spec_content += chunk.text
                        # Call the streaming callback with each chunk
                        await stream_callback(chunk.text)

                print(f"[SpecGenerator] ✅ Streamed spec ({len(spec_content)} chars)")
            else:
                # Non-streaming fallback
                response = client.models.generate_content(
                    model=self.model,
                    contents=contents
                )
                spec_content = response.text
                print(f"[SpecGenerator] ✅ Generated spec ({len(spec_content)} chars)")

            # Count described images (rough estimate based on "Figure" occurrences)
            images_count = spec_content.lower().count("### figure")

            # Save to project if path provided
            if project_path:
                await self._save_spec(project_path, spec_content)

            return SpecResult(
                success=True,
                spec_content=spec_content,
                images_described=images_count
            )

        except Exception as e:
            print(f"[SpecGenerator] ❌ Generation failed: {e}")
            return SpecResult(
                success=False,
                spec_content="",
                error=str(e)
            )

    async def _save_spec(self, project_path: str, spec_content: str) -> bool:
        """Save spec.md to the project directory via backend API."""
        try:
            headers = {"x-agent-secret": "antigravity-local-agent"}
            async with aiohttp.ClientSession(headers=headers) as session:
                payload = {
                    "projectPath": project_path,
                    "specContent": spec_content
                }
                timeout = aiohttp.ClientTimeout(total=10)
                async with session.post(self.api_url, json=payload, timeout=timeout) as response:
                    if response.status == 200:
                        data = await response.json()
                        print(f"[SpecGenerator] 💾 Saved spec.md to: {data.get('savedPath')}")
                        return True
                    else:
                        error = await response.text()
                        print(f"[SpecGenerator] ⚠️ Save failed: {error}")
                        return False
        except Exception as e:
            print(f"[SpecGenerator] ⚠️ Save error: {e}")
            return False


# Singleton instance
spec_generator = SpecGenerator()

