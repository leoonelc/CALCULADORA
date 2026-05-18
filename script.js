const BASE_EXPRESSION = "Calculadora basica";

const displayExpression = document.getElementById("displayExpression");
const displayValue = document.getElementById("displayValue");
const calculatorStatus = document.getElementById("calculatorStatus");
const calcButtons = document.querySelectorAll(".calc-key");

const operatorLabels = {
  add: "+",
  subtract: "-",
  multiply: "x",
  divide: "/"
};

const state = {
  displayValue: "0",
  firstOperand: null,
  operator: null,
  waitingForSecondOperand: false,
  justEvaluated: false,
  lastOperator: null,
  lastSecondOperand: null,
  expression: BASE_EXPRESSION,
  statusMessage: "Lista para calcular."
};

function normalizeNumber(number) {
  return parseFloat(Number(number).toPrecision(12));
}

function toCalculatorString(number) {
  const normalized = normalizeNumber(number);

  if (!Number.isFinite(normalized)) {
    return "Error";
  }

  return String(normalized);
}

function formatDisplayNumber(value) {
  if (value === "Error") {
    return "Error";
  }

  const isNegative = value.startsWith("-");
  const unsignedValue = isNegative ? value.slice(1) : value;
  const hasDecimal = unsignedValue.includes(".");
  const [integerPartRaw, decimalPart = ""] = unsignedValue.split(".");
  const integerPart = integerPartRaw === "" ? "0" : integerPartRaw;
  const formattedInteger = Number(integerPart).toLocaleString("es-EC");
  let formattedValue = isNegative ? `-${formattedInteger}` : formattedInteger;

  if (hasDecimal) {
    formattedValue += `,${decimalPart}`;
  }

  return formattedValue;
}

function formatHistoryNumber(number) {
  return formatDisplayNumber(toCalculatorString(number));
}

function setStatus(message) {
  state.statusMessage = message;
}

function updateDisplay() {
  displayExpression.textContent = state.expression || BASE_EXPRESSION;
  displayValue.textContent = formatDisplayNumber(state.displayValue);
  calculatorStatus.textContent = state.statusMessage;
}

function resetCoreState() {
  state.displayValue = "0";
  state.firstOperand = null;
  state.operator = null;
  state.waitingForSecondOperand = false;
  state.justEvaluated = false;
  state.lastOperator = null;
  state.lastSecondOperand = null;
  state.expression = BASE_EXPRESSION;
}

function clearAll() {
  resetCoreState();
  setStatus("Calculadora reiniciada.");
  updateDisplay();
}

function clearEntry() {
  state.displayValue = "0";
  setStatus("Entrada actual borrada.");
  updateDisplay();
}

function backspace() {
  if (state.displayValue === "Error" || state.waitingForSecondOperand) {
    return;
  }

  if (state.displayValue.length === 1 || (state.displayValue.length === 2 && state.displayValue.startsWith("-"))) {
    state.displayValue = "0";
  } else {
    state.displayValue = state.displayValue.slice(0, -1);
  }

  setStatus("Se elimino el ultimo digito.");
  updateDisplay();
}

function prepareForInputAfterError() {
  if (state.displayValue === "Error") {
    resetCoreState();
  }
}

function inputDigit(digit) {
  prepareForInputAfterError();

  if (state.waitingForSecondOperand) {
    state.displayValue = digit;
    state.waitingForSecondOperand = false;
  } else if (state.justEvaluated && state.operator === null) {
    state.displayValue = digit;
    state.expression = BASE_EXPRESSION;
    state.justEvaluated = false;
  } else if (state.displayValue === "0") {
    state.displayValue = digit;
  } else {
    state.displayValue += digit;
  }

  setStatus("Ingresando numero.");
  updateDisplay();
}

function inputDecimal() {
  prepareForInputAfterError();

  if (state.waitingForSecondOperand) {
    state.displayValue = "0.";
    state.waitingForSecondOperand = false;
  } else if (state.justEvaluated && state.operator === null) {
    state.displayValue = "0.";
    state.expression = BASE_EXPRESSION;
    state.justEvaluated = false;
  } else if (!state.displayValue.includes(".")) {
    state.displayValue += ".";
  }

  setStatus("Decimal agregado.");
  updateDisplay();
}

function performCalculation(firstOperand, secondOperand, operator) {
  switch (operator) {
    case "add":
      return normalizeNumber(firstOperand + secondOperand);
    case "subtract":
      return normalizeNumber(firstOperand - secondOperand);
    case "multiply":
      return normalizeNumber(firstOperand * secondOperand);
    case "divide":
      if (secondOperand === 0) {
        return null;
      }

      return normalizeNumber(firstOperand / secondOperand);
    default:
      return secondOperand;
  }
}

function showError(message) {
  resetCoreState();
  state.displayValue = "Error";
  state.expression = message;
  setStatus(message);
  updateDisplay();
}

