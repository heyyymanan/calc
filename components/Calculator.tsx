"use client";

import { useEffect, useReducer, type CSSProperties, type ReactNode } from "react";
import {
  formatExpression,
  formatNumber,
  initialState,
  keyToAction,
  reducer,
  type Action,
  type Operator,
} from "@/lib/calculator";
import styles from "./Calculator.module.css";

type Key = {
  label: ReactNode;
  name: string;
  action: Action;
  variant: "digit" | "function" | "operator" | "equals";
};

const digit = (value: string): Key => ({
  label: value,
  name: value,
  action: { type: "digit", value },
  variant: "digit",
});

const operator = (value: Operator, name: string): Key => ({
  label: value,
  name,
  action: { type: "operator", value },
  variant: "operator",
});

const backspaceIcon = (
  <svg
    viewBox="0 0 24 24"
    width="26"
    height="26"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M9 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6-7z" />
    <path d="m12 9 6 6m0-6-6 6" />
  </svg>
);

const KEYS: Key[] = [
  { label: "AC", name: "Clear", action: { type: "clear" }, variant: "function" },
  { label: backspaceIcon, name: "Backspace", action: { type: "backspace" }, variant: "function" },
  { label: "%", name: "Percent", action: { type: "percent" }, variant: "function" },
  operator("÷", "Divide"),
  digit("7"),
  digit("8"),
  digit("9"),
  operator("×", "Multiply"),
  digit("4"),
  digit("5"),
  digit("6"),
  operator("−", "Subtract"),
  digit("1"),
  digit("2"),
  digit("3"),
  operator("+", "Add"),
  { label: "±", name: "Toggle sign", action: { type: "negate" }, variant: "function" },
  digit("0"),
  { label: ".", name: "Decimal point", action: { type: "decimal" }, variant: "digit" },
  { label: "=", name: "Equals", action: { type: "equals" }, variant: "equals" },
];

export default function Calculator() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const action = keyToAction(event.key);
      if (!action) return;
      event.preventDefault();
      dispatch(action);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const expression = state.solved
    ? `${formatExpression(state.solved)} =`
    : formatExpression(state.expression);
  const value = state.error
    ? "Error"
    : formatNumber(state.entry || state.expression.at(-2) || "0");

  return (
    <section className={styles.calculator} aria-label="Calculator">
      <output className={styles.display} aria-live="polite">
        <span className={styles.expression}>{expression}</span>
        <span className={styles.value} style={{ "--length": value.length } as CSSProperties}>
          {value}
        </span>
      </output>
      <div className={styles.keys}>
        {KEYS.map((key) => (
          <button
            key={key.name}
            type="button"
            className={styles.key}
            data-variant={key.variant}
            aria-label={key.name}
            onClick={() => dispatch(key.action)}
          >
            {key.label}
          </button>
        ))}
      </div>
    </section>
  );
}
