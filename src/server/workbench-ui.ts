export function renderWorkbenchHtml(initialTab: "unravel" | "ladder" | "journal" = "unravel"): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>풀림 (Pullim) — 오픈소스 사고 구조화 & 소크라테스 의사결정 워크벤치</title>
  <meta name="description" content="막연한 고민을 사실과 가정으로 분리하고, 양방향 5단계 인지 사다리와 If-Then 실행 약속으로 풀어내는 로컬 우선 오픈소스 도구" />
  <style>
    :root {
      --bg: #0f1117;
      --surface: #171a24;
      --surface-2: #1f2433;
      --border: #2c3347;
      --text: #eef1f8;
      --muted: #9aa4bf;
      --accent: #7c9cff;
      --accent-soft: rgba(124, 156, 255, 0.14);
      --green: #3ddc97;
      --amber: #f7b955;
      --danger: #ff6b7b;
    }
    [data-theme="light"] {
      --bg: #f7f8fb;
      --surface: #ffffff;
      --surface-2: #f0f3f9;
      --border: #dce2ee;
      --text: #161922;
      --muted: #5a647d;
      --accent: #3b63eb;
      --accent-soft: rgba(59, 99, 235, 0.1);
      --green: #15803d;
      --amber: #b45309;
      --danger: #dc2626;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
      line-height: 1.6;
    }
    .container {
      max-width: 1020px;
      margin: 0 auto;
      padding: 24px 20px 64px;
    }
    header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding-bottom: 18px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 22px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand h1 {
      font-size: 1.35rem;
      margin: 0;
      letter-spacing: -0.02em;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      background: var(--accent-soft);
      color: var(--accent);
      border: 1px solid var(--border);
    }
    .nav-tabs {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    button {
      font: inherit;
      cursor: pointer;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text);
      padding: 8px 14px;
      transition: all 0.15s ease;
    }
    button:hover {
      border-color: var(--accent);
    }
    button.primary {
      background: var(--accent);
      color: #fff;
      border-color: var(--accent);
      font-weight: 600;
    }
    button.active-tab {
      background: var(--accent-soft);
      border-color: var(--accent);
      color: var(--accent);
      font-weight: 600;
    }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 20px;
      margin-bottom: 16px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
      gap: 14px;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 14px;
    }
    textarea, input, select {
      width: 100%;
      font: inherit;
      color: var(--text);
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 12px;
    }
    textarea {
      min-height: 104px;
      resize: vertical;
    }
    .chip-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 10px 0 14px;
    }
    .chip {
      font-size: 0.82rem;
      padding: 5px 11px;
      border-radius: 999px;
      background: var(--surface-2);
    }
    .option-card {
      display: block;
      width: 100%;
      text-align: left;
      padding: 14px 16px;
      margin-bottom: 10px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 12px;
    }
    .option-card.recommended {
      border-color: var(--accent);
      background: var(--accent-soft);
    }
    .rec-pill {
      display: inline-block;
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--accent);
      margin-left: 6px;
    }
    .muted { color: var(--muted); font-size: 0.9rem; }
    .crisis-box {
      border: 2px solid var(--danger);
      background: rgba(255, 107, 123, 0.12);
      border-radius: 14px;
      padding: 18px;
      margin-bottom: 16px;
    }
    .dim-bar {
      height: 8px;
      background: var(--surface-2);
      border-radius: 999px;
      overflow: hidden;
      margin: 6px 0 12px;
    }
    .dim-fill {
      height: 100%;
      background: var(--accent);
    }
    .hidden { display: none !important; }
    footer {
      margin-top: 40px;
      padding-top: 18px;
      border-top: 1px solid var(--border);
      font-size: 0.82rem;
      color: var(--muted);
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <h1>🌿 풀림 (Pullim)</h1>
        <span class="badge">Open-Source MIT · Local-First · Ad-Free</span>
      </div>
      <div class="nav-tabs" role="tablist">
        <button id="tab-btn-unravel" onclick="switchTab('unravel')">1. 빠른 풀림 워크벤치</button>
        <button id="tab-btn-ladder" onclick="switchTab('ladder')">2. 양방향 5단계 사다리</button>
        <button id="tab-btn-journal" onclick="switchTab('journal')">3. 결정 저널 & 자기이해</button>
        <button onclick="toggleSettings()">⚙ AI 엔진 (오프라인/BYOK)</button>
        <button onclick="toggleTheme()" aria-label="테마 전환">🌓</button>
      </div>
    </header>

    <!-- AI Engine / BYOK Settings Drawer -->
    <section id="settings-drawer" class="card hidden" aria-label="AI 엔진 설정">
      <h3 style="margin-top:0">오픈소스 AI 엔진 설정 (기본값: 내장 소크라테스 엔진 — API 키 불필요)</h3>
      <p class="muted">기본 내장 엔진만으로도 사실/가정 분리, 인지 함정 탐지, 3가지 시선, 양방향 사다리가 100% 오프라인 작동합니다. 원할 경우 로컬 Ollama 또는 개인 API 키(브라우저에만 저장)를 연결할 수 있습니다.</p>
      <div class="grid-3">
        <div>
          <label class="muted">프로바이더</label>
          <select id="cfg-provider">
            <option value="builtin">내장 소크라테스 엔진 (무료·오프라인)</option>
            <option value="ollama">로컬 Ollama (http://127.0.0.1:11434)</option>
            <option value="openai">OpenAI API (BYOK)</option>
            <option value="anthropic">Anthropic Claude API (BYOK)</option>
            <option value="gemini">Google Gemini API (BYOK)</option>
          </select>
        </div>
        <div>
          <label class="muted">모델명 (선택)</label>
          <input id="cfg-model" placeholder="예: llama3.2, gpt-4o-mini, claude-3-5-sonnet-latest" />
        </div>
        <div>
          <label class="muted">API Key 또는 Ollama URL (로컬 저장)</label>
          <input id="cfg-key" type="password" placeholder="브라우저 localStorage에만 보관됩니다" />
        </div>
      </div>
      <div style="margin-top:12px">
        <button class="primary" onclick="saveEngineConfig()">설정 저장</button>
      </div>
    </section>

    <!-- Crisis Alert Area -->
    <div id="crisis-banner" class="crisis-box hidden" role="alert"></div>

    <!-- TAB 1: Quick Unravel Workbench -->
    <main id="panel-unravel">
      <div class="card">
        <h2 style="margin-top:0">무엇이 머릿속을 복잡하게 만들고 있나요?</h2>
        <p class="muted">완벽하게 정리된 문장이 아니어도 됩니다. 한 줄로 적거나 아래 예시를 눌러 바로 분해해 보세요.</p>
        <div class="chip-row">
          <button class="chip" onclick="fillSample('내 레포를 어떻게 해야 사람들이 쓸만한 오픈소스로 변화시킬지 고민이야. 머리로는 다 아는데 기존에 만든 것들이 아까워서 갈아엎기가 망설여져.')">🧩 오픈소스/프로젝트 전면 개편</button>
          <button class="chip" onclick="fillSample('이직 제안을 받았는데 조건은 좋지만 지금 익숙한 팀을 떠나 새 환경에 적응할 생각에 불안해서 결정을 못 내리고 있어.')">💼 커리어/이직 갈림길</button>
          <button class="chip" onclick="fillSample('해야 할 일과 진행 중인 프로젝트가 너무 많아서 이도 저도 아니게 다 망할까 봐 조급해.')">⚡ 과부하/번아웃 정리</button>
          <button class="chip" onclick="fillSample('가까운 사람과 자꾸 같은 문제로 부딪히는데 내가 말하면 분명 나를 서운해하거나 싫어할 것 같아 참고만 있어.')">🤝 관계와 경계 설정</button>
        </div>
        <textarea id="concern-input" placeholder="여기에 고민이나 막막한 생각을 자유롭게 적어주세요..."></textarea>
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-top:12px;">
          <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
            <span class="muted">우선 시선 렌즈:</span>
            <select id="lens-select" style="width:auto">
              <option value="structural">📐 구조·논리 시선 (사실/가정 분리 & 가역성)</option>
              <option value="grounding">🌿 공감·수용 시선 (감정 무게 덜기 & 에너지 보호)</option>
              <option value="exploratory">🧭 직관·전환 시선 (프레임 뒤집기 & 최소 실험)</option>
            </select>
          </div>
          <div style="display:flex; gap:8px;">
            <button onclick="startLadderFromConcern('up')">🪜 감각 사다리(L1)부터 시작</button>
            <button class="primary" onclick="runUnravel()">✦ 지금 바로 구조화 풀림</button>
          </div>
        </div>
      </div>

      <div id="unravel-output" class="hidden"></div>
    </main>

    <!-- TAB 2: Bidirectional 5-Level Cognitive Ladder -->
    <section id="panel-ladder" class="hidden">
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div>
            <h2 style="margin:0">🪜 양방향 5단계 인지 사다리</h2>
            <p class="muted" style="margin:4px 0 0">막막할 땐 감각(L1)에서 위로 올라가고, 머리로만 과잉분석했을 땐 논리(L5)에서 감각(L1)으로 내려갑니다.</p>
          </div>
          <div style="display:flex; gap:8px;">
            <button onclick="initLadder('up')">🔼 올라가기 (L1 감각 → L5 통찰)</button>
            <button onclick="initLadder('down')">🔽 내려가기 (L5 논리 → L1 감각)</button>
          </div>
        </div>
      </div>
      <div id="ladder-stage"></div>
    </section>

    <!-- TAB 3: Local Decision Journal & Self-Portrait -->
    <section id="panel-journal" class="hidden">
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div>
            <h2 style="margin:0">📓 로컬 의사결정 저널 & 입체적 자기이해</h2>
            <p class="muted" style="margin:4px 0 0">모든 기록은 계정 없이 이 브라우저(localStorage)에 안전하게 저장되며, 언제든 JSON/Markdown으로 내보내거나 복원할 수 있습니다.</p>
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button onclick="exportJsonBundle()">⬇ JSON 백업 내려받기</button>
            <button onclick="exportMarkdownJournal()">📝 Markdown 저널 내려받기</button>
            <button onclick="document.getElementById('import-file').click()">⬆ JSON 백업 불러오기(복원)</button>
            <input id="import-file" type="file" accept="application/json" class="hidden" onchange="importJsonBundle(event)" />
          </div>
        </div>
        <p id="journal-status" class="muted" style="margin-top:8px;"></p>
      </div>

      <div class="grid-2">
        <div class="card">
          <h3 style="margin-top:0">✅ 확정 행동 (Confirmed Actions)</h3>
          <div id="journal-actions"></div>
        </div>
        <div class="card">
          <h3 style="margin-top:0">🤝 If-Then 작은 약속 (Implementation Intentions)</h3>
          <div id="journal-promises"></div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <h3 style="margin-top:0">✦ 명예의 전당 — 내 언어의 핵심 통찰</h3>
          <div id="journal-insights"></div>
        </div>
        <div class="card">
          <h3 style="margin-top:0">📊 입체적 자기이해 확률 분포 (Probabilistic Self-Portrait)</h3>
          <p class="muted">고정된 MBTI 라벨 대신, 선택마다 관찰된 연속 분포를 기록합니다.</p>
          <div id="journal-profile"></div>
        </div>
      </div>
    </section>

    <footer>
      <div>
        <strong>Pullim (풀림)</strong> · MIT License · AI는 인간의 판단을 대체하지 않으며(Augment Only) 전문 의료/상담을 대신하지 않습니다.
      </div>
      <div>
        위기 시 24시간 상담: <strong>109</strong> (자살예방) · <strong>1577-0199</strong> (정신건강) · <a href="/privacy" style="color:var(--accent)">개인정보 및 로컬 저장 안내</a>
      </div>
    </footer>
  </div>

  <script>
    const ACTION_KEY = "pullim_action_history_v1";
    const PROMISE_KEY = "pullim_promises";
    const INSIGHT_KEY = "pullim_hall_of_insights_v1";
    const PROFILE_KEY = "pullim_user_profile";
    const ENGINE_CFG_KEY = "pullim_engine_config_v1";

    let currentUnravel = null;
    let currentLadder = null;

    function toggleTheme() {
      const html = document.documentElement;
      html.dataset.theme = html.dataset.theme === "light" ? "dark" : "light";
    }

    function toggleSettings() {
      document.getElementById("settings-drawer").classList.toggle("hidden");
    }

    function saveEngineConfig() {
      const cfg = {
        provider: document.getElementById("cfg-provider").value,
        model: document.getElementById("cfg-model").value.trim(),
        apiKey: document.getElementById("cfg-key").value.trim()
      };
      localStorage.setItem(ENGINE_CFG_KEY, JSON.stringify(cfg));
      document.getElementById("settings-drawer").classList.add("hidden");
    }

    function loadEngineConfig() {
      try {
        const raw = localStorage.getItem(ENGINE_CFG_KEY);
        if (!raw) return { provider: "builtin" };
        return JSON.parse(raw);
      } catch {
        return { provider: "builtin" };
      }
    }

    function switchTab(tab) {
      for (const id of ["unravel", "ladder", "journal"]) {
        document.getElementById("panel-" + id).classList.toggle("hidden", id !== tab);
        document.getElementById("tab-btn-" + id).classList.toggle("active-tab", id === tab);
      }
      if (tab === "ladder" && !currentLadder) {
        initLadder("up");
      }
      if (tab === "journal") {
        renderJournal();
      }
    }

    function fillSample(text) {
      document.getElementById("concern-input").value = text;
      runUnravel();
    }

    function showCrisisBanner(crisisResponse) {
      const banner = document.getElementById("crisis-banner");
      if (!crisisResponse) {
        banner.classList.add("hidden");
        return;
      }
      const hotlines = (crisisResponse.hotlines || [])
        .map(h => "<li><strong>" + h.name + " (" + h.number + ")</strong> — " + h.description + "</li>")
        .join("");
      banner.innerHTML =
        "<h3 style='margin-top:0'>⚠️ 안전과 보호가 가장 먼저입니다</h3>" +
        "<p>" + crisisResponse.userMessage + "</p>" +
        "<ul>" + hotlines + "</ul>";
      banner.classList.remove("hidden");
    }

    async function runUnravel() {
      const concern = document.getElementById("concern-input").value.trim() ||
        "내 레포를 어떻게 해야 사람들이 쓸만한 오픈소스로 변화시킬지 고민이야. 기존에 만든 것들이 아까워서 싹 갈아엎기가 망설여져.";
      const lens = document.getElementById("lens-select").value;
      const config = loadEngineConfig();

      const res = await fetch("/api/unravel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concern, lens, config })
      });
      const data = await res.json();
      currentUnravel = data;
      showCrisisBanner(data.result.crisisResponse);
      renderUnravelResult(data);
    }

    function renderUnravelResult(data) {
      const r = data.result;
      const out = document.getElementById("unravel-output");
      out.classList.remove("hidden");

      if (r.haltedByCrisis) {
        out.innerHTML = "";
        return;
      }

      const factsHtml = r.facts.map(f => "<li><strong>[사실]</strong> " + f + "</li>").join("");
      const assumptionsHtml = r.assumptions.map(a =>
        "<li style='margin-bottom:8px'><strong>[가정]</strong> " + a.statement +
        "<div class='muted'>↳ 점검 질문: " + a.checkQuestion + "</div></li>"
      ).join("");
      const trapsHtml = r.cognitiveTraps.map(t =>
        "<div style='margin-bottom:10px'><strong>• " + t.name + "</strong>: " + t.evidence +
        "<div class='muted'>↳ 전환 질문: " + t.reframeQuestion + "</div></div>"
      ).join("");
      const lensesHtml = r.lenses.map(l =>
        "<div class='card' style='margin-bottom:0'>" +
        "<div class='badge'>" + l.badge + "</div>" +
        "<h4 style='margin:10px 0 6px'>" + l.title + "</h4>" +
        "<p class='muted'>" + l.summary + "</p>" +
        "<p style='font-size:0.92rem'><strong>소크라테스 질문:</strong> " + l.socraticQuestion + "</p>" +
        "</div>"
      ).join("");
      const optionsHtml = r.options.map(o =>
        "<div class='option-card " + (o.recommended ? "recommended" : "") + "'>" +
        "<div><strong>" + o.title + "</strong>" +
        (o.recommended ? "<span class='rec-pill'>✦ 추천 기본값</span>" : "") +
        " <span class='muted'>(" + o.costMinutes + "분 · 가역성 " + o.reversibility + ")</span></div>" +
        "<div class='muted' style='margin:4px 0 10px'>" + o.description + "</div>" +
        "<button onclick=\\"commitActionFromUnravel('" + o.title.replace(/'/g, "") + "')\\">이 실험을 확정 행동으로 저장</button>" +
        "</div>"
      ).join("");

      out.innerHTML =
        (data.aiSynthesisNote ? "<div class='card'><strong>🤖 연결된 LLM 코멘트 (" + data.modelUsed + "):</strong><p>" + data.aiSynthesisNote + "</p></div>" : "") +
        "<div class='card'>" +
          "<div style='display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px;'>" +
            "<span class='badge'>핵심 질문 재정의</span>" +
            "<div style='display:flex; gap:8px;'>" +
              "<button onclick=\\"startLadderFromConcern('" + r.recommendedLadderDirection + "')\\">🪜 권장 사다리(" + (r.recommendedLadderDirection === "down" ? "내려가기 L5→L1" : "올라가기 L1→L5") + ")로 이어가기</button>" +
              "<button onclick='copyMarkdownReport()'>📋 Markdown 리포트 복사</button>" +
            "</div>" +
          "</div>" +
          "<h3 style='margin:10px 0 6px'>" + r.reframedQuestion + "</h3>" +
          "<p class='muted' style='margin:0'>핵심 갈등: " + r.coreTension + "</p>" +
        "</div>" +
        "<div class='grid-2'>" +
          "<div class='card'><h3 style='margin-top:0'>1. 사실(Fact) vs 가정(Assumption) 분리</h3><ul>" + factsHtml + assumptionsHtml + "</ul></div>" +
          "<div class='card'><h3 style='margin-top:0'>2. 포착된 인지적 함정 (Blind Spots)</h3>" + trapsHtml + "</div>" +
        "</div>" +
        "<div class='grid-3' style='margin-bottom:16px'>" + lensesHtml + "</div>" +
        "<div class='grid-2'>" +
          "<div class='card'><h3 style='margin-top:0'>3. 되돌릴 수 있는 작은 실험 선택</h3>" + optionsHtml + "</div>" +
          "<div class='card'>" +
            "<h3 style='margin-top:0'>4. If-Then 실행 약속 & 명예의 전당</h3>" +
            "<label class='muted'>만약 (상황/시점 단서)</label>" +
            "<input id='ifthen-trigger' value=\\"" + r.ifThenPlan.trigger.replace(/"/g, "&quot;") + "\\" style='margin-bottom:8px' />" +
            "<label class='muted'>그때 할 10분 행동</label>" +
            "<input id='ifthen-action' value=\\"" + r.ifThenPlan.action.replace(/"/g, "&quot;") + "\\" style='margin-bottom:10px' />" +
            "<button class='primary' onclick='saveIfThenPromise()'>🤝 If-Then 약속 저장하기</button>" +
            "<hr style='border-color:var(--border); margin:18px 0' />" +
            "<label class='muted'>✦ 오늘 깨달은 내 언어의 한 문장 (명예의 전당)</label>" +
            "<input id='insight-input' placeholder='예: 결국 내가 두려웠던 건 실패가 아니라 완벽해야 한다는 강박이었다.' style='margin:6px 0 10px' />" +
            "<button onclick='saveBreakthroughInsight()'>✦ 명예의 전당에 통찰 남기기</button>" +
            "<p id='save-feedback' class='muted' style='margin-top:8px'></p>" +
          "</div>" +
        "</div>";
    }

    function commitActionFromUnravel(title) {
      const list = JSON.parse(localStorage.getItem(ACTION_KEY) || "[]");
      const sessionId = "act_" + Date.now();
      const today = new Date().toISOString().slice(0, 10);
      list.push({
        sessionId,
        action: title,
        deadline: today,
        createdAt: new Date().toISOString(),
        status: "pending"
      });
      localStorage.setItem(ACTION_KEY, JSON.stringify(list));
      const fb = document.getElementById("save-feedback");
      if (fb) fb.textContent = "✓ 확정 행동이 로컬 저널에 저장되었습니다.";
    }

    function saveIfThenPromise() {
      const trigger = document.getElementById("ifthen-trigger").value.trim();
      const action = document.getElementById("ifthen-action").value.trim();
      if (!trigger || !action) return;
      const list = JSON.parse(localStorage.getItem(PROMISE_KEY) || "[]");
      list.push({
        id: "promise_" + Date.now(),
        createdAt: Date.now(),
        sessionTheme: document.getElementById("lens-select").value,
        trigger,
        action,
        status: "active"
      });
      localStorage.setItem(PROMISE_KEY, JSON.stringify(list));
      document.getElementById("save-feedback").textContent = "✓ If-Then 약속이 로컬 저널에 저장되었습니다.";
    }

    async function saveBreakthroughInsight() {
      const text = document.getElementById("insight-input").value.trim();
      if (!text) return;
      const list = JSON.parse(localStorage.getItem(INSIGHT_KEY) || "[]");
      list.unshift({
        id: "insight_" + Date.now(),
        createdAt: new Date().toISOString(),
        concernSummary: (currentUnravel?.result?.rawConcern || "").slice(0, 80),
        insightText: text,
        reframedQuestion: currentUnravel?.result?.reframedQuestion || ""
      });
      localStorage.setItem(INSIGHT_KEY, JSON.stringify(list));
      document.getElementById("save-feedback").textContent = "✦ 명예의 전당에 나의 통찰이 기록되었습니다!";
    }

    function copyMarkdownReport() {
      if (!currentUnravel?.markdown) return;
      navigator.clipboard?.writeText(currentUnravel.markdown);
      const fb = document.getElementById("save-feedback");
      if (fb) fb.textContent = "📋 Markdown 리포트가 클립보드에 복사되었습니다.";
    }

    function startLadderFromConcern(direction) {
      switchTab("ladder");
      initLadder(direction);
    }

    async function initLadder(direction) {
      const concern = document.getElementById("concern-input").value.trim() ||
        "머릿속이 복잡하고 여러 생각이 엉켜 있어 어디서부터 풀어야 할지 모르겠어요.";
      const lens = document.getElementById("lens-select").value;
      const res = await fetch("/api/ladder/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concern, direction, lens })
      });
      currentLadder = await res.json();
      renderLadderStage();
    }

    async function stepLadder(action) {
      if (!currentLadder) return;
      const res = await fetch("/api/ladder/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: currentLadder.session, action })
      });
      currentLadder = await res.json();
      localStorage.setItem(PROFILE_KEY, JSON.stringify(currentLadder.session.profile));
      renderLadderStage();
    }

    function renderLadderStage() {
      const s = currentLadder.session;
      const card = currentLadder.stepCard;
      const el = document.getElementById("ladder-stage");

      const levelPills = [1, 2, 3, 4, 5].map(lv =>
        "<button class='" + (s.currentLevel === lv ? "active-tab" : "") + "' onclick='stepLadder({type:\\"jump_level\\",targetLevel:" + lv + "})'>L" + lv + "</button>"
      ).join(" ");

      const optsHtml = card.options.map(o =>
        "<button class='option-card " + (o.recommended ? "recommended" : "") + "' onclick=\\"stepLadder({type:'select_option',optionId:'" + o.id + "',userText:document.getElementById('ladder-free')?.value||''})\\">" +
          "<div><strong>" + o.label + "</strong>" + (o.recommended ? "<span class='rec-pill'>✦ 추천</span>" : "") + "</div>" +
          "<div class='muted'>" + o.subtext + "</div>" +
        "</button>"
      ).join("");

      el.innerHTML =
        "<div class='card'>" +
          "<div style='display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px'>" +
            "<div>" + levelPills + "</div>" +
            "<div style='display:flex; gap:8px; align-items:center'>" +
              "<span class='badge'>" + (s.behindLabel || "💭 [이면사고] 사용자 호흡 관찰 중...") + "</span>" +
              "<button onclick=\\"stepLadder({type:'flip_angle'})\\">🔄 다른 각도로 찔러줘 (Flip)</button>" +
            "</div>" +
          "</div>" +
          (s.latestFacetShift?.detected ? "<div class='card' style='background:var(--accent-soft); border-color:var(--accent)'>" + s.latestFacetShift.message + "</div>" : "") +
          "<h3>" + card.levelName + " — " + card.question + "</h3>" +
          "<p class='muted'>" + card.helperNote + "</p>" +
          "<div>" + optsHtml + "</div>" +
          "<input id='ladder-free' placeholder=\\"" + card.freeTextPlaceholder + "\\" style='margin-top:8px' />" +
        "</div>";
    }

    function renderJournal() {
      const actions = JSON.parse(localStorage.getItem(ACTION_KEY) || "[]");
      const promises = JSON.parse(localStorage.getItem(PROMISE_KEY) || "[]");
      const insights = JSON.parse(localStorage.getItem(INSIGHT_KEY) || "[]");
      const profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null");

      document.getElementById("journal-actions").innerHTML = actions.length === 0
        ? "<p class='muted'>아직 저장된 확정 행동이 없습니다.</p>"
        : actions.map(a =>
            "<div class='option-card'>" +
              "<div><strong>" + a.action + "</strong> <span class='badge'>" + a.status + "</span></div>" +
              "<div class='muted'>기한: " + (a.deadline || "없음") + "</div>" +
              "<div style='margin-top:8px; display:flex; gap:6px'>" +
                "<button onclick=\\"updateActionStatus('" + a.sessionId + "','completed')\\">완료</button>" +
                "<button onclick=\\"updateActionStatus('" + a.sessionId + "','deferred')\\">보류</button>" +
              "</div>" +
            "</div>"
          ).join("");

      document.getElementById("journal-promises").innerHTML = promises.length === 0
        ? "<p class='muted'>아직 저장된 If-Then 약속이 없습니다.</p>"
        : promises.map(p =>
            "<div class='option-card'>" +
              "<div class='muted'>만약: " + p.trigger + "</div>" +
              "<div><strong>→ " + p.action + "</strong> <span class='badge'>" + p.status + "</span></div>" +
              (p.reflection ? "<div class='muted' style='margin-top:4px'>회고: " + p.reflection + "</div>" : "") +
              "<div style='margin-top:8px; display:flex; gap:6px'>" +
                "<button onclick=\\"updatePromiseStatus('" + p.id + "','completed')\\">실행 완료</button>" +
                "<button onclick=\\"updatePromiseStatus('" + p.id + "','skipped')\\">나중에</button>" +
              "</div>" +
            "</div>"
          ).join("");

      document.getElementById("journal-insights").innerHTML = insights.length === 0
        ? "<p class='muted'>아직 등재된 핵심 통찰이 없습니다.</p>"
        : insights.map(i =>
            "<div class='option-card recommended'>" +
              "<div><strong>✦ \\"" + i.insightText + "\\"</strong></div>" +
              "<div class='muted'>" + (i.reframedQuestion || "") + "</div>" +
            "</div>"
          ).join("");

      const dims = [
        ["approachStyle", "구조·분석적 (-1)", "직관·감각적 (+1)"],
        ["riskTolerance", "신중·안정 (-1)", "탐색·도전 (+1)"],
        ["copingStyle", "문제해결 (-1)", "감정·공감 (+1)"],
        ["decisionSpeed", "숙고·유예 (-1)", "즉각 실행 (+1)"]
      ];
      document.getElementById("journal-profile").innerHTML = dims.map(([key, left, right]) => {
        const val = profile?.[key]?.value ?? 0;
        const pct = Math.round(((val + 1) / 2) * 100);
        return "<div><div style='display:flex; justify-content:space-between; font-size:0.82rem'><span>" + left + "</span><span>" + right + "</span></div>" +
          "<div class='dim-bar'><div class='dim-fill' style='width:" + pct + "%'></div></div></div>";
      }).join("");
    }

    function updateActionStatus(sessionId, status) {
      const actions = JSON.parse(localStorage.getItem(ACTION_KEY) || "[]").map(a =>
        a.sessionId === sessionId ? { ...a, status } : a
      );
      localStorage.setItem(ACTION_KEY, JSON.stringify(actions));
      renderJournal();
    }

    function updatePromiseStatus(id, status) {
      const promises = JSON.parse(localStorage.getItem(PROMISE_KEY) || "[]").map(p =>
        p.id === id ? { ...p, status, checkedAt: Date.now() } : p
      );
      localStorage.setItem(PROMISE_KEY, JSON.stringify(promises));
      renderJournal();
    }

    function exportJsonBundle() {
      const bundle = {
        format: "pullim-open-source-bundle-v2",
        exportedAt: new Date().toISOString(),
        actions: JSON.parse(localStorage.getItem(ACTION_KEY) || "[]"),
        promises: JSON.parse(localStorage.getItem(PROMISE_KEY) || "[]"),
        insights: JSON.parse(localStorage.getItem(INSIGHT_KEY) || "[]")
      };
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "pullim-backup.json";
      a.click();
    }

    function exportMarkdownJournal() {
      const actions = JSON.parse(localStorage.getItem(ACTION_KEY) || "[]");
      const promises = JSON.parse(localStorage.getItem(PROMISE_KEY) || "[]");
      const insights = JSON.parse(localStorage.getItem(INSIGHT_KEY) || "[]");
      const md = [
        "# 풀림(Pullim) 로컬 의사결정 저널",
        "",
        "## 확정 행동",
        ...actions.map(a => "- [" + (a.status === "completed" ? "x" : " ") + "] " + a.action),
        "",
        "## If-Then 약속",
        ...promises.map(p => "- [" + (p.status === "completed" ? "x" : " ") + "] 만약 " + p.trigger + " → " + p.action),
        "",
        "## 명예의 전당 (핵심 통찰)",
        ...insights.map(i => "- ✦ " + i.insightText)
      ].join("\\n");
      const blob = new Blob([md], { type: "text/markdown" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "pullim-journal.md";
      a.click();
    }

    async function importJsonBundle(event) {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed.actions)) localStorage.setItem(ACTION_KEY, JSON.stringify(parsed.actions));
        if (Array.isArray(parsed.promises)) localStorage.setItem(PROMISE_KEY, JSON.stringify(parsed.promises));
        if (Array.isArray(parsed.insights)) localStorage.setItem(INSIGHT_KEY, JSON.stringify(parsed.insights));
        document.getElementById("journal-status").textContent = "✓ 백업 파일을 성공적으로 복원했습니다.";
        renderJournal();
      } catch {
        document.getElementById("journal-status").textContent = "⚠️ 백업 파일 형식을 확인해 주세요.";
      }
    }

    switchTab("${initialTab}");
  </script>
</body>
</html>`;
}
