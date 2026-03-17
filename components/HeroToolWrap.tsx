"use client";

import TimesaverTool from "@/components/TimesaverTool";

export default function HeroToolWrap() {
  const handleClick = () => {
    const btn = document.getElementById("timesaver-start-btn") as HTMLButtonElement | null;
    if (btn) {
      btn.click();
      btn.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div
      className="browser-chrome hero-tool-dark hero-tool-clickable"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleClick(); }}
      aria-label="Start AGENT: Timesaver"
    >
      <div className="browser-bar">
        <div className="browser-dot browser-dot-red" />
        <div className="browser-dot browser-dot-yellow" />
        <div className="browser-dot browser-dot-green" />
        <div className="browser-url">promptaiagents.com/timesaver</div>
      </div>
      <TimesaverTool />
    </div>
  );
}
