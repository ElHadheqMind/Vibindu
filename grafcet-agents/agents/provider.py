import os
import json
from typing import Optional, AsyncGenerator
import google.generativeai as genai

class GeminiProvider:
    """Provider for Gemini 3 Flash supporting streaming and thinking processes."""
    def __init__(self, model_name: str = "gemini-3-pro-preview"):
        # Get API key from environment
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("[GEMINI] Warning: GEMINI_API_KEY not set. Using dummy key for tool testing.")
            api_key = "DUMMY_KEY_FOR_TOOL_TESTING"
        
        genai.configure(api_key=api_key)
        self.model_name = model_name
        self.model = genai.GenerativeModel(model_name)
        print(f"[GEMINI] Initialized {model_name}")

    async def generate_stream(
        self, 
        prompt: str, 
        system_prompt: str = "",
        on_thinking: callable = None,
        on_tool: callable = None
    ) -> AsyncGenerator[str, None]:
        """
        Streams text chunks from Gemini with thinking and tool usage callbacks.
        
        Args:
            prompt: User prompt
            system_prompt: System instructions
            on_thinking: Callback for thinking/reasoning tokens
            on_tool: Callback when tool is used
        """
        print(f"[GEMINI] Streaming response for: {prompt[:50]}...")
        
        try:
            # Combine system prompt and user prompt
            full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
            
            # Stream response from Gemini
            response = await self.model.generate_content_async(
                full_prompt,
                stream=True,
                generation_config={
                    "temperature": 0.7,
                    "top_p": 0.95,
                    "top_k": 40,
                    "max_output_tokens": 8192,
                }
            )
            
            async for chunk in response:
                if chunk.text:
                    yield chunk.text
                    
        except Exception as e:
            print(f"[GEMINI] Streaming Error: {e}")
            yield f"Error: {str(e)}"
    
    async def generate(self, prompt: str, system_prompt: str = "") -> str:
        """
        Generate complete response from Gemini
        """
        print(f"[GEMINI] Generating response for: {prompt[:50]}...")
        
        try:
            full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
            
            response = await self.model.generate_content_async(
                full_prompt,
                generation_config={
                    "temperature": 0.7,
                    "top_p": 0.95,
                    "top_k": 40,
                    "max_output_tokens": 8192,
                }
            )
            
            return response.text
            
        except Exception as e:
            print(f"[GEMINI] Error: {e}")
            return f"Error: {str(e)}"

# Global instance factory
def get_provider():
    """
    Returns the Gemini provider instance
    Uses gemini-3-pro-preview for best performance
    """
    return GeminiProvider(model_name="gemini-3-pro-preview")
