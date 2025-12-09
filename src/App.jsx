import React, { useState } from 'react';
import './App.css';

const AICalculator = () => {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('');
  const [steps, setSteps] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inputType, setInputType] = useState('standard');

  const operations = {
    '+': (a, b) => a + b,
    '-': (a, b) => a - b,
    '*': (a, b) => a * b,
    '/': (a, b) => a / b,
    '^': (a, b) => Math.pow(a, b),
    '√': (a) => Math.sqrt(a),
    'sin': (a) => Math.sin(a * Math.PI / 180),
    'cos': (a) => Math.cos(a * Math.PI / 180),
    'tan': (a) => Math.tan(a * Math.PI / 180),
    'log': (a) => Math.log10(a),
    'ln': (a) => Math.log(a),
  };

  const parseExpression = (expr) => {
    try {
      // Handle special functions
      expr = expr.replace(/sqrt\(/g, '√(');
      expr = expr.replace(/sin\(/g, 'sin(');
      expr = expr.replace(/cos\(/g, 'cos(');
      expr = expr.replace(/tan\(/g, 'tan(');
      expr = expr.replace(/log\(/g, 'log(');
      expr = expr.replace(/ln\(/g, 'ln(');
      
      // Handle parentheses
      while (expr.includes('(')) {
        const match = expr.match(/\(([^()]+)\)/);
        if (!match) break;
        
        const innerExpr = match[1];
        const innerResult = evaluateBasic(innerExpr);
        
        setSteps(prev => [...prev, {
          step: `Solve expression inside parentheses: (${innerExpr})`,
          calculation: `${innerExpr} = ${innerResult}`,
          explanation: 'Parentheses have highest priority in order of operations'
        }]);
        
        expr = expr.replace(`(${innerExpr})`, innerResult);
      }
      
      return evaluateBasic(expr);
    } catch (err) {
      throw new Error('Invalid expression format');
    }
  };

  const evaluateBasic = (expr) => {
    const stepsArray = [];
    
    // Handle exponents
    while (expr.includes('^')) {
      const match = expr.match(/([\d.]+)\s*\^\s*([\d.]+)/);
      if (!match) break;
      
      const [full, a, b] = match;
      const result = operations['^'](parseFloat(a), parseFloat(b));
      
      stepsArray.push({
        step: `Exponent calculation: ${a}^${b}`,
        calculation: `${a}^${b} = ${result}`,
        explanation: `${a} raised to the power of ${b}`
      });
      
      expr = expr.replace(full, result);
    }
    
    // Handle multiplication and division
    while (expr.match(/[\d.]+\s*[*/]\s*[\d.]+/)) {
      const match = expr.match(/([\d.]+)\s*([*/])\s*([\d.]+)/);
      if (!match) break;
      
      const [full, a, op, b] = match;
      const result = operations[op](parseFloat(a), parseFloat(b));
      
      stepsArray.push({
        step: `${op === '*' ? 'Multiplication' : 'Division'}: ${a} ${op} ${b}`,
        calculation: `${a} ${op} ${b} = ${result}`,
        explanation: op === '*' 
          ? `${a} multiplied by ${b}`
          : `${a} divided by ${b}`
      });
      
      expr = expr.replace(full, result);
    }
    
    // Handle addition and subtraction
    while (expr.match(/[\d.]+\s*[+-]\s*[\d.]+/)) {
      const match = expr.match(/([\d.]+)\s*([+-])\s*([\d.]+)/);
      if (!match) break;
      
      const [full, a, op, b] = match;
      const result = operations[op](parseFloat(a), parseFloat(b));
      
      stepsArray.push({
        step: `${op === '+' ? 'Addition' : 'Subtraction'}: ${a} ${op} ${b}`,
        calculation: `${a} ${op} ${b} = ${result}`,
        explanation: op === '+'
          ? `${a} plus ${b}`
          : `${a} minus ${b}`
      });
      
      expr = expr.replace(full, result);
    }
    
    setSteps(prev => [...prev, ...stepsArray]);
    return parseFloat(expr);
  };

  const handleSpecialFunction = (expr) => {
    const stepsArray = [];
    
    // Handle square root
    if (expr.includes('√')) {
      const match = expr.match(/√\(?([\d.]+)\)?/);
      if (match) {
        const [full, num] = match;
        const result = operations['√'](parseFloat(num));
        
        stepsArray.push({
          step: `Square root calculation: √${num}`,
          calculation: `√${num} = ${result.toFixed(6)}`,
          explanation: `Square root of ${num}`
        });
        
        return { result, steps: stepsArray };
      }
    }
    
    // Handle trigonometric functions
    const trigMatch = expr.match(/(sin|cos|tan)\(?([\d.]+)\)?/);
    if (trigMatch) {
      const [full, func, num] = trigMatch;
      const result = operations[func](parseFloat(num));
      
      stepsArray.push({
        step: `${func} calculation: ${func}(${num}°)`,
        calculation: `${func}(${num}°) = ${result.toFixed(6)}`,
        explanation: `${func} of ${num} degrees`
      });
      
      return { result, steps: stepsArray };
    }
    
    // Handle logarithms
    const logMatch = expr.match(/(log|ln)\(?([\d.]+)\)?/);
    if (logMatch) {
      const [full, func, num] = logMatch;
      const result = operations[func](parseFloat(num));
      
      stepsArray.push({
        step: `${func === 'log' ? 'Logarithm' : 'Natural log'} calculation: ${func}(${num})`,
        calculation: `${func}(${num}) = ${result.toFixed(6)}`,
        explanation: `${func === 'log' ? 'Base-10 logarithm' : 'Natural logarithm (base e)'} of ${num}`
      });
      
      return { result, steps: stepsArray };
    }
    
    return null;
  };

  const solveMathProblem = async () => {
    if (!expression.trim()) {
      setError('Please enter a mathematical expression');
      return;
    }

    setIsLoading(true);
    setError('');
    setSteps([]);
    
    try {
      let finalResult;
      let calculationSteps = [];

      // Check for special functions
      const specialResult = handleSpecialFunction(expression);
      if (specialResult) {
        finalResult = specialResult.result;
        calculationSteps = specialResult.steps;
      } else {
        // Regular arithmetic expression
        finalResult = parseExpression(expression);
        calculationSteps = [...steps];
      }

      // Add final step
      calculationSteps.push({
        step: 'Final Result',
        calculation: `${expression} = ${finalResult}`,
        explanation: 'Calculation completed successfully'
      });

      setResult(finalResult);
      setSteps(calculationSteps);
      
      // Add to history
      setHistory(prev => [{
        expression,
        result: finalResult,
        timestamp: new Date().toLocaleTimeString(),
        steps: calculationSteps.length
      }, ...prev.slice(0, 9)]);
      
    } catch (err) {
      setError(`Error: ${err.message}. Please check your expression format.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      solveMathProblem();
    }
  };

  const clearAll = () => {
    setExpression('');
    setResult('');
    setSteps([]);
    setError('');
  };

  const insertSymbol = (symbol) => {
    setExpression(prev => prev + symbol);
  };

  const examples = [
    '2 + 3 * 4',
    '(5 + 3) * 2',
    '√(16)',
    'sin(30)',
    'log(100)',
    '4^2 + 3^2',
    '2π + 3',
  ];

  const loadExample = (example) => {
    setExpression(example);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🤖 AI Smart Calculator</h1>
        <p>Solve math problems with step-by-step explanations</p>
      </header>

      <div className="calculator-container">
        <div className="input-section">
          <div className="input-group">
            <label htmlFor="expression">Enter Mathematical Expression:</label>
            <div className="input-with-buttons">
              <input
                type="text"
                id="expression"
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., (2+3)*4, √16, sin(30), log(100)"
                disabled={isLoading}
              />
              <button 
                onClick={solveMathProblem} 
                className="solve-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Solving...' : 'Solve'}
              </button>
            </div>
          </div>

          <div className="input-type">
            <label>Input Type:</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  value="standard"
                  checked={inputType === 'standard'}
                  onChange={(e) => setInputType(e.target.value)}
                />
                Standard
              </label>
              <label>
                <input
                  type="radio"
                  value="scientific"
                  checked={inputType === 'scientific'}
                  onChange={(e) => setInputType(e.target.value)}
                />
                Scientific
              </label>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="quick-buttons">
            <h4>Quick Symbols:</h4>
            <div className="symbol-buttons">
              {['+', '-', '*', '/', '^', '(', ')', '√', 'π', 'sin(', 'cos(', 'tan(', 'log(', 'ln('].map((sym) => (
                <button
                  key={sym}
                  onClick={() => insertSymbol(sym)}
                  className="symbol-btn"
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>

          <div className="examples-section">
            <h4>Try These Examples:</h4>
            <div className="example-buttons">
              {examples.map((ex, index) => (
                <button
                  key={index}
                  onClick={() => loadExample(ex)}
                  className="example-btn"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          <div className="action-buttons">
            <button onClick={clearAll} className="clear-btn">
              Clear All
            </button>
            <button 
              onClick={() => setExpression('')} 
              className="clear-btn"
            >
              Clear Expression
            </button>
          </div>
        </div>

        <div className="results-section">
          {result !== '' && (
            <div className="result-display">
              <h3>Result:</h3>
              <div className="result-value">
                <span className="expression">{expression} =</span>
                <span className="answer">{Number.isFinite(result) ? result.toFixed(6) : result}</span>
              </div>
            </div>
          )}

          {steps.length > 0 && (
            <div className="steps-section">
              <h3>Step-by-Step Solution:</h3>
              <div className="steps-list">
                {steps.map((step, index) => (
                  <div key={index} className="step-item">
                    <div className="step-header">
                      <span className="step-number">Step {index + 1}</span>
                      <span className="step-title">{step.step}</span>
                    </div>
                    <div className="step-calculation">{step.calculation}</div>
                    <div className="step-explanation">
                      📝 {step.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="history-section">
            <h3>Calculation History</h3>
            <div className="history-list">
              {history.map((item, index) => (
                <div key={index} className="history-item">
                  <div className="history-expression">{item.expression}</div>
                  <div className="history-result">= {item.result}</div>
                  <div className="history-meta">
                    <span className="history-steps">{item.steps} steps</span>
                    <span className="history-time">{item.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="footer">
        <p>AI Smart Calculator • Solves math problems with detailed explanations</p>
        <p>Supports: Basic arithmetic, parentheses, exponents, roots, trigonometry, logarithms</p>
      </footer>
    </div>
  );
};

export default AICalculator;

