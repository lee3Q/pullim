---
captured: 2026-03-26 14:03:22
source: clipboard
status: unprocessed
---

You can get a pretty convincing fantasy RPG look with just gradients, shadows, and good typography choices. Below are concrete snippets you can drop into Tailwind (via `@layer components` or `@apply`) plus font and palette suggestions.  

***

## 1. Parchment / Scroll Texture (No Images)

Use layered gradients, a warm base color, and strong inset shadows. Grainy effects usually need SVG filters, but you can fake “paper” enough for mobile.

```css
.parchment {
  /* Base size */
  padding: 1.25rem 1rem;
  border-radius: 0.75rem;

  /* Warm paper base */
  background-color: #f3e3c4;

  /* Layered gradients for blotches and edges */
  background-image:
    radial-gradient(circle at 10% 0%, rgba(255,255,255,0.8) 0, transparent 60%),
    radial-gradient(circle at 90% 0%, rgba(255,255,255,0.7) 0, transparent 55%),
    radial-gradient(circle at 0% 50%, rgba(199,147,79,0.35) 0, transparent 55%),
    radial-gradient(circle at 100% 50%, rgba(199,147,79,0.35) 0, transparent 55%),
    linear-gradient(180deg, #f8ecd3 0%, #f0ddbc 40%, #e4cda5 100%);

  /* Inset + drop shadow for depth */
  box-shadow:
    0 0 0 1px rgba(120, 78, 30, 0.45),
    0 0 40px rgba(0,0,0,0.55),
    inset 0 0 40px rgba(120, 78, 30, 0.75);

  /* Slight texture using background-blend-mode */
  background-blend-mode: multiply;
}
```

You can enhance “roughness” by adding a subtle conic or noise-like gradient similar to “grainy gradients” patterns that layer semi-transparent color stops.[1]

In Tailwind, wrap via:

```css
@layer components {
  .parchment {
    @apply rounded-xl p-4;
    /* then paste the custom properties above */
  }
}
```

For a scroll panel, add darker borders top/bottom:

```css
.scroll-panel {
  position: relative;
  padding: 1.5rem 1rem;
  background-color: #f3e3c4;
  background-image:
    linear-gradient(180deg, rgba(0,0,0,0.3), transparent 18%),
    linear-gradient(0deg, rgba(0,0,0,0.3), transparent 18%);
  background-blend-mode: multiply;
  box-shadow: inset 0 0 30px rgba(120, 78, 30, 0.8);
}
```

***

## 2. Gold Ornamental Borders (No Images)

You can use `border-image` with gradient sources (no asset needed) and/or layered `box-shadow` to imply metal edges.[2]

### Gradient “Gold” Border with border-image

```css
.gold-frame {
  border-width: 4px;
  border-style: solid;
  border-image: linear-gradient(
      135deg,
      #fceabb 0%,
      #f8d084 15%,
      #e0aa3e 35%,
      #b8860b 55%,
      #f8d084 75%,
      #fff6c3 100%
    ) 1;
  border-radius: 0.75rem;
  background-color: #111318;
  box-shadow:
    0 0 0 1px rgba(0,0,0,0.7),
    0 0 20px rgba(248, 208, 132, 0.4);
}
```

This uses `border-image: linear-gradient(...) 1;` which MDN documents as a valid way to use gradients as border sources.[2]

### Thicker Ornamental Look with Inner Edge

```css
.gold-ornate {
  position: relative;
  border-radius: 1rem;
  padding: 1rem;
  background: #111318;
  box-shadow:
    0 0 0 2px rgba(0,0,0,0.9),
    0 0 0 3px #f8d084,
    0 0 0 5px #5b4316,
    0 0 20px rgba(248, 208, 132, 0.45);
}

.gold-ornate::before {
  content: "";
  position: absolute;
  inset: 4px;
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 248, 209, 0.35);
  box-shadow:
    inset 0 0 10px rgba(0,0,0,0.7),
    0 0 10px rgba(255, 255, 200, 0.3);
  pointer-events: none;
}
```

Translate to Tailwind with `@apply` for radius/padding and keep shadows as raw CSS.

***

## 3. Fantasy-Style Button Effects

You can get “magical” and “medieval” buttons using gradients, inner shadows, and outer glow.[3][4]

### A) Glowing Arcane Button

```css
.btn-arcane {
  position: relative;
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  color: #fdfaf2;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  background-image: radial-gradient(circle at 0% 0%, #6a0dad, #2f2b5e);
  box-shadow:
    0 0 15px rgba(106, 13, 173, 0.7),
    0 0 40px rgba(46, 36, 112, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.4);
  text-shadow: 0 0 6px rgba(255,255,255,0.7);
  transition: transform 150ms ease, box-shadow 150ms ease, filter 150ms ease;
}

.btn-arcane::before {
  content: "";
  position: absolute;
  inset: 2px;
  border-radius: inherit;
  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow:
    inset 0 0 12px rgba(255, 255, 255, 0.4),
    inset 0 0 25px rgba(106, 13, 173, 0.6);
  opacity: 0.75;
  pointer-events: none;
}

.btn-arcane:hover {
  transform: translateY(-1px) scale(1.02);
  box-shadow:
    0 0 18px rgba(106, 13, 173, 0.9),
    0 0 50px rgba(46, 36, 112, 1);
  filter: brightness(1.1);
}
```

