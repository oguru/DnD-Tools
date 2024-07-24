import './App.css';

import reactLogo from './assets/react.svg';
import { useState } from 'react';
import viteLogo from '/vite.svg';

function App() {
  const [input, setInput] = useState('');
  const [roll, setRoll] = useState();
  const [amendedInput, setAmendedInput] = useState();

  function rollToPercentage(roll) {
    return (roll) * 5;
  }

  function mapStringWithDiceRoll(inputString, roll) {
    const percentage = rollToPercentage(roll);
    let result = '';

    for (let char of inputString) {
      const randomValue = Math.random() * 100; // Generate a random number between 0 and 100
      if (char == ' ') {
        result += ' ';
      } else if (randomValue < percentage) {
        result += char;
      } else {
        result += '#';
      }
    }

    return result;
  }
  return (
    <>
      <h2>Secret Messages</h2>
      <div style={{display: "flex",marginBottom: "20px"}}>
        <input
          placeholder="secret message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ color: 'transparent', flexGrow: "1" }}
        />
        <input placeholder="roll" value={roll} style={{flexShrink: 1}} onChange={(e) => setRoll(+e.target.value)} />
        <button
          style={{border: "grey 1px solid"}}
          onClick={() => {
            setAmendedInput(null)
            setInput("")
            setRoll(null)
          }}
        >
          Clear
        </button>
        <button
          style={{border: "grey 1px solid"}}
          onClick={() => setAmendedInput(mapStringWithDiceRoll(input, roll))}
        >
          Go
        </button>
        </div>
        {amendedInput && (
          <>
            <hr />
            <p>Message: {amendedInput}</p>
          </>
        )}
    </>
  );
}

export default App;
