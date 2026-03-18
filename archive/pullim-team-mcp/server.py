"""
풀림(Pullim) 창업팀 MCP 서버
- 7개 팀원 역할(CTO, AI-Lead, PM, Safety, CMO, CFO, Data)
- 1개 대표 전담 역할(COS — 비서실장)
- 수평 조직 + 자연스러운 반박 문화
- Tycono 패턴 참고: dispatch, consult, meeting, briefing
"""

import asyncio
import json
import os
from pathlib import Path
from typing import Optional

import yaml
from mcp.server.fastmcp import FastMCP

try:
    import anthropic
except ImportError:
    anthropic = None

# === 설정 ===
ROLES_DIR = Path(__file__).parent / "roles"
TEAM_STATE_PATH = Path.home() / "study/main/창업/팀/team_state.yaml"
SESSION_CONTEXT_PATH = Path.home() / "study/main/창업/세션_맥락.md"
MODEL = "claude-sonnet-4-6-20250514"
VALID_ROLES = ["cto", "ai-lead", "pm", "safety", "cmo", "cfo", "data"]
COS_ROLE = "cos"  # 팀원이 아닌 대표 전담 역할
ALL_ROLES = VALID_ROLES + [COS_ROLE]

# === 토론 프로토콜 (모든 역할에 주입) ===
DEBATE_PROTOCOL = """
## 토론 프로토콜
- 다른 역할의 의견에 동의하지 않으면 명확히 반박한다.
- "좋은 의견이지만..." 같은 완곡어법 금지. 동의하지 않으면 "동의하지 않는다. 이유:"로 시작.
- 반박 시 반드시 근거(데이터, 사례, 논리)를 제시한다.
- 상대방의 반박에 납득하면 즉시 인정한다. 체면 유지 금지.
- CEO의 의견이라도 전문 영역에서 문제가 있으면 반박한다.
- 모든 발언은 실행 가능한 다음 행동 1-3개로 마무리한다.
"""

PRODUCT_CONTEXT = """
## 풀림(Pullim) 제품 맥락
- AI 기반 의사결정/감정 동반 서비스. "이야기를 듣고, 같이 나아갑니다."
- 내부 원칙: "Evoke, don't prescribe."
- v2: 멀티 에이전트 토론 기반 (전문가 3명 병렬 분석 + 토론 + 리포트)
- 차별화: 프롬프트가 아니라 파이프라인 (상태 관리 + 오케스트레이션 + 안전 레이어)
- 기술: Next.js 15 + Supabase + Claude API + Vercel + PWA
- 단계: Customer Discovery → MVP 준비
- 예산: 425만원
- 팀: AI-Native 1인 창업자 + AI 에이전트 팀
"""

# === MCP 서버 ===
app = FastMCP("pullim-team")


def _get_client():
    """Anthropic 클라이언트 생성. API 키 없으면 에러."""
    if anthropic is None:
        raise RuntimeError("anthropic 패키지가 설치되지 않았습니다: pip install anthropic")
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError(
            "ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다. "
            "export ANTHROPIC_API_KEY='your-key' 실행 후 재시도."
        )
    return anthropic.Anthropic(api_key=api_key)


def _load_role(role_id: str) -> dict:
    """역할 YAML 로드."""
    role_id = role_id.strip().lower()
    if role_id not in ALL_ROLES:
        raise ValueError(f"잘못된 역할: {role_id}. 팀원: {', '.join(VALID_ROLES)} / 비서: cos")
    path = ROLES_DIR / f"{role_id}.yaml"
    with open(path, encoding="utf-8") as f:
        return yaml.safe_load(f)


def _build_system_prompt(role: dict, mode: str = "dispatch") -> str:
    """역할 YAML → 시스템 프롬프트 조립."""
    expertise_lines = "\n".join(f"- {e}" for e in role.get("expertise", []))
    attitude_lines = "\n".join(f"- {a}" for a in role.get("attitude", []))
    criteria_lines = "\n".join(f"- {c}" for c in role.get("decision_criteria", []))

    prompt = f"""# {role['title']}
도메인: {role['domain']}

## 전문성
{expertise_lines}

## 업무 태도
{attitude_lines}

## 판단 기준
{criteria_lines}

{PRODUCT_CONTEXT}
{DEBATE_PROTOCOL}
"""
    if mode == "consult":
        prompt += (
            "\n## 모드: 자문\n"
            "자문 요청에 대해 전문가 의견을 제시한다. "
            "파일 수정이나 실행 지시는 하지 않는다. "
            "의견이 다르면 반드시 근거와 함께 반박한다.\n"
        )
    elif mode == "meeting":
        prompt += (
            "\n## 모드: 회의\n"
            "팀 회의 참석 중이다. 다른 역할의 의견에 동의/반박을 명확히 하라. "
            "자기 전문 영역에서 놓치고 있는 포인트를 지적하라. "
            "2-3문단 이내로 핵심만. 마무리는 실행 가능한 행동 1-3개.\n"
        )

    # 한국어 출력 강제
    prompt += "\n반드시 한국어로 답변한다.\n"
    return prompt


