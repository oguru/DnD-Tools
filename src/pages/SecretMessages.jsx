import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import database, { auth } from '../firebaseConfig';
import { onValue, ref, set } from 'firebase/database';
import { useEffect, useRef, useState } from 'react';

import Typewriter from 'typewriter-effect';

export default function SecretMessages() {
  const [input, setInput] = useState('');
  const [roll, setRoll] = useState(10);
  const [amendedInput, setAmendedInput] = useState(null);
  const [user, setUser] = useState(null);
  const typewriterRef = useRef(null);
  const [key, setKey] = useState(0);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    // Listen for changes in the database
    const messageRef = ref(database, 'secretMessage');
    onValue(messageRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (data.message !== amendedInput) {
          setAmendedInput(data.message);
          if (typewriterRef.current) {
            typewriterRef.current.deleteAll(5).typeString(data.message).start();
          }
        }
      } else {
        setAmendedInput(null);
        if (typewriterRef.current) {
          typewriterRef.current.deleteAll(5);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  function rollToPercentage(roll) {
    return roll * 5;
  }

  function mapStringWithDiceRoll(inputString, roll) {
    const percentage = rollToPercentage(roll);
    let result = '';

    for (let char of inputString) {
      const randomValue = Math.random() * 100;
      if (char === ' ') {
        result += ' ';
      } else if (randomValue < percentage) {
        result += char;
      } else {
        result += '#';
      }
    }

    return result;
  }

  const handleGoClick = () => {
    const newAmendedInput = mapStringWithDiceRoll(input, roll);
    
    // Save to database
    set(ref(database, 'secretMessage'), {
      message: newAmendedInput
    });
  };

  const handleRollChange = (newRoll) => {
    newRoll = Math.max(1, Math.min(20, newRoll)); // Ensure roll is between 1 and 20
    setRoll(newRoll);
  };

  const handleSignIn = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch((error) => {
      console.error("Error signing in with Google", error);
    });
  };

  const handleSignOut = () => {
    signOut(auth).catch((error) => {
      console.error("Error signing out", error);
    });
  };

  const handleClear = () => {
    // Clear the database
    setInput("");
    setRoll(10);
    set(ref(database, 'secretMessage'), null);
    setKey(prevKey => prevKey + 1);
  };

  const isAuthorized = user && user.email === 'gmdndbeyond@gmail.com';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{ flex: 1 }}>
        <h2>Secret Messages</h2>
        {!user && (
          <button onClick={handleSignIn}>Sign In with Google</button>
        )}
        <div style={{display: "flex", marginBottom: "20px"}}>
          {isAuthorized && (
            <input
              placeholder="secret message"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ color: 'transparent', flexGrow: "1" }}
            />
          )}
          {user && (
            <input 
              type="number" 
              placeholder="roll" 
              value={roll} 
              style={{flexShrink: 1}} 
              onChange={(e) => handleRollChange(+e.target.value)} 
              min="1"
              max="20"
            />
          )}
          {isAuthorized && (
            <>
              <button
                style={{border: "grey 1px solid"}}
                onClick={handleClear}
              >
                Clear
              </button>
              <button
                style={{border: "grey 1px solid"}}
                onClick={handleGoClick}
              >
                Go
              </button>
            </>
          )}
        </div>
        {amendedInput && (
          <>
            <hr />
            <div style={{height: '100px', overflow: 'hidden'}}>
              <Typewriter
                key={key}
                onInit={(typewriter) => {
                  typewriterRef.current = typewriter;
                  if (amendedInput) {
                    typewriter.typeString(amendedInput).start();
                  }
                }}
                options={{
                  delay: 50,
                }}
              />
            </div>
          </>
        )}
        {!isAuthorized && user && (
          <p>You do not have access to create secret messages.</p>
        )}
      </div>
      {user && (
        <div style={{ marginTop: 'auto', padding: '20px' }}>
          <button onClick={handleSignOut}>Sign Out</button>
        </div>
      )}
    </div>
  );
}
