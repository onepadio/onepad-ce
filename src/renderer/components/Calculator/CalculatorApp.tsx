import { useCallback, useState } from 'react';

import BuiltinModalChrome from '../BuiltinApps/BuiltinModalChrome';
import './CalculatorApp.css';

const BUTTONS = [
  ['C', '±', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '='],
] as const;

function CalculatorApp() {
  const [display, setDisplay] = useState('0');
  const [stored, setStored] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [fresh, setFresh] = useState(true);

  const applyOp = useCallback(
    (a: number, b: number, operator: string) => {
      switch (operator) {
        case '+':
          return a + b;
        case '−':
          return a - b;
        case '×':
          return a * b;
        case '÷':
          return b === 0 ? NaN : a / b;
        default:
          return b;
      }
    },
    []
  );

  const handlePress = useCallback(
    (key: string) => {
      if (key === 'C') {
        setDisplay('0');
        setStored(null);
        setOp(null);
        setFresh(true);
        return;
      }
      if (key === '±') {
        setDisplay((d) =>
          d.startsWith('-') ? d.slice(1) || '0' : d === '0' ? d : `-${d}`
        );
        return;
      }
      if (key === '%') {
        setDisplay((d) => String(parseFloat(d || '0') / 100));
        setFresh(true);
        return;
      }
      if (key === '.') {
        setDisplay((d) => (fresh ? '0.' : d.includes('.') ? d : `${d}.`));
        setFresh(false);
        return;
      }
      if (['+', '−', '×', '÷'].includes(key)) {
        const current = parseFloat(display);
        if (stored != null && op && !fresh) {
          const result = applyOp(stored, current, op);
          setStored(result);
          setDisplay(String(result));
        } else {
          setStored(current);
        }
        setOp(key);
        setFresh(true);
        return;
      }
      if (key === '=') {
        if (stored == null || !op) return;
        const result = applyOp(stored, parseFloat(display), op);
        setDisplay(Number.isFinite(result) ? String(result) : 'Error');
        setStored(null);
        setOp(null);
        setFresh(true);
        return;
      }
      setDisplay((d) => (fresh || d === '0' ? key : `${d}${key}`));
      setFresh(false);
    },
    [applyOp, display, fresh, op, stored]
  );

  return (
    <BuiltinModalChrome appId="calculator">
      <div className="calculator-app">
        <div className="calculator-display" aria-live="polite">
          {display}
        </div>
        <div className="calculator-pad">
          {BUTTONS.map((row, rowIdx) => (
            <div key={rowIdx} className="calculator-row">
              {row.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`calculator-key${
                    ['+', '−', '×', '÷', '='].includes(key) ? ' is-op' : ''
                  }${key === '0' ? ' is-wide' : ''}`}
                  onClick={() => handlePress(key)}
                >
                  {key}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </BuiltinModalChrome>
  );
}

export default CalculatorApp;
