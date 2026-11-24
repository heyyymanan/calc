export type Operator = "+" | "−" | "×" | "÷";

export type Action =
  | { type: "digit"; value: string }
  | { type: "decimal" }
  | { type: "operator"; value: Operator }
  | { type: "equals" }
  | { type: "percent" }
  | { type: "negate" }
  | { type: "backspace" }
  | { type: "clear" };

export type State = {
  /** Numbers and operators already entered, always ending with an operator: ["12", "+", "3", "×"] */
  expression: string[];
  /** The number being typed. Empty right after an operator is pressed. */
  entry: string;
  /** When set, the next digit starts a new number instead of extending the entry. */
  overwrite: boolean;
  /** The expression behind the result currently on screen. */
  solved: string[] | null;
  error: boolean;
};

export const initialState: State = {
  expression: [],
  entry: "0",
  overwrite: false,
  solved: null,
  error: false,
};

const errorState: State = { ...initialState, overwrite: true, error: true };

const MAX_DIGITS = 15;
const OPERATORS = new Set<string>(["+", "−", "×", "÷"]);

export function reducer(state: State, action: Action): State {
  if (state.error && !["digit", "decimal", "clear"].includes(action.type)) return state;

  switch (action.type) {
    case "digit": {
      if (state.overwrite) {
        return { ...state, entry: action.value, overwrite: false, solved: null, error: false };
      }
      if (countDigits(state.entry) >= MAX_DIGITS) return state;
      const isZero = state.entry === "0" || state.entry === "-0";
      const entry = isZero ? state.entry.slice(0, -1) + action.value : state.entry + action.value;
      return { ...state, entry };
    }

    case "decimal": {
      if (state.overwrite) {
        return { ...state, entry: "0.", overwrite: false, solved: null, error: false };
      }
      if (state.entry.includes(".")) return state;
      return { ...state, entry: (state.entry || "0") + "." };
    }

    case "operator": {
      if (state.entry === "") {
        return { ...state, expression: [...state.expression.slice(0, -1), action.value] };
      }
      return {
        expression: [...state.expression, normalize(state.entry), action.value],
        entry: "",
        overwrite: false,
        solved: null,
        error: false,
      };
    }

    case "equals": {
      if (state.expression.length === 0) return state;
      const tokens =
        state.entry === ""
          ? state.expression.slice(0, -1)
          : [...state.expression, normalize(state.entry)];
      const result = evaluate(tokens);
      if (!Number.isFinite(result)) return { ...errorState, solved: tokens };
      return { expression: [], entry: toEntry(result), overwrite: true, solved: tokens, error: false };
    }

    // Like a desk calculator: 200 + 10% means 10% of 200.
    case "percent": {
      if (state.entry === "") return state;
      const operator = state.expression.at(-1);
      const base =
        operator === "+" || operator === "−" ? evaluate(state.expression.slice(0, -1)) : 1;
      const result = (base * Number(state.entry)) / 100;
      if (!Number.isFinite(result)) return errorState;
      return { ...state, entry: toEntry(result), overwrite: true, solved: null };
    }

    case "negate": {
      const entry = state.entry || "0";
      return { ...state, entry: entry.startsWith("-") ? entry.slice(1) : "-" + entry, solved: null };
    }

    case "backspace": {
      if (state.overwrite) return state;
      if (state.entry === "") {
        const entry = state.expression.at(-2) ?? "0";
        return {
          ...state,
          expression: state.expression.slice(0, -2),
          entry,
          overwrite: entry.includes("e"),
        };
      }
      const entry = state.entry.slice(0, -1);
      if (entry === "" || entry === "-") {
        return { ...state, entry: state.expression.length > 0 ? "" : "0" };
      }
      return { ...state, entry };
    }

    case "clear":
      return initialState;
  }
}

/** Evaluates ["2", "+", "3", "×", "4"] with × and ÷ taking precedence. */
function evaluate(tokens: string[]): number {
  const terms = [Number(tokens[0])];
  for (let i = 1; i < tokens.length; i += 2) {
    const operator = tokens[i];
    const value = Number(tokens[i + 1]);
    if (operator === "×") terms[terms.length - 1] *= value;
    else if (operator === "÷") terms[terms.length - 1] /= value;
    else terms.push(operator === "+" ? value : -value);
  }
  return terms.reduce((sum, term) => sum + term, 0);
}

/** Rounds away floating point noise (0.1 + 0.2) and switches to exponent form for huge values. */
function toEntry(value: number): string {
  const rounded = Number(value.toPrecision(12));
  if (rounded === 0) return "0";
  return Math.abs(rounded) >= 1e15 ? rounded.toExponential() : String(rounded);
}

function normalize(entry: string): string {
  return String(Number(entry));
}

function countDigits(entry: string): number {
  return entry.replace(/\D/g, "").length;
}

export function formatNumber(value: string): string {
  const sign = value.startsWith("-") ? "−" : "";
  const unsigned = sign ? value.slice(1) : value;
  if (unsigned.includes("e")) return sign + unsigned.replace("-", "−");
  const [integer, fraction] = unsigned.split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return sign + grouped + (fraction === undefined ? "" : "." + fraction);
}

export function formatExpression(tokens: string[]): string {
  return tokens.map((token) => (OPERATORS.has(token) ? token : formatNumber(token))).join(" ");
}

export function keyToAction(key: string): Action | null {
  if (/^\d$/.test(key)) return { type: "digit", value: key };
  switch (key) {
    case ".":
    case ",":
      return { type: "decimal" };
    case "+":
      return { type: "operator", value: "+" };
    case "-":
      return { type: "operator", value: "−" };
    case "*":
    case "x":
      return { type: "operator", value: "×" };
    case "/":
      return { type: "operator", value: "÷" };
    case "%":
      return { type: "percent" };
    case "=":
    case "Enter":
      return { type: "equals" };
    case "Backspace":
      return { type: "backspace" };
    case "Escape":
    case "Delete":
      return { type: "clear" };
    default:
      return null;
  }
}
