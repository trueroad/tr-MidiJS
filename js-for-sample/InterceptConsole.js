/**
 * Intercept console.log.
 * @module InterceptConsole
 * @author Masamichi Hosoda <trueroad@trueroad.jp>
 * @copyright (C) Masamichi Hosoda 2023
 * @license BSD-2-Clause
 * @see {@link https://github.com/trueroad/tr-MidiJS}
 */

//
// Save original console.log.
//

const consoleLogOriginal = console.log;

//
// Element ID
//

// Button
const interceptStartButton =
      document.getElementById("interceptStartButton");
const interceptStopButton =
      document.getElementById("interceptStopButton");
const clearInterceptLogButton =
      document.getElementById("clearInterceptLogButton");

// Log textarea
const interceptLog = document.getElementById("interceptLog");

//
// Pseudo console.log
//

function consoleLogPseudo(arg) {
  // Logging
  interceptLog.value = interceptLog.value + arg + "\n";
  // Scrolling
  interceptLog.scrollTop = interceptLog.scrollHeight;
}

//
// Add event listener.
//

interceptStartButton &&
  interceptStartButton.addEventListener("click", () => {
    console.log = consoleLogPseudo;
  });
interceptStopButton &&
  interceptStopButton.addEventListener("click", () => {
    console.log = consoleLogOriginal;
  });
clearInterceptLogButton &&
  clearInterceptLogButton.addEventListener("click", () => {
    interceptLog.value = "";
  });