### B) Embossed “Medieval” Leather Button

```css
.btn-medieval {
  position: relative;
  padding: 0.6rem 1.3rem;
  border-radius: 0.75rem;
  color: #f3e3c4;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  background-image: linear-gradient(145deg, #4b2b1a, #2a140c);
  box-shadow:
    0 2px 0 #1a0b06,
    0 3px 8px rgba(0,0,0,0.8),
    inset 0 0 0 1px rgba(255,255,255,0.06),
    inset 0 1px 0 rgba(255,255,255,0.1);
  border: 1px solid #b8860b;
  text-shadow: 0 1px 0 #1a0b06;
  transition: transform 100ms ease, box-shadow 100ms ease;
}

.btn-medieval:hover {
  transform: translateY(1px);
  box-shadow:
    0 1px 0 #1a0b06,
    0 1px 4px rgba(0,0,0,0.8),
    inset 0 0 0 1px rgba(255,255,255,0.04);
}

.btn-medieval:active {
  transform: translateY(2px);
  box-shadow:
    0 0 0 #1a0b06,
    inset 0 1px 4px rgba(0,0,0,0.8);
}
```

Attach gold outlines by adding the `.gold-ornate` border treatment or simple `border-image` gradient from section 2.

***

## 4. Korean Serif Fonts That Feel Fantasy

All three serif families you mentioned are on Google Fonts and support Hangul. Opinions differ, but Korean designers describe them roughly like this:[5][6]

| Font            | Vibe / Use case (KR context) | Fantasy fit notes |
|-----------------|------------------------------|-------------------|
| Noto Serif KR   | Neutral, modern, very legible body text. [6] | Good base, but feels a bit “system” unless combined with effects. |
| Gowun Batang    | Warm, soft stroke endings, gentle and elegant. [5] | Strong candidate for high-fantasy / story text; warm, book-like feel. |
| Nanum Myeongjo  | Classic contemporary Myeongjo, versatile body text. [5][6] | Feels like novel/book typography; good for narrative and UI labels. |

The Korean font guide notes that Gowun Batang is designed to give a warm atmosphere with delicately thickened stroke ends, suitable when you want a gentle, clear serif tone.  It also describes Nanum Myeongjo as a contemporary, versatile Myeongjo good for general “serif-style” Korean text.[5]

A practical combo for your app:

- Main body text: Gowun Batang  
- Labels / small UI: Noto Serif KR (for hinting & clarity)  
- Titles: Nanum Myeongjo with letter-spacing and text-shadow  

Example Tailwind setup (`globals.css`):

```css
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;700&family=Gowun+Batang:wght@400;700&family=Nanum+Myeongjo:wght@400;700;800&display=swap');

:root {
  --font-body-kr: 'Gowun Batang', 'Noto Serif KR', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  --font-ui-kr: 'Noto Serif KR', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  --font-title-kr: 'Nanum Myeongjo', 'Gowun Batang', serif;
}

/* Tailwind layer */
@layer base {
  body {
    font-family: var(--font-body-kr);
  }
}
```

Then in JSX:

```jsx
<h1 className="font-[var(--font-title-kr)] tracking-[0.08em] text-shadow-title">
  선택의 서
</h1>
```

Add a text-shadow utility:

```css
@layer utilities {
  .text-shadow-title {
    text-shadow:
      0 0 8px rgba(0,0,0,0.8),
      0 0 18px rgba(184, 134, 11, 0.7);
  }
}
```

***

## 5. Dark Fantasy Color Palette (Hex Values)

Here’s a palette inspired by a “Dark Fantasy” set (black, violet, indigo, teal, gold) and adjusted slightly to sit well in UI.[7]

