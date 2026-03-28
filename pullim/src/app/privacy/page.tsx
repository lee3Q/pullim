export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] px-6 py-12 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">개인정보처리방침</h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">시행일: 2026년 3월 28일</p>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="text-lg font-semibold mb-2">1. 수집하는 개인정보</h2>
          <p>풀림은 서비스 제공을 위해 최소한의 정보만 수집합니다.</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>심리테스트 선택 결과 (익명, 기기 식별 없음)</li>
            <li>사다리 세션 대화 내용 (로컬 저장, 서버 전송 시 익명화)</li>
            <li>피드백 제출 내용 (자발적 입력)</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">2. 수집 목적</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>AI 기반 자기이해 코칭 서비스 제공</li>
            <li>서비스 품질 개선 및 사용 패턴 분석 (비식별 통계)</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">3. 보유 및 이용 기간</h2>
          <p>세션 데이터는 사용자 기기(localStorage)에 저장되며, 사용자가 직접 삭제할 수 있습니다. 서버에 전송된 익명 데이터는 서비스 종료 시까지 보관 후 파기합니다.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">4. 제3자 제공</h2>
          <p>풀림은 수집된 개인정보를 제3자에게 제공하지 않습니다. 단, 서비스 운영을 위해 다음 제3자에게 데이터가 전송됩니다.</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Anthropic (Claude API) — AI 응답 생성을 위한 대화 내용 전송</li>
            <li>Supabase — 피드백, 세션 통계 등 서비스 데이터 저장 및 관리</li>
            <li>Google (Gemini API) — 이면사고 분석을 위한 보조 AI 처리</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">5. 안전성 확보 조치</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>HTTPS 암호화 통신</li>
            <li>서버 환경변수를 통한 API 키 관리</li>
            <li>민감 데이터 로컬 우선 저장</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">6. 위기 상황 안내</h2>
          <p>풀림은 의료 서비스가 아닌 자기이해 코칭 도구입니다. 위기 상황 감지 시 즉시 전문기관을 안내합니다.</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>자살예방상담전화: 109</li>
            <li>정신건강위기상담전화: 1577-0199</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">7. 이용자의 권리</h2>
          <p>사용자는 언제든지 브라우저 설정에서 localStorage를 삭제하여 모든 로컬 데이터를 제거할 수 있습니다.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">8. 연락처</h2>
          <p>개인정보 관련 문의: 이상규 (풀림 대표)</p>
          <p>이메일: pullim.app@gmail.com</p>
        </div>
      </section>

      <footer className="mt-12 pt-6 border-t border-[var(--text-secondary)]/20 text-xs text-[var(--text-secondary)]">
        <p>본 방침은 2026년 3월 28일부터 시행됩니다.</p>
      </footer>
    </main>
  );
}
