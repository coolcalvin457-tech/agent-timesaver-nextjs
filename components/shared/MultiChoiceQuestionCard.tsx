"use client";

/**
 * MultiChoiceQuestionCard (S120-F34, layout reverted to 1x4 list in S121)
 *
 * Shared component for every multi-choice question card across tools.
 * Renders exactly 4 peer rows stacked vertically: 3 AI-generated noun-phrase
 * options plus 1 "Write your own." write-in row as the co-equal 4th choice.
 *
 * Peer Write-in Rule (master spec Layer 1 §1.4): the write-in is never a
 * footer link. It is a full row that matches the dimensions, styling, and
 * selected-state treatment of the other three rows. Clicking it swaps the
 * row in place into a text input — the card footprint does not change and
 * the surrounding list does not reflow.
 *
 * Layout note (S121): initial S120 ship used a 2x2 tile grid. Reverted to a
 * single-column vertical list after Calvin's live review — the list reads
 * cleaner and scans faster, especially when AI-generated options run long.
 * Write-in remains a co-equal row; the prior "footer link" variant is NOT
 * being reintroduced.
 *
 * F35 (paired): write-in input enforces a 60-character soft cap. Overflow
 * wraps within the tile; never mid-word truncated.
 *
 * Reference implementation: TimesaverTool.tsx. Other multi-choice tools
 * adopt this component during the F47 Bucket B sweep.
 */

import { useEffect, useRef, useState } from "react";

export const WRITE_IN_MAX_LENGTH = 60;
// No terminal period. Noun-phrase options never take periods, same family as
// the F56 pre-header rule. Keeps write-in consistent with the three AI tiles.
export const WRITE_IN_LABEL = "Write your own";

export interface MultiChoiceQuestionCardProps {
  /** The question stem (displayed above the tile grid). */
  stem: string;
  /** Exactly 3 AI-generated answer options. */
  choices: string[];
  /** Fires when the user commits an answer (either a tile click or a write-in submit). */
  onAnswer: (answer: string) => void;
  /**
   * Delay in ms between selection and `onAnswer` firing, to let the selected-state
   * animation land before the screen advances. Default 180ms matches the
   * existing Timesaver auto-advance pattern.
   */
  autoAdvanceDelayMs?: number;
  /** Label for the final-question commit button on the write-in tile. */
  writeInCommitLabel?: string;
}

export default function MultiChoiceQuestionCard({
  stem,
  choices,
  onAnswer,
  autoAdvanceDelayMs = 180,
  writeInCommitLabel = "Continue",
}: MultiChoiceQuestionCardProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [writeInActive, setWriteInActive] = useState(false);
  const [writeInValue, setWriteInValue] = useState("");
  const writeInInputRef = useRef<HTMLTextAreaElement>(null);

  // Reset internal state whenever the question changes.
  useEffect(() => {
    setSelectedIndex(null);
    setWriteInActive(false);
    setWriteInValue("");
  }, [stem]);

  // Focus the write-in textarea when it swaps in.
  useEffect(() => {
    if (writeInActive) {
      writeInInputRef.current?.focus();
    }
  }, [writeInActive]);

  const handleTileClick = (choice: string, i: number) => {
    if (writeInActive) return;
    setSelectedIndex(i);
    window.setTimeout(() => onAnswer(choice), autoAdvanceDelayMs);
  };

  const handleWriteInTileClick = () => {
    if (writeInActive) return;
    setSelectedIndex(null);
    setWriteInActive(true);
  };

  const handleWriteInCommit = () => {
    const trimmed = writeInValue.trim();
    if (!trimmed) return;
    onAnswer(trimmed);
  };

  const handleWriteInKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleWriteInCommit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setWriteInActive(false);
      setWriteInValue("");
    }
  };

  const writeInCommitDisabled = writeInValue.trim().length === 0;

  return (
    <>
      <p
        className="screen-headline"
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 400,
          fontSize: "clamp(1.5rem, 3.25vw, 2rem)",
          lineHeight: 1.25,
          overflowWrap: "break-word",
          wordBreak: "break-word",
          maxWidth: "100%",
          marginBottom: "20px",
        }}
      >
        {stem}
      </p>

      <div className="mc-tile-grid">
        {choices.map((choice, i) => (
          <button
            key={`${choice}-${i}`}
            type="button"
            className={`mc-tile ${selectedIndex === i ? "selected" : ""}`}
            onClick={() => handleTileClick(choice, i)}
            disabled={writeInActive}
          >
            <span className="mc-tile-label">{choice}</span>
          </button>
        ))}

        {/* Write-in tile — peer to the three choice tiles (F34). */}
        <button
          type="button"
          className={`mc-tile mc-tile-writein ${writeInActive ? "editing" : ""}`}
          onClick={handleWriteInTileClick}
          aria-expanded={writeInActive}
        >
          {!writeInActive ? (
            <span className="mc-tile-label mc-tile-writein-label">
              {WRITE_IN_LABEL}
            </span>
          ) : (
            <span
              className="mc-tile-writein-editor"
              onClick={(e) => e.stopPropagation()}
            >
              <textarea
                ref={writeInInputRef}
                className="mc-tile-writein-input"
                placeholder="Type your answer."
                value={writeInValue}
                maxLength={WRITE_IN_MAX_LENGTH}
                rows={2}
                onChange={(e) => setWriteInValue(e.target.value)}
                onKeyDown={handleWriteInKeyDown}
                aria-label="Write your own answer"
              />
              <span className="mc-tile-writein-footer">
                <span className="mc-tile-writein-count">
                  {writeInValue.length}/{WRITE_IN_MAX_LENGTH}
                </span>
                <button
                  type="button"
                  className="mc-tile-writein-commit"
                  onClick={handleWriteInCommit}
                  disabled={writeInCommitDisabled}
                >
                  {writeInCommitLabel}
                </button>
              </span>
            </span>
          )}
        </button>
      </div>
    </>
  );
}
