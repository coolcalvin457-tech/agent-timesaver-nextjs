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
 * F35 (updated S121): write-in input caps at 500 characters universally,
 * applied identically across every tool on the site. The original S114 cap
 * was 60 characters, driven by visual parallelism with the three AI tiles.
 * Beta feedback showed users were choosing the write-in on two of three
 * screens per session, which meant the 60-char cap was actively blocking
 * the specific, detailed answers that produce the best time-saver output.
 * 500 characters gives room for roughly four to five sentences — enough
 * for real specificity without inviting essays. Latency and cost impact
 * is negligible; this was never a performance decision. Exported as a
 * component constant so every tool adopting MultiChoiceQuestionCard during
 * F47 Bucket B inherits the same behavior automatically.
 *
 * Input grows vertically from one line to a maximum of four visible lines
 * as the user types, then scrolls internally past four lines. Character
 * counter color shifts to amber in the last 50 characters as a soft
 * heads-up, hard-stops at 500 via the maxLength attribute.
 *
 * Reference implementation: TimesaverTool.tsx. Other multi-choice tools
 * adopt this component during the F47 Bucket B sweep.
 */

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent as ReactKeyboardEvent } from "react";

export const WRITE_IN_MAX_LENGTH = 500;
export const WRITE_IN_NEAR_LIMIT = 450; // last 50 chars → amber counter
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

  // Auto-resize the textarea to fit its content, capped at CSS max-height
  // (which enforces the 4-line maximum). Runs on every input change and on
  // initial activation so the textarea opens at exactly one line.
  const resizeWriteInTextarea = () => {
    const ta = writeInInputRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  };

  // Reset internal state whenever the question changes.
  useEffect(() => {
    setSelectedIndex(null);
    setWriteInActive(false);
    setWriteInValue("");
  }, [stem]);

  // Focus and size the write-in textarea when it swaps in.
  useEffect(() => {
    if (writeInActive) {
      writeInInputRef.current?.focus();
      resizeWriteInTextarea();
    }
  }, [writeInActive]);

  const handleTileClick = (choice: string, i: number) => {
    // If the write-in row is currently in editing state, clicking an AI tile
    // cancels the write-in (discards any typed value) and commits the tile
    // choice instead. Tile clicks always win — the user has clearly changed
    // their mind and picked one of the pre-generated options. Fix for S122
    // lockout bug: prior versions guarded with `if (writeInActive) return`
    // and rendered the tiles as `disabled`, which silently swallowed clicks.
    if (writeInActive) {
      setWriteInActive(false);
      setWriteInValue("");
    }
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

  const handleWriteInChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setWriteInValue(e.target.value);
    // Resize on next frame so React has committed the new value to the DOM.
    requestAnimationFrame(resizeWriteInTextarea);
  };

  const handleWriteInKeyDown = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    // Enter alone commits. Shift+Enter inserts a newline (standard textarea).
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleWriteInCommit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setWriteInActive(false);
      setWriteInValue("");
    }
  };

  // Standalone Continue button is always rendered below the list, but it
  // is only enabled once the write-in row is active AND the user has typed
  // at least one non-whitespace character. Clicks on the three AI tiles
  // auto-advance and never need the button.
  const writeInCommitDisabled =
    !writeInActive || writeInValue.trim().length === 0;

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
          >
            <span className="mc-tile-label">{choice}</span>
          </button>
        ))}

        {/* Write-in row — peer to the three choice rows (F34).
            S121: commit button moved OUT of the row and rendered standalone
            below the list. Row now holds only the label (idle) or the
            textarea + character counter (editing). */}
        <div
          className={`mc-tile mc-tile-writein ${writeInActive ? "editing" : ""}`}
          onClick={!writeInActive ? handleWriteInTileClick : undefined}
          role={!writeInActive ? "button" : undefined}
          tabIndex={!writeInActive ? 0 : undefined}
          onKeyDown={
            !writeInActive
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleWriteInTileClick();
                  }
                }
              : undefined
          }
          aria-expanded={writeInActive}
        >
          {!writeInActive ? (
            <span className="mc-tile-label">{WRITE_IN_LABEL}</span>
          ) : (
            <span className="mc-tile-writein-editor">
              <textarea
                ref={writeInInputRef}
                className="mc-tile-writein-input"
                placeholder="Type your answer"
                value={writeInValue}
                maxLength={WRITE_IN_MAX_LENGTH}
                rows={1}
                onChange={handleWriteInChange}
                onKeyDown={handleWriteInKeyDown}
                aria-label="Write your own answer"
              />
              <span
                className={`mc-tile-writein-count${
                  writeInValue.length >= WRITE_IN_NEAR_LIMIT ? " near-limit" : ""
                }`}
              >
                {writeInValue.length}/{WRITE_IN_MAX_LENGTH}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Standalone commit button — always rendered below the list. Disabled
          by default; enables only when the user activates the write-in row
          and types at least one non-whitespace character. Clicks on the
          three AI tiles auto-advance and never engage this button. */}
      <div className="mc-writein-action">
        <button
          type="button"
          className="btn btn-primary mc-writein-commit-button"
          onClick={handleWriteInCommit}
          disabled={writeInCommitDisabled}
        >
          {writeInCommitLabel}
        </button>
      </div>
    </>
  );
}
