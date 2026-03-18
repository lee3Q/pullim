"use client";

import { DecisionRecord as DecisionRecordType } from "@/lib/types";

interface Props {
  record: DecisionRecordType;
}

export default function DecisionRecord({ record }: Props) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          의사결정 정리 문서
        </h1>
        <p className="text-sm text-gray-500">풀림이 함께 정리한 결과입니다</p>
      </div>

      <div className="space-y-6">
        {/* Problem */}
        <Section title="문제 정의" icon="?">
          <p className="text-gray-700">{record.problem}</p>
        </Section>

        {/* Context */}
        <Section title="맥락" icon="i">
          <p className="text-gray-700">{record.context}</p>
        </Section>

        {/* Options */}
        <Section title="선택지" icon="#">
          <div className="space-y-3">
            {record.options.map((opt, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-medium text-gray-900 mb-1">{opt.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{opt.description}</p>
                <div className="flex gap-4 text-xs">
                  <div>
                    <span className="text-green-600 font-medium">장점: </span>
                    {opt.pros.join(", ")}
                  </div>
                  <div>
                    <span className="text-red-500 font-medium">단점: </span>
                    {opt.cons.join(", ")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Risks */}
        <Section title="리스크" icon="!">
          <ul className="space-y-1">
            {record.risks.map((risk, i) => (
              <li key={i} className="text-gray-700 text-sm flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">*</span>
                {risk}
              </li>
            ))}
          </ul>
        </Section>

        {/* Decision */}
        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-violet-900 mb-2">결정</h3>
          <p className="text-violet-800 font-medium mb-3">{record.decision}</p>
          <p className="text-sm text-violet-700">{record.rationale}</p>
        </div>

        {/* First Action */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-green-900 mb-2">첫 행동</h3>
          <p className="text-green-800 font-medium">{record.first_action}</p>
          <p className="text-sm text-green-600 mt-2">
            리뷰 예정: {record.review_date}
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold">
          {icon}
        </span>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}
