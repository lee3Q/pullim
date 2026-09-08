import { describe, it, expect } from "vitest";
import { detectCrisis, HOTLINES, type CrisisTier } from "@/lib/safety/crisis-detector";

describe("detectCrisis", () => {
  // Tier A — 직접 위기 표현
  describe("Tier A (RED)", () => {
    it("자살 직접 표현을 감지한다", () => {
      const result = detectCrisis("요즘 자살하고 싶어");
      expect(result.tier).toBe("A");
      expect(result.response?.shouldHalt).toBe(true);
    });

    it("죽고 싶다 표현을 감지한다", () => {
      const result = detectCrisis("정말 죽고 싶다");
      expect(result.tier).toBe("A");
    });

    it("자해 표현을 감지한다", () => {
      const result = detectCrisis("자해를 했어");
      expect(result.tier).toBe("A");
    });

    it("소멸 욕구를 감지한다", () => {
      const result = detectCrisis("그냥 사라지고 싶다");
      expect(result.tier).toBe("A");
    });

    it("구체적 계획/방법을 감지한다", () => {
      const result = detectCrisis("유서를 썼어");
      expect(result.tier).toBe("A");
    });

    it("공백이 섞인 표현도 감지한다", () => {
      const result = detectCrisis("죽 고 싶 다");
      expect(result.tier).toBe("A");
    });

    it("Tier A 감지 시 핫라인 3개가 포함된다", () => {
      const result = detectCrisis("자살하고 싶어");
      expect(result.response?.hotlines).toHaveLength(3);
      const numbers = result.response!.hotlines.map((h) => h.number);
      expect(numbers).toContain("109");
      expect(numbers).toContain("1577-0199");
      expect(numbers).toContain("1588-9191");
    });

    it("Tier A 감지 시 userMessage가 포함된다", () => {
      const result = detectCrisis("자살 방법을 알고 싶어");
      expect(result.response?.userMessage).toBeTruthy();
      expect(result.response?.bannerType).toBe("modal");
    });
  });

  // Tier B — 절망/무가치감
  describe("Tier B (YELLOW)", () => {
    it("무가치감 표현을 감지한다", () => {
      const result = detectCrisis("나는 쓸모 없는 사람이야");
      expect(result.tier).toBe("B");
      expect(result.response?.shouldHalt).toBe(false);
      expect(result.response?.shouldInjectGuard).toBe(true);
    });

    it("절망 표현을 감지한다", () => {
      const result = detectCrisis("살 가치 없어");
      expect(result.tier).toBe("B");
    });

    it("버틸 수 없다는 표현을 감지한다", () => {
      const result = detectCrisis("더는 못 버틴다");
      expect(result.tier).toBe("B");
    });

    it("극단적 선택 표현을 감지한다", () => {
      const result = detectCrisis("극단적 선택을 생각해봤어");
      expect(result.tier).toBe("B");
    });

    it("Tier B 감지 시 핫라인이 포함된다", () => {
      const result = detectCrisis("살 이유 없어");
      expect(result.response?.hotlines).toHaveLength(3);
    });

    it("Tier B 감지 시 bannerType이 inline이다", () => {
      const result = detectCrisis("도망가고 싶다");
      expect(result.response?.bannerType).toBe("inline");
    });
  });

  // GREEN — 일반 고민
  describe("GREEN (안전)", () => {
    it("일반 진로 고민은 GREEN이다", () => {
      const result = detectCrisis("이직을 고민하고 있어요");
      expect(result.tier).toBeNull();
      expect(result.response).toBeNull();
    });

    it("관계 고민은 GREEN이다", () => {
      const result = detectCrisis("친구와 싸웠어");
      expect(result.tier).toBeNull();
    });

    it("스트레스 불만은 GREEN이다", () => {
      const result = detectCrisis("일이 너무 힘들어");
      expect(result.tier).toBeNull();
    });

    it("빈 문자열은 GREEN이다", () => {
      const result = detectCrisis("");
      expect(result.tier).toBeNull();
    });

    it("일상 대화는 GREEN이다", () => {
      const result = detectCrisis("오늘 날씨가 좋네요");
      expect(result.tier).toBeNull();
    });
  });

  // HOTLINES 상수 검증
  describe("HOTLINES", () => {
    it("3개의 핫라인이 정의되어 있다", () => {
      expect(HOTLINES).toHaveLength(3);
    });

    it("각 핫라인에 name, number, description이 있다", () => {
      for (const h of HOTLINES) {
        expect(h.name).toBeTruthy();
        expect(h.number).toBeTruthy();
        expect(h.description).toBeTruthy();
      }
    });
  });

  // 우선순위: Tier A > Tier B
  describe("우선순위", () => {
    it("Tier A와 Tier B 키워드가 모두 포함되면 Tier A를 반환한다", () => {
      // "죽고 싶다" (Tier A) + "살 가치 없어" (Tier B)
      const result = detectCrisis("죽고 싶다 정말 살 가치 없어");
      expect(result.tier).toBe("A");
    });
  });
});
