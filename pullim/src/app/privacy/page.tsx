export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#12101a] text-white/80 px-6 py-12 max-w-2xl mx-auto">
      <h1 className="text-2xl text-white font-bold mb-8">개인정보 처리 안내</h1>
      <p className="text-sm text-white/65 mb-6">
        이 안내는 공개 코드에 구현된 데이터 처리 경로를 설명합니다. 실제 저장과
        전송 여부는 운영 환경의 설정과 사용하는 기능에 따라 달라집니다.
        운영 중인 서버의 설정이나 외부 서비스의 보관 정책을 확인한 안내는 아닙니다.
      </p>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="text-lg text-white font-semibold mb-2">1. 기기에 저장되는 정보</h2>
          <p>
            브라우저의 localStorage에는 임의로 생성한 사용자 ID, 선택 결과,
            프로필, 행동 기록과 설정 등이 저장될 수 있습니다. 이 ID는 같은
            브라우저의 기록을 연결하는 데 쓰이며, 익명화를 보장하지 않습니다.
            입력한 이름이나 연락처 등도 자동으로 제거된다고 보장하지 않습니다.
          </p>
        </div>

        <div>
          <h2 className="text-lg text-white font-semibold mb-2">2. 서버로 전송되거나 저장되는 정보</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Supabase가 설정되어 있으면 로그인하지 않아도 사용자 ID와 함께
              선택 결과, 프로필, 세션 횟수와 만족도 등이 전송되어 저장될 수 있습니다.
            </li>
            <li>
              로그인한 사용자의 세션 저장 경로는 계정 ID, 세션 ID, 대화 요약,
              메시지 수, 진행 횟수, 테마와 생성 시각 등을 전송합니다.
            </li>
            <li>
              의견을 제출하면 성격 유형, 평점, 작성 내용과 브라우저 정보
              (user-agent)가 Supabase로 전송될 수 있습니다.
            </li>
            <li>
              회원가입과 로그인에는 Supabase 인증이 사용되며, 입력한 이메일과
              비밀번호가 해당 인증 서비스로 전송됩니다.
            </li>
            <li>
              AI 기능에 필요한 대화 내용, 고민, 요약, 프로필이나 행동 신호 등이
              서버로 전송될 수 있습니다. 전송 전에 모든 개인정보를 익명화하는
              처리는 보장되지 않습니다.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg text-white font-semibold mb-2">3. AI 및 외부 서비스 처리</h2>
          <p>
            AI 응답 생성, 분석과 관련 자료 검색을 위해 다음 서비스가 사용될 수
            있습니다. 모든 서비스가 항상 사용되는 것은 아닙니다.
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Anthropic (Claude), Google (Gemini), OpenAI: 대화와 분석 요청 처리</li>
            <li>설정된 GLM 호환 API: 대화와 분석 요청 처리</li>
            <li>Perplexity: 고민과 요약 등을 바탕으로 관련 자료 검색</li>
            <li>
              설정된 로컬 LLM 서버: 대화와 분석 요청 처리. 이 서버는 사용자의
              기기와 다를 수 있으며, 연결 주소는 HTTP일 수도 있습니다.
            </li>
            <li>Supabase: 인증, 선택 결과, 프로필, 세션 정보와 의견 저장</li>
            <li>설정된 Redis 서비스: 아래의 세션 안전 상태 저장</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg text-white font-semibold mb-2">4. 세션 안전 상태와 쿠키</h2>
          <p>
            안전 확인과 진행 단계 관리를 위해 세션 ID를 담은 서명된 쿠키가
            사용됩니다. 서버에는 세션 ID, 진행 단계, 위험 상태, 동의 상태,
            입력 및 제안의 해시값과 처리 이벤트 등이 저장됩니다. 이 안전 상태는
            원문 대화록과는 다릅니다. 개발 모드에서는 서버 메모리를 사용하고,
            프로덕션 모드에서는 설정된 Redis에 저장합니다.
          </p>
          <p className="mt-2">
            코드상 쿠키 유효기간과 Redis 저장 시 만료 시간은 24시간입니다.
            Redis 상태를 다시 저장하면 만료 시간이 갱신되므로 최초 이용 후
            24시간 내 모든 데이터가 삭제된다는 뜻은 아닙니다.
          </p>
        </div>

        <div>
          <h2 className="text-lg text-white font-semibold mb-2">5. 보관과 삭제의 범위</h2>
          <p>
            브라우저 설정에서 이 사이트의 저장 데이터를 지우면 해당 브라우저의
            로컬 기록을 제거할 수 있습니다. 이 작업으로 서버나 AI 제공사에
            이미 전송된 정보까지 삭제되지는 않습니다.
          </p>
          <p className="mt-2">
            Supabase와 AI 제공사의 실제 보관 기간, 서버 기록의 삭제 절차 및
            백업 처리는 이 코드만으로 확인할 수 없습니다. 운영자의 확인이
            필요하며, 이 안내는 자동 삭제나 서비스 종료 시 파기를 약속하지 않습니다.
            민감한 정보를 입력하기 전에 아래 연락처로 처리 범위를 확인하세요.
          </p>
        </div>

        <div>
          <h2 className="text-lg text-white font-semibold mb-2">6. 위기 상황 안내</h2>
          <p>풀림은 의료 서비스가 아닌 자기이해 코칭 도구입니다. 위기 상황 감지 시 즉시 전문기관을 안내합니다.</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>자살예방상담전화: 109</li>
            <li>정신건강위기상담전화: 1577-0199</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg text-white font-semibold mb-2">7. 연락처</h2>
          <p>개인정보 관련 문의: 이상규 (풀림 대표)</p>
          <p>이메일: pullim.app@gmail.com</p>
        </div>
      </section>
    </main>
  );
}
