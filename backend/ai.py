import os
import json
from typing import Dict, Any, List
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
client = Anthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None


EXTRACT_ENTITIES_SYSTEM_PROMPT = """You are an intelligence analyst extracting structured entities from criminal case notes.
Extract ONLY the following entity types from the provided text:
- people: Full names of individuals mentioned
- phones: Phone numbers in any format
- vehicles: Vehicle descriptions, license plates, make/model
- locations: Addresses, landmarks, cities, coordinates

Return ONLY valid JSON in this exact format:
{
  "people": [],
  "phones": [],
  "vehicles": [],
  "locations": []
}

Rules:
- If no entities of a type are found, return an empty array for that type
- Do not include any explanatory text, only the JSON object
- Be precise - only extract explicitly mentioned entities
- Normalize phone numbers to a consistent format when possible"""


INVESTIGATOR_ASSISTANT_SYSTEM_PROMPT = """You are an AI investigator assistant for a criminal network analysis system.
You have access to REAL computed graph analytics data (betweenness centrality, Louvain communities, shortest paths).
Your answers MUST be grounded ONLY in the provided graph data summary.

CRITICAL RULES:
1. NEVER invent facts, names, or relationships not present in the provided data
2. ONLY reference nodes, metrics, and connections explicitly listed in the context
3. If the data doesn't support an answer, say "The current graph data does not contain enough information to answer this."
4. Use the exact names, IDs, and numbers from the provided context
5. Explain your reasoning by citing the specific metrics (betweenness, degree, community, flagged status)
6. Do not speculate beyond what the graph analytics show

Your role: Help investigators prioritize leads based on NETWORK TOPOLOGY METRICS ONLY."""


def extract_entities(text: str) -> Dict[str, List[str]]:
    if not client:
        raise RuntimeError("Anthropic client not configured. Set ANTHROPIC_API_KEY environment variable.")

    try:
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1024,
            temperature=0,
            system=EXTRACT_ENTITIES_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": text}],
        )

        content = response.content[0].text.strip()
        parsed = json.loads(content)

        result = {
            "people": parsed.get("people", []),
            "phones": parsed.get("phones", []),
            "vehicles": parsed.get("vehicles", []),
            "locations": parsed.get("locations", []),
        }
        return result

    except json.JSONDecodeError as e:
        raise RuntimeError(f"Failed to parse JSON from Claude: {e}")
    except Exception as e:
        raise RuntimeError(f"Entity extraction failed: {e}")


def ask_assistant(question: str, graph_context: str) -> str:
    if not client:
        raise RuntimeError("Anthropic client not configured. Set ANTHROPIC_API_KEY environment variable.")

    try:
        user_prompt = f"{graph_context}\n\nINVESTIGATOR QUESTION: {question}"

        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1500,
            temperature=0.1,
            system=INVESTIGATOR_ASSISTANT_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
        )

        return response.content[0].text.strip()

    except Exception as e:
        raise RuntimeError(f"Assistant query failed: {e}")