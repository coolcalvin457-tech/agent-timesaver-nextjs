"use client";

import { useState } from "react";

const cards = [
  {
    name: "ChatGPT",
    headline: "World-Class Writer",
    body: "Think Pulitzer Prize winner at your fingertips. If you\u2019re already here, you picked a good one.",
  },
  {
    name: "Claude",
    headline: "Amazing Coworker",
    body: "Ever wish you had your own personal assistant? Well now you do, and they are way overqualified.",
  },
  {
    name: "Copilot",
    headline: "The Office",
    body: "If your company uses Microsoft, it\u2019s embedded into everything. Careful with your AI talk around the water cooler.",
  },
  {
    name: "Gemini",
    headline: "Google Machine",
    body: "World\u2019s best search engine now has AI superpowers. It generates breathtaking images and viral videos in minutes.",
  },
  {
    name: "Grok",
    headline: "Elon Musk",
    body: "The friend who\u2019s up-to-date on all the breaking news and latest trends. And no, it won\u2019t always agree with you.",
  },
  {
    name: "Perplexity",
    headline: "Deep Researcher",
    body: "While Google gives you ten blue links, this power tool gives you a dossier before your coffee gets cold.",
  },
];

export default function AiMatchCards() {
  const [flipped, setFlipped] = useState<Set<number>>(new Set());

  function toggle(index: number) {
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  return (
    <div className="outcomes-grid">
      {cards.map((card, i) => (
        <div
          key={card.name}
          className="flip-card-wrapper"
          onClick={() => toggle(i)}
        >
          <div
            className={`flip-card-inner${flipped.has(i) ? " flipped" : ""}`}
          >
            {/* ── Front: tool name only ── */}
            <div className="flip-card-face flip-card-front outcome-card">
              <div className="flip-card-name">{card.name}</div>
              <div className="flip-card-hint">Click to reveal</div>
            </div>

            {/* ── Back: personality + description ── */}
            <div className="flip-card-face flip-card-back outcome-card">
              <div className="outcome-label">{card.name}</div>
              <div className="outcome-headline">{card.headline}</div>
              <p className="outcome-body">{card.body}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
