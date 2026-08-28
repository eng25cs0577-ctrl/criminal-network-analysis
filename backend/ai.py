import os
import json
from typing import Dict, Any, List
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-3.6-flash") if GEMINI_API_KEY else None


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


def _strip_code_fence(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0]
    return text.strip()


def extract_entities(text: str) -> Dict[str, List[str]]:
    if not model:
        raise RuntimeError("Gemini client not configured. Set GEMINI_API_KEY environment variable.")

    try:
        response = model.generate_content(
            [EXTRACT_ENTITIES_SYSTEM_PROMPT, f"CASE NOTES:\n{text}"],
            generation_config={"temperature": 0, "max_output_tokens": 1024},
        )

        content = _strip_code_fence(response.text)
        parsed = json.loads(content)

        result = {
            "people": parsed.get("people", []),
            "phones": parsed.get("phones", []),
            "vehicles": parsed.get("vehicles", []),
            "locations": parsed.get("locations", []),
        }
        return result

    except json.JSONDecodeError as e:
        raise RuntimeError(f"Failed to parse JSON from Gemini: {e}")
    except Exception as e:
        raise RuntimeError(f"Entity extraction failed: {e}")


def ask_assistant(question: str, graph_context: str) -> str:
    if not model:
        raise RuntimeError("Gemini client not configured. Set GEMINI_API_KEY environment variable.")

    try:
        user_prompt = f"{graph_context}\n\nINVESTIGATOR QUESTION: {question}"

        response = model.generate_content(
            [INVESTIGATOR_ASSISTANT_SYSTEM_PROMPT, user_prompt],
            generation_config={"temperature": 0.1, "max_output_tokens": 1500},
        )

        return response.text.strip()

    except Exception as e:
        raise RuntimeError(f"Assistant query failed: {e}")
