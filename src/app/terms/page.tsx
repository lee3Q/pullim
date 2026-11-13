export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] px-6 py-12 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">이용약관</h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">시행일: 2026년 3월 28일</p>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="text-lg font-semibold mb-2">제1조 (목적)</h2>
          <p>이 약관은 풀림(이하 &quot;서비스&quot;)의 이용 조건과 절차, 이용자와 서비스 제공자의 권리 및 의무를 규정합니다.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">제2조 (서비스의 정의)</h2>
          <p>풀림은 AI 기반 자기이해 코칭 서비스입니다. 풀림은 의료 행위, 심리 상담, 정신건강 치료를 제공하지 않으며, 전문 의료인의 진단이나 치료를 대체할 수 없습니다.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">제3조 (이용자의 의무)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>서비스를 본래 목적에 맞게 이용해야 합니다.</li>
            <li>타인의 정보를 도용하거나 서비스를 악용해서는 안 됩니다.</li>
            <li>긴급한 위기 상황에서는 반드시 전문기관에 연락해야 합니다.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">제4조 (서비스 제공자의 의무)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>안정적인 서비스 제공을 위해 노력합니다.</li>
            <li>이용자의 개인정보를 관련 법령에 따라 보호합니다.</li>
            <li>위기 상황 감지 시 즉시 전문기관 정보를 안내합니다.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">제5조 (면책 사항)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>풀림의 AI 응답은 참고용이며, 전문적인 의료 조언이 아닙니다.</li>
            <li>AI의 응답을 근거로 한 의사결정에 대해 서비스 제공자는 책임을 지지 않습니다.</li>
            <li>서비스는 AI 기술의 특성상 부정확하거나 부적절한 응답을 생성할 수 있습니다.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">제6조 (위기 상황 대응)</h2>
          <p>풀림은 자해, 자살 등 위기 상황을 감지할 경우 즉시 대화를 중단하고 다음 전문기관을 안내합니다.</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>자살예방상담전화: 109 (24시간)</li>
            <li>정신건강위기상담전화: 1577-0199 (24시간)</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">제7조 (서비스의 변경 및 중단)</h2>
          <p>서비스 제공자는 운영상 필요한 경우 서비스의 내용을 변경하거나 중단할 수 있으며, 사전 고지를 원칙으로 합니다.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">제8조 (약관의 변경)</h2>
          <p>본 약관은 관련 법령의 변경이나 서비스 정책 변경 시 수정될 수 있으며, 변경 시 서비스 내 공지합니다.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">제9조 (연락처)</h2>
          <p>서비스 관련 문의: 이상규 (풀림 대표)</p>
          <p>이메일: pullim.app@gmail.com</p>
        </div>
      </section>

      <footer className="mt-12 pt-6 border-t border-[var(--text-secondary)]/20 text-xs text-[var(--text-secondary)]">
        <p>본 약관은 2026년 3월 28일부터 시행됩니다.</p>
      </footer>
    </main>
  );
}