The referenced palette includes “Midnight Black” (#000000), “Enchanted Violet” (#6A0DAD), “Shadowy Indigo” (#2F2B5E), “Sorcerer’s Green” (#008080), “Witching Hour Blue” (#0E1C36), and “Ancient Gold” (#B8860B).[7]

### Suggested palette for your app

- Background primary: `#05060b` (deep near-black)  
- Background elevated (cards): `#111318`  
- Parchment area: `#f3e3c4`  
- Accent 1 (arcane violet): `#6a0dad`[7]
- Accent 2 (indigo): `#2f2b5e`[7]
- Accent 3 (teal “magic”): `#008080`[7]
- Gold primary: `#b8860b` (Ancient Gold)[7]
- Gold highlight: `#f8d084`  
- Text primary: `#f8f1e4`  
- Text muted: `#b6a892`  
- Error (blood red): `#8b1a28`  
- Success (herb green): `#3d6b3f`  

Tailwind config extension example:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#05060b',
          card: '#111318',
        },
        parchment: '#f3e3c4',
        accent: {
          violet: '#6a0dad',
          indigo: '#2f2b5e',
          teal: '#008080',
        },
        gold: {
          base: '#b8860b',
          soft: '#f8d084',
        },
        text: {
          primary: '#f8f1e4',
          muted: '#b6a892',
        },
      },
    },
  },
};
```

***

## 6. What Makes Fantasy Game UIs Feel “Fantasy”

Discussions of fantasy game UI (including Genshin-style clones and general fantasy UI advice) point to a few recurring patterns:[8][3]

- Decorative frames: Use ornate borders and layered frames around cards and buttons instead of flat rectangles.[3][2]
- Strong glow and shadow: Bright text glows, outer glows, and inset shadows for depth on a dark background.[3]
- Typography: Elegant serif or pseudo-calligraphic fonts, with letter spacing and gold/cream colors.[5][3]
- Color hierarchy: Dark, desaturated backgrounds with saturated accents (violet, teal, gold) that feel “magical”.[7]
- Layered components: Genshin’s map UI, for example, uses floating panels with soft drop shadows and subtle borders to separate from the map surface.[8]

Translated into CSS patterns for your Next.js + Tailwind mobile UI:

1. **Panels and cards**

```css
.card-fantasy {
  border-radius: 1rem;
  padding: 1rem;
  background: radial-gradient(circle at 0% 0%, #1c1f2b, #05060b 70%);
  box-shadow:
    0 0 0 1px rgba(255, 248, 209, 0.06),
    0 18px 40px rgba(0,0,0,0.85);
}
```

2. **“Title strip” like quest headers**

```css
.quest-title {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  background-image: linear-gradient(90deg, #b8860b, #f8d084, #b8860b);
  color: #22140a;
  font-family: var(--font-title-kr);
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
```

3. **Floating HUD-style bottom nav**

```css
.hud-bar {
  position: fixed;
  inset-inline: 1rem;
  bottom: 1rem;
  padding: 0.5rem 0.75rem;
  border-radius: 9999px;
  background: rgba(10, 11, 18, 0.9);
  backdrop-filter: blur(16px);
  box-shadow:
    0 0 0 1px rgba(184, 134, 11, 0.4),
    0 12px 30px rgba(0, 0, 0, 0.9);
}
```

Backdrop blur and glowing borders echo modern fantasy HUDs without assets.[3]

***

If you share a specific UI component from your app (e.g., “choice card” or “result modal”), I can give you a tailored Tailwind + CSS snippet that matches these patterns and fits your existing structure.  

출처
[1] Grainy Gradients https://css-tricks.com/grainy-gradients/
[2] border-image - CSS: Cascading Style Sheets - MDN Web Docs https://developer.mozilla.org/ko/docs/Web/CSS/Reference/Properties/border-image
[3] How do I implement a fantasy / game-like UI (ornamental, ... https://www.reddit.com/r/webdev/comments/1n1a4sd/how_do_i_implement_a_fantasy_gamelike_ui/
[4] Creating a Stunning Glowing Button with Tailwind CSS https://www.uibun.dev/blog/glowing-button
[5] What fonts do Koreans use? | Free Korean Fonts download https://koreanrestaurant.tistory.com/entry/What-fonts-do-Koreans-use-Free-Korean-Hangul-Font-download
[6] 폰트 셋중에 멀까요?? noto serif kr 본명조 heavy 나눔 ... https://noonnu.cc/en/posts/49850
[7] Dark fantasy color palette https://huehive.co/ai_generated_palettes/4488
[8] CorellanStoma/Genshin-Impact-Map: Custom CSS for the ... - GitHub https://github.com/CorellanStoma/Genshin-Impact-Map
[9] Can i make this parchment-looking rectangle in CSS? https://www.reddit.com/r/css/comments/4felyu/can_i_make_this_parchmentlooking_rectangle_in_css/
[10] Old parchment v.2.3 (more realistic with CSS and ... https://codepen.io/AgnusDei/pen/NWPbOxL
[11] CSS Gradient – Generator, Maker, and Background https://cssgradient.io
[12] Old paper background texture with just css https://stackoverflow.com/questions/14585101/old-paper-background-texture-with-just-css
[13] Modern CSS Gradients Tutorial — From Basics to ... https://www.youtube.com/watch?v=cWgb42tUYPA
[14] Create awesome fancy borders using border-image https://uxdesign.cc/create-awesome-fancy-borders-using-border-image-6d2a23840d28
[15] How to Set Up Tailwind CSS in Next.js: Complete Guide for ... https://dev.to/sudiip__17/how-to-set-up-tailwind-css-in-nextjs-complete-guide-for-2025-2232
