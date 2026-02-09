"""
Gemini SuperAgent Startup Script
Validates environment and starts the orchestrator
"""
import os
import sys
from pathlib import Path

# Check if .env file exists (in current dir or parent dir)
env_file = Path(".env")
if not env_file.exists():
    env_file = Path("../.env")  # Try parent directory
if not env_file.exists():
    print("❌ ERROR: .env file not found!")
    print("")
    print("📋 Setup Instructions:")
    print("1. Copy .env.example to .env:")
    print("   cp .env.example .env")
    print("")
    print("2. Get your Gemini API key from:")
    print("   https://makersuite.google.com/app/apikey")
    print("")
    print("3. Edit .env and add your API key:")
    print("   GEMINI_API_KEY=your_actual_key_here")
    print("")
    sys.exit(1)

# Load environment variables from the found .env file
from dotenv import load_dotenv
load_dotenv(env_file)

# Check if API key is set
api_key = os.getenv("GEMINI_API_KEY")
if not api_key or api_key == "your_gemini_api_key_here":
    print("❌ ERROR: GEMINI_API_KEY not configured!")
    print("")
    print("📋 Please edit .env file and set your Gemini API key")
    print("Get your key from: https://makersuite.google.com/app/apikey")
    print("")
    sys.exit(1)

print("✅ Environment validated successfully!")
print(f"🚀 Starting Gemini SuperAgent...")
print(f"📡 Model: {os.getenv('GEMINI_MODEL', 'gemini-3-flash-preview')}")
print("")

# Import and run orchestrator
import uvicorn
from orchestrator import app

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
