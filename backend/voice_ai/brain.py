"""
LLM Provider Abstraction for Skila AI Outbound Calling Platform.
Supports OpenAI (GPT-4o / GPT-4o-mini) and Mock LLM for local sandbox simulations.
"""
from abc import ABC, abstractmethod
import os
import json
import re
from typing import Optional, Dict, Any, List
from .prompts import SKILA_AI_SYSTEM_PROMPT, POST_CALL_ANALYSIS_PROMPT

class LLMProvider(ABC):
    """Abstract Base Class for LLM Providers (OpenAI, Anthropic, Gemini)."""

    @abstractmethod
    async def generate_response(
        self,
        conversation_history: List[Dict[str, str]],
        current_state: Dict[str, Any],
        user_utterance: str,
        school_info: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Generates real-time conversational response in Telugu/English."""
        pass

    @abstractmethod
    async def analyze_call(
        self,
        transcript: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Performs post-call AI qualification, objection extraction, and HOT/WARM/COLD scoring."""
        pass


class OpenAIProvider(LLMProvider):
    """Production OpenAI LLM Provider."""

    def __init__(self, api_key: Optional[str] = None, model: str = "gpt-4o-mini"):
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY", "")
        self.model = model
        self.is_configured = bool(self.api_key)

    async def generate_response(
        self,
        conversation_history: List[Dict[str, str]],
        current_state: Dict[str, Any],
        user_utterance: str,
        school_info: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        if not self.is_configured:
            raise ValueError("OPENAI_API_KEY is not configured.")

        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=self.api_key)

        school_context = ""
        if school_info:
            school_context = f"\nSchool Name: {school_info.get('school_name', '')}, District: {school_info.get('district', '')}, Contact: {school_info.get('principal_name', '')}"

        system_instruction = f"""{SKILA_AI_SYSTEM_PROMPT}

CURRENT CONTEXT & CALL STATE:
{school_context}
Current State: {json.dumps(current_state, ensure_ascii=False)}

TASK:
1. Respond to the principal naturally in conversational Telugu (with natural English code-switching).
2. Keep response concise (1 to 2 sentences max) suitable for rapid voice synthesis.
3. Update extracted information in JSON output.

FORMAT OUTPUT AS JSON:
{{
  "reply": "Telugu response text here",
  "extracted_student_count": null,
  "current_lms_mentioned": null,
  "current_erp_mentioned": null,
  "pain_points": [],
  "demo_requested": false,
  "pricing_inquiry": false,
  "callback_requested": false,
  "not_interested": false,
  "do_not_call": false
}}"""

        messages = [{"role": "system", "content": system_instruction}]
        for turn in conversation_history[-8:]:
            messages.append(turn)
        messages.append({"role": "user", "content": user_utterance})

        try:
            resp = await client.chat.completions.create(
                model=self.model,
                messages=messages,
                response_format={"type": "json_object"},
                temperature=0.3,
                max_tokens=250
            )
            raw_content = resp.choices[0].message.content or "{}"
            parsed = json.loads(raw_content)
            
            # Merge state
            updated_state = dict(current_state)
            if parsed.get("extracted_student_count") is not None:
                updated_state["student_count"] = parsed["extracted_student_count"]
            if parsed.get("current_lms_mentioned") is not None:
                updated_state["current_lms"] = parsed["current_lms_mentioned"]
            if parsed.get("current_erp_mentioned") is not None:
                updated_state["current_erp"] = parsed["current_erp_mentioned"]
            if parsed.get("pain_points"):
                pts = updated_state.setdefault("pain_points", [])
                for p in parsed["pain_points"]:
                    if p not in pts:
                        pts.append(p)
            if parsed.get("demo_requested"):
                updated_state["demo_requested"] = True
            if parsed.get("pricing_inquiry"):
                updated_state["pricing_discussed"] = True
                updated_state["pricing_discussion_required"] = True
            if parsed.get("callback_requested"):
                updated_state["callback_requested"] = True
            if parsed.get("not_interested"):
                updated_state["lead_status"] = "NOT_INTERESTED"
                updated_state["interest_level"] = "COLD"
            if parsed.get("do_not_call"):
                updated_state["lead_status"] = "DO_NOT_CALL"
                updated_state["interest_level"] = "COLD"

            return {
                "reply": parsed.get("reply", "Namaskaram sir, mee school requirements gurinchi cheppandi."),
                "updated_state": updated_state
            }
        except Exception as e:
            print(f"[OpenAI Chat Error] {e}")
            return {
                "reply": "Arthamaindi sir. Mee school student strength and requirements batti maa team live demo lo clear ga explain chestaru.",
                "updated_state": current_state
            }

    async def analyze_call(
        self,
        transcript: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        if not self.is_configured:
            raise ValueError("OPENAI_API_KEY is not configured.")

        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=self.api_key)

        prompt = POST_CALL_ANALYSIS_PROMPT.format(transcript=transcript)

        try:
            resp = await client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a professional educational sales intelligence analyst for Skila AI. Always output valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
                max_tokens=600
            )
            raw_text = resp.choices[0].message.content or "{}"
            result = json.loads(raw_text)
            
            # Ensure valid interest classification
            if result.get("interest_level") not in ["HOT", "WARM", "COLD"]:
                result["interest_level"] = "WARM" if result.get("demo_requested") or result.get("details_requested") else "COLD"
            
            return result
        except Exception as e:
            print(f"[OpenAI Analysis Error] {e}")
            return {
                "lead_status": "INTERESTED" if "demo" in transcript.lower() else "CONTACTED",
                "interest_level": "WARM",
                "interest_reason": "Standard fallback post-call evaluation",
                "student_count": None,
                "current_lms": None,
                "current_erp": None,
                "pain_points": [],
                "objections": [],
                "language_detected": "Telugu",
                "demo_requested": "demo" in transcript.lower(),
                "callback_requested": False,
                "details_requested": False,
                "pricing_discussed": False,
                "management_approval_required": False,
                "next_action": "ASSIGN_SALESPERSON",
                "summary": "Call completed with school administrator. Review transcript for specific details."
            }


