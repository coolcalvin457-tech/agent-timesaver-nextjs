"use client";

export default function HeroButton() {
  const handleClick = () => {
    const btn = document.getElementById("timesaver-start-btn") as HTMLButtonElement | null;
    if (btn) {
      btn.click();
      btn.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <button className="btn btn-primary btn-lg" onClick={handleClick}>
      Get Started
    </button>
  );
}
