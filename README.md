# Calculator

A responsive calculator built with Next.js and React.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

For a production build: `npm run build && npm start`.

## What it does

- Follows operator precedence: `2 + 3 × 4 = 14`
- Percent works like a desk calculator: `200 + 10%` gives `220`
- Hides floating point noise: `0.1 + 0.2 = 0.3`
- Keyboard input: digits, `+ - * /`, `Enter` or `=`, `Backspace`, `Escape` to clear
- Fits any screen: a card on desktop, full screen on phones, stretched keys in landscape

## Where things are

- `lib/calculator.ts`: state, evaluation and number formatting, no React
- `components/Calculator.tsx`: the keypad, display and keyboard handling
- `components/Calculator.module.css`: layout and responsive rules