function handleOperator(nextOperator) {
  prepareForInputAfterError();

  const inputValue = Number(state.displayValue);

  if (state.operator && state.waitingForSecondOperand) {
    state.operator = nextOperator;
    state.expression = `${formatHistoryNumber(state.firstOperand)} ${operatorLabels[nextOperator]}`;
    setStatus("Operador actualizado.");
    updateDisplay();
    return;
  }

  if (state.firstOperand === null) {
    state.firstOperand = inputValue;
  } else if (state.operator) {
    const result = performCalculation(state.firstOperand, inputValue, state.operator);

    if (result === null) {
      showError("No se puede dividir para cero.");
      return;
    }

    state.displayValue = toCalculatorString(result);
    state.firstOperand = result;
  }

  state.operator = nextOperator;
  state.waitingForSecondOperand = true;
  state.justEvaluated = false;
  state.lastOperator = null;
  state.lastSecondOperand = null;
  state.expression = `${formatHistoryNumber(state.firstOperand)} ${operatorLabels[nextOperator]}`;

  setStatus("Esperando el siguiente numero.");
  updateDisplay();
}

function evaluate() {
  if (state.displayValue === "Error") {
    return;
  }

  if (state.operator !== null && state.firstOperand !== null && !state.waitingForSecondOperand) {
    const secondOperand = Number(state.displayValue);
    const result = performCalculation(state.firstOperand, secondOperand, state.operator);

    if (result === null) {
      showError("No se puede dividir para cero.");
      return;
    }

    const expression = `${formatHistoryNumber(state.firstOperand)} ${operatorLabels[state.operator]} ${formatHistoryNumber(secondOperand)}`;

    state.displayValue = toCalculatorString(result);
    state.expression = `${expression} =`;
    state.lastOperator = state.operator;
    state.lastSecondOperand = secondOperand;
    state.firstOperand = null;
    state.operator = null;
    state.waitingForSecondOperand = false;
    state.justEvaluated = true;

    setStatus("Resultado calculado.");
    updateDisplay();
    return;
  }

  if (state.lastOperator !== null && state.lastSecondOperand !== null) {
    const currentValue = Number(state.displayValue);
    const result = performCalculation(currentValue, state.lastSecondOperand, state.lastOperator);

    if (result === null) {
      showError("No se puede dividir para cero.");
      return;
    }

    const expression = `${formatHistoryNumber(currentValue)} ${operatorLabels[state.lastOperator]} ${formatHistoryNumber(state.lastSecondOperand)}`;

    state.displayValue = toCalculatorString(result);
    state.expression = `${expression} =`;
    state.justEvaluated = true;

    setStatus("Resultado calculado.");
    updateDisplay();
  }
}

function handleButtonAction(button) {
  const action = button.dataset.action;

  if (action === "digit") {
    inputDigit(button.dataset.value);
    return;
  }

  if (action === "decimal") {
    inputDecimal();
    return;
  }

  if (action === "clear-entry") {
    clearEntry();
    return;
  }

  if (action === "clear-all") {
    clearAll();
    return;
  }

  if (action === "backspace") {
    backspace();
    return;
  }

  if (action === "equals") {
    evaluate();
    return;
  }

  if (action === "operator") {
    handleOperator(button.dataset.operator);
  }
}

function handleKeyboardInput(event) {
  const key = event.key;
  const handledKeys = "0123456789+-*/=.,";

  if (handledKeys.includes(key) || key === "Enter" || key === "Backspace" || key === "Delete" || key === "Escape") {
    event.preventDefault();
  } else {
    return;
  }

  if (/^[0-9]$/.test(key)) {
    inputDigit(key);
    return;
  }

  if (key === "." || key === ",") {
    inputDecimal();
    return;
  }

  if (key === "+") {
    handleOperator("add");
    return;
  }

  if (key === "-") {
    handleOperator("subtract");
    return;
  }

  if (key === "*") {
    handleOperator("multiply");
    return;
  }

  if (key === "/") {
    handleOperator("divide");
    return;
  }

  if (key === "Backspace") {
    backspace();
    return;
  }

  if (key === "Delete") {
    clearEntry();
    return;
  }

  if (key === "Escape") {
    clearAll();
    return;
  }

  evaluate();
}

calcButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.classList && typeof button.classList.add === "function") {
      button.classList.add("key-activated");
      setTimeout(() => {
        button.classList.remove("key-activated");
      }, 160);
    }

    handleButtonAction(button);
  });
});

window.addEventListener("keydown", handleKeyboardInput);

window.calculatorApi = {
  state,
  inputDigit,
  inputDecimal,
  clearAll,
  clearEntry,
  backspace,
  handleOperator,
  evaluate
};

function setupRevealAnimations() {
  if (typeof document.querySelectorAll !== "function") {
    return;
  }

  const revealElements = Array.from(
    document.querySelectorAll(
      ".hero-text, .profile-card, .section-title, .card, .skills-wrapper, .calculator-app, .footer"
    )
  );

  if (revealElements.length === 0) {
    return;
  }

  revealElements.forEach((element, index) => {
    if (!element.classList || !element.style) {
      return;
    }

    element.classList.add("reveal-ready");
    element.style.setProperty("--reveal-delay", `${Math.min(index * 70, 360)}ms`);
  });

  if (typeof IntersectionObserver === "undefined") {
    revealElements.forEach((element) => {
      if (element.classList) {
        element.classList.add("is-visible");
      }
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        currentObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -48px 0px"
    }
  );

  revealElements.forEach((element) => {
    observer.observe(element);
  });
}

setupRevealAnimations();
updateDisplay();