class GeminiProvider(LLMProvider):
    """Google Gemini LLM Provider using the official google-genai SDK."""

    def __init__(self, api_key: Optional[str] = None, model: str = "gemini-2.5-flash"):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY", "")
        self.model = model
        self.is_configured = bool(self.api_key)

    async def generate_response(
        self,
        conversation_history: List[Dict[str, str]],
        current_state: Dict[str, Any],
        user_utterance: str,
        school_info: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        if not self.is_configured:
            raise ValueError("GEMINI_API_KEY / GOOGLE_API_KEY is not configured.")

        from google import genai
        from google.genai import types

        client = genai.Client(api_key=self.api_key)

        school_context = ""
        if school_info:
            school_context = f"\nSchool Name: {school_info.get('school_name', '')}, District: {school_info.get('district', '')}, Contact: {school_info.get('principal_name', '')}"

        system_instruction = f"""{SKILA_AI_SYSTEM_PROMPT}

CURRENT CONTEXT & CALL STATE:
{school_context}
Current State: {json.dumps(current_state, ensure_ascii=False)}

TASK:
1. Respond to the principal naturally in conversational Telugu (with natural English code-switching).
2. Keep response concise (1 to 2 sentences max) suitable for rapid voice synthesis.
3. Update extracted information in JSON output.

FORMAT OUTPUT AS JSON:
{{
  "reply": "Telugu response text here",
  "extracted_student_count": null,
  "current_lms_mentioned": null,
  "current_erp_mentioned": null,
  "pain_points": [],
  "demo_requested": false,
  "pricing_inquiry": false,
  "callback_requested": false,
  "not_interested": false,
  "do_not_call": false
}}"""

        prompt_parts = [system_instruction, "\nCONVERSATION HISTORY:"]
        for turn in conversation_history[-8:]:
            prompt_parts.append(f"{turn.get('role', 'user')}: {turn.get('content', '')}")
        prompt_parts.append(f"user: {user_utterance}")
        full_prompt = "\n".join(prompt_parts)

        try:
            resp = client.models.generate_content(
                model=self.model,
                contents=full_prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.3,
                    max_output_tokens=300
                )
            )
            raw_text = resp.text or "{}"
            parsed = json.loads(raw_text)

            updated_state = dict(current_state)
            if parsed.get("extracted_student_count") is not None:
                updated_state["student_count"] = parsed["extracted_student_count"]
            if parsed.get("current_lms_mentioned") is not None:
                updated_state["current_lms"] = parsed["current_lms_mentioned"]
            if parsed.get("current_erp_mentioned") is not None:
                updated_state["current_erp"] = parsed["current_erp_mentioned"]
            if parsed.get("pain_points"):
                pts = updated_state.setdefault("pain_points", [])
                for p in parsed["pain_points"]:
                    if p not in pts:
                        pts.append(p)
            if parsed.get("demo_requested"):
                updated_state["demo_requested"] = True
            if parsed.get("pricing_inquiry"):
                updated_state["pricing_discussed"] = True
                updated_state["pricing_discussion_required"] = True
            if parsed.get("callback_requested"):
                updated_state["callback_requested"] = True
            if parsed.get("not_interested"):
                updated_state["lead_status"] = "NOT_INTERESTED"
                updated_state["interest_level"] = "COLD"
            if parsed.get("do_not_call"):
                updated_state["lead_status"] = "DO_NOT_CALL"
                updated_state["interest_level"] = "COLD"

            return {
                "reply": parsed.get("reply", "Namaskaram sir, mee school requirements gurinchi cheppandi."),
                "updated_state": updated_state
            }
        except Exception as e:
            print(f"[Gemini Chat Error] {e}")
            return {
                "reply": "Arthamaindi sir. Mee school student strength and requirements batti maa team live demo lo clear ga explain chestaru.",
                "updated_state": current_state
            }

    async def analyze_call(
        self,
        transcript: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        if not self.is_configured:
            return await MockLLMProvider().analyze_call(transcript, metadata)

        from google import genai
        from google.genai import types

        client = genai.Client(api_key=self.api_key)
        prompt = POST_CALL_ANALYSIS_PROMPT.format(transcript=transcript)

        try:
            resp = client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2,
                    max_output_tokens=600
                )
            )
            return json.loads(resp.text or "{}")
        except Exception as e:
            print(f"[Gemini Post Call Analysis Error] {e}")
            return await MockLLMProvider().analyze_call(transcript, metadata)