def _call_llm(system: str, user_msg: str, max_tokens: int = 4096) -> str:
    """Claude API 호출."""
    client = _get_client()
    response = client.messages.create(
        model=MODEL,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user_msg}],
    )
    return response.content[0].text


# === 안건 유형 → 첫 발언자 매핑 ===
TOPIC_FIRST_SPEAKER = {
    "cto": ["기술", "구현", "코드", "배포", "아키텍처", "버그", "성능", "인프라"],
    "ai-lead": ["프롬프트", "ai", "파이프라인", "하네스", "질문", "토론", "에이전트"],
    "pm": ["전략", "시장", "경쟁", "로드맵", "인터뷰", "사용자", "가격"],
    "safety": ["안전", "윤리", "위기", "규제", "법", "면책", "개인정보"],
    "cmo": ["마케팅", "유저획득", "그로스", "채널", "브랜딩", "콘텐츠", "SNS"],
    "cfo": ["재정", "예산", "비용", "투자", "BEP", "매출", "런웨이"],
    "data": ["데이터", "기록", "버전", "관리", "인덱스", "정리", "분석"],
}


def _determine_first_speaker(agenda: str) -> str:
    """안건 키워드로 첫 발언자 결정."""
    agenda_lower = agenda.lower()
    for role_id, keywords in TOPIC_FIRST_SPEAKER.items():
        if any(kw in agenda_lower for kw in keywords):
            return role_id
    return "pm"  # 기본: 복합 안건은 PM


# === MCP Tools ===


@app.tool()
def dispatch(role: str, task: str, context: str = "") -> str:
    """특정 역할에게 업무를 지시한다.

    Args:
        role: 역할 ID (cto, ai-lead, pm, safety, cmo, cfo, data)
        task: 수행할 업무 내용
        context: 추가 맥락 (선택)
    """
    role_data = _load_role(role)
    system = _build_system_prompt(role_data, "dispatch")

    user_msg = f"[업무 지시]\n{task}"
    if context:
        user_msg += f"\n\n[맥락]\n{context}"

    result = _call_llm(system, user_msg)
    return f"## [{role_data['title']}] 업무 결과\n\n{result}"


@app.tool()
def consult(role: str, question: str) -> str:
    """특정 역할에게 자문을 요청한다 (읽기 전용, 실행 없음).

    Args:
        role: 역할 ID (cto, ai-lead, pm, safety, cmo, cfo, data)
        question: 자문 내용
    """
    role_data = _load_role(role)
    system = _build_system_prompt(role_data, "consult")

    result = _call_llm(system, f"[자문 요청]\n{question}", max_tokens=2048)
    return f"## [{role_data['title']} — 자문]\n\n{result}"


