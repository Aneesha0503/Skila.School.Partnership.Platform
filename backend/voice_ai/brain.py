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


class MockLLMProvider(LLMProvider):
    """
    Mock LLM Provider for sandbox testing and interactive browser call simulator.
    Provides natural Telugu/English simulated conversational logic with zero API key dependencies.
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

        # 1. Opening response / greeting
        if len(conversation_history) <= 1:
            if any(w in text for w in ["yes", "ha", "avunu", "cheppandi", "okay", "matladandi", "convenient"]):
                reply = "Dhanyavaadalu sir. Skila AI lo interactive AI-powered books and school LMS unnai. Mee school lo approximately entha mandi students unnaru sir?"
            elif any(w in text for w in ["busy", "later", "ippudu kudaradu", "call back", "tarvata"]):
                updated["callback_requested"] = True
                updated["lead_status"] = "CALLBACK_REQUESTED"
                reply = "Tappakunda sir, mee time respect chestanu. Ee roju evening or repu morning ye time lo malli call cheyyagalamu?"
            elif any(w in text for w in ["who", "evaru", "enti"]):
                reply = "Nenu Skila AI nunchi Ananya ni sir. Memu Telangana schools ki AI-powered books and modern LMS technology provide chestunnamu. Mee school lo digital learning use chestunnara?"
            elif any(w in text for w in ["dont call", "vaddu", "remove", "cut"]):
                updated["lead_status"] = "DO_NOT_CALL"
                updated["interest_level"] = "COLD"
                reply = "Apologies for the disturbance sir. Mee number ni maa calling list nunchi immediately remove chestunnanu. Have a good day."
            else:
                reply = "Skila AI school educational solutions gurinchi brief ga matladataniki call chesanu sir. Mee school lo students strength entha undi sir?"
            return {"reply": reply, "updated_state": updated}

        # 2. Extract student strength
        digits = re.findall(r'\b\d{2,4}\b', text)
        if digits:
            cnt = int(digits[0])
            updated["student_count"] = cnt
            reply = f"Great sir, {cnt} students unna school ki maa AI books and personalized learning tool chaala effective ga work chestundi. Currently mee school lo edaina digital LMS platform use chestunnara?"
            return {"reply": reply, "updated_state": updated}

        # 3. Existing LMS objection
        if any(w in text for w in ["already", "undi", "lms undi", "using", "teachmint", "lead"]):
            updated["current_lms"] = True
            reply = "Chaala manchidi sir. Maa solution existing system ni replace cheyyalsina avasaram ledu. Students ki AI-powered learning and AI books additional ga ela result istayo oka short 15-minute demo lo chupinchagalamu. Convenient ga untunda sir?"
            return {"reply": reply, "updated_state": updated}

        # 4. Pricing / Discount questions
        if any(w in text for w in ["cost", "price", "fees", "discount", "entha", "rate", "budget"]):
            updated["pricing_discussed"] = True
            updated["pricing_discussion_required"] = True
            reply = "Maa standard pricing per student ₹500 nunchi ₹600 per year varaku untundi sir. Kani exact commercial proposal mee student strength batti maa senior team direct ga confirm chestundi. Oka short live demo lo complete details chupinchagalamu."
            return {"reply": reply, "updated_state": updated}

        # 5. Demo / Meeting agreement
        if any(w in text for w in ["demo", "yes", "chudam", "okay", "rammanu", "send someone", "sure", "sare"]):
            updated["demo_requested"] = True
            updated["interest_level"] = "HOT"
            updated["lead_status"] = "DEMO_REQUESTED"
            reply = "Chaala santhosham sir! Maa Senior Academic Consultant meeku demo ivvadaniki connect avtaru. Mee WhatsApp number ki details and schedule share chestunnanu. Mee valuable time ichinanduku chaala dhanyavaadalu sir!"
            return {"reply": reply, "updated_state": updated}

        # 6. Send WhatsApp details
        if any(w in text for w in ["whatsapp", "brochure", "send details", "pampandi", "message"]):
            updated["details_requested"] = True
            updated["interest_level"] = "WARM"
            reply = "Sure sir, note chesukuntanu. Mee official WhatsApp ki institutional brochure share chestaru. Andulo meeku convenient time lo live demo schedule chesukovachu sir."
            return {"reply": reply, "updated_state": updated}

        # 7. Rejection
        if any(w in text for w in ["no", "not interested", "vaddu", "interest ledu", "akkarledu"]):
            updated["lead_status"] = "NOT_INTERESTED"
            updated["interest_level"] = "COLD"
            reply = "No problem sir. Mee valuable time ichinanduku chaala dhanyavaadalu. Have a wonderful day!"
            return {"reply": reply, "updated_state": updated}

        # Default fallback response
        reply = "Arthamaindi sir. Skila AI personalized learning and interactive curriculum meeda mee school ki live demo chupinchadam maa target. Ee week lo 15-minute online or campus demo arrange cheyyagalamu?"
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