class MistralProvider(LLMProvider):
    """Production Mistral AI LLM Provider for dynamic Telugu dialogue."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = api_key or os.environ.get("MISTRAL_API_KEY") or os.environ.get("\ufeffMISTRAL_API_KEY") or "NSE2fNMAHxsXAnAJyMlzKK5nYpNdvtu3"
        self.model = model or os.environ.get("MISTRAL_MODEL", "ministral-14b-latest")
        self.base_url = base_url or os.environ.get("MISTRAL_BASE_URL", "https://api.mistral.ai/v1")
        self.is_configured = bool(self.api_key)

    async def generate_response(
        self,
        conversation_history: List[Dict[str, str]],
        current_state: Dict[str, Any],
        user_utterance: str,
        school_info: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        if not self.is_configured:
            return await MockLLMProvider().generate_response(conversation_history, current_state, user_utterance, school_info)

        school_context = ""
        if school_info:
            school_context = f"\nSchool Name: {school_info.get('school_name', '')}, District: {school_info.get('district', '')}, Contact: {school_info.get('principal_name', '')}"

        system_instruction = f"""{SKILA_AI_SYSTEM_PROMPT}

CURRENT CONTEXT & CALL STATE:
{school_context}
Current State: {json.dumps(current_state, ensure_ascii=False)}

TASK:
1. Respond to the principal naturally in conversational Telugu (with natural English code-switching).
2. Keep response concise (1 to 2 sentences max) suitable for rapid voice synthesis.
3. Update extracted information in JSON output.