@app.tool()
def meeting(agenda: str, participants: str = "all", max_rounds: int = 2) -> str:
    """안건에 대해 팀 회의를 진행한다. 수평 토론 + 자연스러운 반박.

    Args:
        agenda: 회의 안건
        participants: 참석자 (쉼표 구분 역할 ID, 또는 'all'). 예: 'cto,ai-lead,safety'
        max_rounds: 최대 라운드 수 (기본 2, 최대 4)
    """
    max_rounds = min(max_rounds, 4)

    # 참석자 파싱
    if participants.strip().lower() == "all":
        roles = list(VALID_ROLES)
    else:
        roles = [r.strip().lower() for r in participants.split(",")]
        for r in roles:
            if r not in VALID_ROLES:
                return f"오류: 잘못된 역할 '{r}'. 가능: {', '.join(VALID_ROLES)}"

    # 첫 발언자 결정 + 순서 재배치
    first = _determine_first_speaker(agenda)
    if first in roles:
        roles.remove(first)
        roles.insert(0, first)

    output = f"# 팀 회의\n\n**안건**: {agenda}\n**참석**: {', '.join(r.upper() for r in roles)}\n**첫 발언**: {first.upper()}\n\n---\n\n"

    previous_opinions: dict[str, str] = {}

    for round_num in range(1, max_rounds + 1):
        output += f"## 라운드 {round_num}\n\n"

        for role_id in roles:
            role_data = _load_role(role_id)
            system = _build_system_prompt(role_data, "meeting")

            if round_num == 1:
                user_msg = (
                    f"[회의 안건]\n{agenda}\n\n"
                    f"당신은 {role_data['title']}로서 이 안건에 의견을 제시한다. "
                    f"당신의 전문 영역 관점에서 핵심 포인트를 짚어라."
                )
            else:
                prev_lines = []
                for other_id, opinion in previous_opinions.items():
                    if other_id != role_id:
                        other_title = _load_role(other_id)["title"]
                        # 의견을 300자로 요약해서 전달 (토큰 절약)
                        summary = opinion[:300] + ("..." if len(opinion) > 300 else "")
                        prev_lines.append(f"**{other_title}**: {summary}")

                prev_text = "\n\n".join(prev_lines)
                user_msg = (
                    f"[회의 안건]\n{agenda}\n\n"
                    f"[이전 발언]\n{prev_text}\n\n"
                    f"다른 참석자들의 의견을 보고 반응하라. "
                    f"동의하면 근거와 함께, 반박하면 '동의하지 않는다. 이유:'로 시작. "
                    f"자기 영역에서 놓친 포인트가 있으면 추가하라."
                )

            opinion = _call_llm(system, user_msg, max_tokens=2048)
            previous_opinions[role_id] = opinion
            output += f"### {role_data['title']}\n\n{opinion}\n\n---\n\n"

    # 종합 정리 (별도 LLM 호출)
    synthesis_prompt = (
        "아래 회의 내용을 종합하라.\n\n"
        "형식:\n"
        "## 합의사항\n- (전원 동의한 것)\n\n"
        "## 쟁점 (미합의)\n- (의견이 갈린 것 + 각 입장 요약)\n\n"
        "## CEO 판단 필요\n- (팀이 결정할 수 없는 것)\n\n"
        "## 추천 다음 행동\n- (1-3개)\n\n"
        f"회의 내용:\n{output}"
    )
    synthesis = _call_llm(
        "당신은 회의 정리 담당이다. 객관적으로 종합하라. 한국어로 답변.",
        synthesis_prompt,
        max_tokens=2048,
    )
    output += f"## 종합\n\n{synthesis}"

    return output


@app.tool()
def briefing() -> str:
    """전체 팀 현황 브리핑. team_state.yaml + 세션_맥락.md 기반."""
    result = "# 팀 브리핑\n\n"

    # team_state.yaml 읽기
    try:
        with open(TEAM_STATE_PATH, encoding="utf-8") as f:
            state = yaml.safe_load(f)

        team = state.get("team", {})
        result += f"**Phase**: {team.get('phase', 'N/A')}\n"
        result += f"**Stage**: {team.get('stage', 'N/A')}\n"
        result += f"**제품 버전**: {team.get('product_version', 'N/A')}\n\n"

        # 팀원 현황
        result += "## 팀원 현황\n\n"
        for member in state.get("members", []):
            status = member.get("status", "unknown")
            if status == "active":
                result += f"- **{member['role']}**: {member.get('current_task', 'N/A')}\n"
            elif status == "standby":
                result += f"- ~~{member['role']}~~ (대기 — {member.get('trigger', 'N/A')})\n"

        # Sprint
        sprint = state.get("current_sprint", {})
        result += f"\n## Sprint\n**{sprint.get('name', 'N/A')}**\n\n"

        for goal in sprint.get("goals", []):
            result += f"- {goal}\n"

        # 블로커
        blockers = sprint.get("blockers", [])
        if blockers:
            result += "\n## 블로커\n"
            for b in blockers:
                result += f"- {b}\n"

        # 대기 중 결정
        pending = state.get("decisions_pending", [])
        if pending:
            result += "\n## 대기 중 결정\n"
            for p in pending:
                result += f"- {p}\n"

    except FileNotFoundError:
        result += "team_state.yaml 파일을 찾을 수 없습니다.\n"
    except Exception as e:
        result += f"team_state.yaml 읽기 실패: {e}\n"

    return result


@app.tool()
def roles() -> str:
    """등록된 모든 역할과 전문 영역을 보여준다."""
    result = "# 풀림 팀 역할\n\n"
    result += "| ID | Title | Domain |\n|---|---|---|\n"

    for role_id in VALID_ROLES:
        try:
            role = _load_role(role_id)
            result += f"| `{role_id}` | {role['title']} | {role['domain']} |\n"
        except Exception:
            result += f"| `{role_id}` | (로드 실패) | - |\n"

    result += (
        "\n## 사용법\n"
        "- `dispatch(role, task)` — 업무 지시\n"
        "- `consult(role, question)` — 자문 요청\n"
        "- `meeting(agenda, participants)` — 팀 회의\n"
        "- `briefing()` — 현황 브리핑\n"
    )
    return result



if __name__ == "__main__":
    app.run()