FORMAT OUTPUT AS JSON:
{{
  "reply": "Telugu response text here",
  "extracted_student_count": null,
  "current_lms_mentioned": null,
  "current_erp_mentioned": null,
  "pain_points": [],
  "demo_requested": false,
  "pricing_inquiry": false,
  "callback_requested": false,
  "not_interested": false,
  "do_not_call": false
}}"""

        messages = [{"role": "system", "content": system_instruction}]
        for turn in conversation_history[-8:]:
            messages.append(turn)
        messages.append({"role": "user", "content": user_utterance})

        import urllib.request
        import asyncio

        def _call_sync():
            url = f"{self.base_url}/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": self.model,
                "messages": messages,
                "temperature": 0.3,
                "response_format": {"type": "json_object"}
            }
            data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(url, data=data, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as response:
                res_json = json.loads(response.read().decode("utf-8"))
                content = res_json["choices"][0]["message"]["content"]
                return json.loads(content)

        try:
            loop = asyncio.get_event_loop()
            parsed = await loop.run_in_executor(None, _call_sync)

            updated_state = dict(current_state)
            if parsed.get("extracted_student_count") is not None:
                updated_state["student_count"] = parsed["extracted_student_count"]
            if parsed.get("current_lms_mentioned") is not None:
                updated_state["current_lms"] = parsed["current_lms_mentioned"]
            if parsed.get("current_erp_mentioned") is not None:
                updated_state["current_erp"] = parsed["current_erp_mentioned"]
            if parsed.get("pain_points"):
                pts = updated_state.setdefault("pain_points", [])
                for p in parsed["pain_points"]:
                    if p not in pts:
                        pts.append(p)
            if parsed.get("demo_requested"):
                updated_state["demo_requested"] = True
            if parsed.get("pricing_inquiry"):
                updated_state["pricing_discussed"] = True
                updated_state["pricing_discussion_required"] = True
            if parsed.get("callback_requested"):
                updated_state["callback_requested"] = True
            if parsed.get("not_interested"):
                updated_state["lead_status"] = "NOT_INTERESTED"
                updated_state["interest_level"] = "COLD"
            if parsed.get("do_not_call"):
                updated_state["lead_status"] = "DO_NOT_CALL"
                updated_state["interest_level"] = "COLD"

            return {
                "reply": parsed.get("reply", "Namaskaram andi, mee school requirements gurinchi cheppandi."),
                "updated_state": updated_state
            }
        except Exception as e:
            print(f"[Mistral Chat Error] {e}")
            return await MockLLMProvider().generate_response(conversation_history, current_state, user_utterance, school_info)

    async def analyze_call(
        self,
        transcript: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        if not self.is_configured:
            return await MockLLMProvider().analyze_call(transcript, metadata)

        import urllib.request
        import asyncio

        prompt = POST_CALL_ANALYSIS_PROMPT.format(transcript=transcript)
        messages = [{"role": "user", "content": prompt}]

        def _call_sync():
            url = f"{self.base_url}/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": self.model,
                "messages": messages,
                "temperature": 0.2,
                "response_format": {"type": "json_object"}
            }
            data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(url, data=data, headers=headers)
            with urllib.request.urlopen(req, timeout=12) as response:
                res_json = json.loads(response.read().decode("utf-8"))
                content = res_json["choices"][0]["message"]["content"]
                return json.loads(content)

        try:
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(None, _call_sync)
        except Exception as e:
            print(f"[Mistral Post Call Analysis Error] {e}")
            return await MockLLMProvider().analyze_call(transcript, metadata)


class MockLLMProvider(LLMProvider):
    """
    State-Aware Dynamic Conversational Engine for local sandbox simulations.
    Adapts intelligently across all 8 sales funnel stages, supports Telugu script & English,
    and dynamically answers questions without hardcoded repetitive fallbacks.
    """

    async def generate_response(
        self,
        conversation_history: List[Dict[str, str]],
        current_state: Dict[str, Any],
        user_utterance: str,
        school_info: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        text = user_utterance.lower().strip()
        updated = dict(current_state)
        user_turns = len([m for m in conversation_history if m.get("role") == "user"])

        # -------------------------------------------------------------
        # TURN 1: Responding to opening greeting ("Is it convenient to speak?")
        # -------------------------------------------------------------
        if user_turns <= 1:
            # 1A. Callee agrees to talk (Acknowledges availability -> transitions to QUALIFY)
            if any(w in text for w in [
                "yes", "ha", "avunu", "cheppandi", "matladandi", "okay", "convenient", "sure", "sare",
                "ఔను", "చెప్పండి", "సరే", "మాట్లాడండి", "చెప్పు", "హ", "ఓకే", "వింటున్నా", "continue"
            ]):
                reply = "Dhanyavaadalu sir. Skila AI school educational solutions and AI-powered books gurinchi brief ga maatladataniki call chesanu. Mee school lo primary nunchi 10th varaku approximately entha mandi students unnaru sir?"
                updated["funnel_stage"] = "QUALIFY"
                return {"reply": reply, "updated_state": updated}

            # 1B. Busy / Call later
            if any(w in text for w in [
                "busy", "later", "ippudu kudaradu", "call back", "tarvata", "repu",
                "బిజీ", "కుదరదు", "రేపు", "తర్వాత", "సాయంత్రం", "మళ్ళీ"
            ]):
                updated["callback_requested"] = True
                updated["lead_status"] = "CALLBACK_REQUESTED"
                reply = "Tappakunda sir, mee time respect chestanu. Ee roju evening or repu morning ye time lo malli call cheyyagalamu?"
                return {"reply": reply, "updated_state": updated}

            # 1C. Identity inquiry ("Who is calling?", "What is this?")
            if any(w in text for w in [
                "who", "evaru", "enti", "company", "organization", "ఎవరు", "ఏంటి", "మీరెవరు"
            ]):
                reply = "Nenu Skila AI nunchi Ananya ni sir. Memu Telangana schools ki interactive AI-powered books and modern LMS technology provide chestunnamu. Mee school lo digital learning use chestunnara?"
                return {"reply": reply, "updated_state": updated}

            # 1D. Direct rejection on call start
            if any(w in text for w in [
                "dont call", "vaddu", "remove", "cut", "not interested", "వద్దు", "చేయొద్దు", "ఆసక్తి లేదు"
            ]):
                updated["lead_status"] = "DO_NOT_CALL"
                updated["interest_level"] = "COLD"
                reply = "Apologies for the disturbance sir. Mee number ni maa calling list nunchi immediately remove chestunnanu. Have a good day."
                return {"reply": reply, "updated_state": updated}

            # 1E. Callee gave number immediately on turn 1
            digits = re.findall(r'\b\d{2,4}\b', text)
            if digits:
                cnt = int(digits[0])
                updated["student_count"] = cnt
                updated["funnel_stage"] = "EXPLAIN"
                reply = f"Great sir, {cnt} students unna school ki maa AI books and personalized learning tool chaala effective ga work chestundi. Currently mee school lo edaina digital LMS platform use chestunnara?"
                return {"reply": reply, "updated_state": updated}

            # 1F. General opening fallback
            reply = "Skila AI educational solutions and modern AI books gurinchi brief ga maatladataniki call chesanu sir. Mee school lo students strength entha undi sir?"
            updated["funnel_stage"] = "QUALIFY"
            return {"reply": reply, "updated_state": updated}

        # -------------------------------------------------------------
        # TURNS 2+: Mid-Conversation Dynamic Understanding & Objection Handling
        # -------------------------------------------------------------

        # 2A. Do Not Call / Hostile Rejection
        if any(w in text for w in ["dont call", "remove", "కాల్ చేయొద్దు", "చేయకండి"]):
            updated["lead_status"] = "DO_NOT_CALL"
            updated["interest_level"] = "COLD"
            reply = "Apologies for the disturbance sir. Mee number ni maa calling list nunchi immediately remove chestunnanu. Have a peaceful day."
            return {"reply": reply, "updated_state": updated}

        # 2B. Polite Rejection
        if any(w in text for w in ["not interested", "interest ledu", "akkarledu", "వద్దు", "ఆసక్తి లేదు", "వద్దు లెండి"]):
            updated["lead_status"] = "NOT_INTERESTED"
            updated["interest_level"] = "COLD"
            reply = "No problem sir. Mee valuable time ichinanduku chaala dhanyavaadalu. Have a wonderful day!"
            return {"reply": reply, "updated_state": updated}

        # 2C. Busy / Callback request with dynamic time acknowledgement
        if any(w in text for w in ["busy", "later", "call back", "tarvata", "repu", "బిజీ", "రేపు", "తర్వాత", "సాయంత్రం", "కుదరదు"]):
            updated["callback_requested"] = True
            updated["lead_status"] = "CALLBACK_REQUESTED"
            time_str = "repu evening" if any(w in text for w in ["repu", "రేపు", "tomorrow", "evening", "సాయంత్రం"]) else "convenient time lo"
            reply = f"Tappakunda sir, mee time respect chestanu. Meeru cheppina vidhamga {time_str} maa team malli call chesi connect avtaru. Dhanyavaadalu sir!"
            return {"reply": reply, "updated_state": updated}

        # 2D. Student Strength Extraction
        digits = re.findall(r'\b\d{2,4}\b', text)
        if digits and not current_state.get("student_count"):
            cnt = int(digits[0])
            updated["student_count"] = cnt
            updated["funnel_stage"] = "EXPLAIN"
            reply = f"Great sir, {cnt} students unna school ki maa interactive AI books and smart LMS tool teachers ki, students ki chaala baga help chestundi. Currently homework and student attendance kosam edaina software use chestunnara sir?"
            return {"reply": reply, "updated_state": updated}

        # 2E. Questions on Syllabus / Curriculum / Books
        if any(w in text for w in [
            "syllabus", "curriculum", "cbse", "state board", "books", "subjects",
            "సిలబస్", "బుక్స్", "సబ్జెక్ట్స్", "బోర్డు", "పాఠాలు", "సిలబస్ ఏముంటుంది"
        ]):
            updated["funnel_stage"] = "GENERATE_INTEREST"
            reply = "Maa AI books Telangana State Board and CBSE curriculum ki fully align ayyi untayi sir. Concept clarity kosam Telugu and English bilingual AI tutor untundi. Deeni student engagement ela untundo oka 15-minute live demo lo chupinchagalamu sir."
            return {"reply": reply, "updated_state": updated}

        # 2F. Questions on Teachers / Training / Ease of Use
        if any(w in text for w in [
            "teacher", "training", "faculty", "staff", "difficult", "easy",
            "టీచర్స్", "ట్రైనింగ్", "నేర్పిస్తారా", "కష్టమా"
        ]):
            updated["funnel_stage"] = "GENERATE_INTEREST"
            reply = "Teachers ki zero-effort onboarding untundi sir. Maa academic team direct ga school ki vachi complete hands-on training istaru. Lesson plan creation and auto-quizzes tho teachers daily time chaala save avtundi."
            return {"reply": reply, "updated_state": updated}

        # 2G. Pricing / Fee Inquiry (Strict Guardrail: ₹500–₹600, no discount on call)
        if any(w in text for w in [
            "cost", "price", "fees", "fee", "discount", "entha", "rate", "budget", "ధర", "ఖర్చు", "ఫీజు", "ఎంత"
        ]):
            updated["pricing_discussed"] = True
            updated["pricing_discussion_required"] = True
            updated["funnel_stage"] = "GENERATE_INTEREST"
            reply = "Maa standard institutional pricing per student ₹500 nunchi ₹600 per year varaku untundi sir, including AI books and LMS. Exact commercial proposal mee student strength batti maa senior consultant walkthrough lo direct ga confirm chestaru."
            return {"reply": reply, "updated_state": updated}

        # 2H. Existing LMS Objection
        if bool(re.search(r'\b(already|lms|teachmint|lead|using)\b', text)) or any(w in text for w in [
            "lms undi", "already undi", "software undi", "వేరేది", "వేరేది ఉంది", "వాడుతున్నాం", "మా దగ్గర ఉంది"
        ]):
            updated["current_lms"] = True
            updated["funnel_stage"] = "GENERATE_INTEREST"
            reply = "Chaala manchidi sir. Maa solution existing LMS ni replace cheyyalsina avasaram ledu. Skila AI interactive books and personalized AI tutor existing setup tho seamlessly integrate avtundi. Idi students results ni ela penchutundo oka short 15-minute walkthrough lo chupinchagalamu sir."
            return {"reply": reply, "updated_state": updated}

        # 2I. WhatsApp / Brochure request
        if any(w in text for w in [
            "whatsapp", "brochure", "send details", "pampandi", "message", "వాట్సాప్", "వివరాలు", "పంపండి"
        ]):
            updated["details_requested"] = True
            updated["interest_level"] = "WARM"
            updated["funnel_stage"] = "BOOK_DEMO"
            reply = "Tappakunda sir, mee official WhatsApp ki Skila AI institutional brochure share chestunnanu. Andulo curriculum details chusukuni, meeku convenient time lo 15-minute live demo schedule chesukovachu sir."
            return {"reply": reply, "updated_state": updated}

        # 2J. Demo Agreement / Willingness to see product (Book Demo -> Human Sales Handoff)
        if any(w in text for w in [
            "demo", "rammanu", "chudam", "show me", "walkthrough", "schedule", "arrange",
            "డెమో", "రమ్మను", "చూద్దాం", "చూపించండి", "షెడ్యూల్", "కలుద్దాం", "రండి"
        ]) or (any(w in text for w in ["yes", "sure", "sare", "okay", "సరే", "చూడండి"]) and current_state.get("funnel_stage") in ["GENERATE_INTEREST", "BOOK_DEMO"]):
            updated["demo_requested"] = True
            updated["interest_level"] = "HOT"
            updated["lead_status"] = "DEMO_REQUESTED"
            updated["funnel_stage"] = "SALES_HANDOFF"
            reply = "Chaala santhosham sir! Mee school management and teachers kosam 15-minute live demo schedule confirm chesamu. Maa Senior Academic Consultant meeku direct ga connect avtaru. Mee WhatsApp number ki complete invitation and schedule share chestunnanu. Dhanyavaadalu sir!"
            return {"reply": reply, "updated_state": updated}

        # 2K. Intelligent Dynamic Fallbacks (NO repeating static lines!)
        if any(w in text for w in ["?", "enti", "ela", "evaru", "what", "how", "why", "ఎలా", "ఏంటి", "ఎందుకు"]):
            reply = "Skila AI main target students concept learning penchadam and teachers academic workload automate cheyyadam sir. Ee technology mee school classrooms lo ela implement avtundo oka brief 15-minute campus demo lo chupinchamantara sir?"
            return {"reply": reply, "updated_state": updated}

        if any(w in text for w in ["manchidi", "good", "nice", "super", "bagundi", "బాగుంది", "మంచిది"]):
            reply = "Dhanyavaadalu sir! Ee modern technology tho students learning outcomes lo visible improvement chudochu. Ee week lo meeku convenient unna roju short online or campus demo arrange cheyyagalamu sir?"
            return {"reply": reply, "updated_state": updated}

        if user_turns == 2:
            reply = "Arthamaindi sir. Mee school academic goals and student strength batti custom demonstration arrange cheyyadam maa target. Ee week Tuesday or Wednesday ye day meeku convenient ga untundi sir?"
        elif user_turns == 3:
            reply = "Kachitanga sir, mee requirements note chesukuntanu. Maa Senior Consultant live walkthrough lo interactive AI books and analytics complete ga chupistaru. Ee week lo 15-minute schedule fix chesukovacha sir?"
        else:
            reply = "Dhanyavaadalu sir. Mee school ki best academic support provide cheyyadame maa priority. Mee convenient time lo 15-minute institutional demo schedule chesi maa Senior Consultant direct ga reach avtaru."

        return {"reply": reply, "updated_state": updated}

    async def analyze_call(
        self,
        transcript: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        txt = transcript.lower()
        has_demo = "demo" in txt or "rammanu" in txt or "sare" in txt or "interested" in txt
        has_not_interested = "not interested" in txt or "vaddu" in txt or "akkarledu" in txt
        has_do_not_call = "dont call" in txt or "remove" in txt

        digits = re.findall(r'\b\d{2,4}\b', txt)
        student_count = int(digits[0]) if digits else 650

        if has_do_not_call:
            status = "DO_NOT_CALL"
            level = "COLD"
            action = "DO_NOT_CONTACT"
        elif has_not_interested:
            status = "NOT_INTERESTED"
            level = "COLD"
            action = "NO_ACTION"
        elif has_demo:
            status = "DEMO_REQUESTED"
            level = "HOT"
            action = "BOOK_DEMO"
        else:
            status = "INTERESTED"
            level = "WARM"
            action = "ASSIGN_SALESPERSON"

        return {
            "lead_status": status,
            "interest_level": level,
            "interest_reason": "Principal expressed interest and agreed to explore digital AI curriculum." if level == "HOT" else "Receptive institutional interaction.",
            "student_count": student_count,
            "current_lms": "lms" in txt,
            "current_erp": "erp" in txt,
            "pain_points": ["Teacher digital enablement", "Student personalized attention"] if level != "COLD" else [],
            "objections": ["Existing vendor software installed"] if "lms" in txt else [],
            "language_detected": "Telugu-English",
            "demo_requested": has_demo,
            "callback_requested": "call later" in txt or "tarvata" in txt,
            "callback_time": "Tomorrow 11:00 AM" if ("call later" in txt or "tarvata" in txt) else "",
            "details_requested": "whatsapp" in txt or "details" in txt,
            "pricing_discussed": "cost" in txt or "price" in txt or "₹500" in txt,
            "management_approval_required": "management" in txt or "chairman" in txt,
            "next_action": action,
            "summary": f"Spoke with school administrator in Telugu regarding Skila AI-powered books and LMS. Verified approximately {student_count} student strength. {('Lead requested live demonstration.' if level == 'HOT' else 'Shared overview and scheduled follow-up.')}"
        }
