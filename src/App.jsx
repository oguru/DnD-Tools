import './App.css';

import {
  Link,
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes
} from "react-router-dom";

import AspectDescriptions from './pages/AspectDescriptions';
import LimboInfo from './pages/LimboInfo';
import SecretMessages from './pages/SecretMessages';

function App() {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/secret-messages">Secret Messages</Link>
            </li>
            <li>
              <Link to="/limbo">Aspect Descriptions</Link>
            </li>
            <li>
              <div className="nav-dropdown">
                <select 
                  onChange={(e) => {
                    if (e.target.value) {
                      window.location.href = e.target.value;
                      e.target.value = ''; // Reset to default option
                    }
                  }}
                  value=""
                >
                  <option value="">Player Info</option>
                  <option value="/limbo-info">Limbo</option>
                </select>
              </div>
            </li>
          </ul>
        </nav>

        <Routes>
          <Route path="/" element={<Navigate to="/secret-messages" replace />} />
          <Route path="/secret-messages" element={<SecretMessages />} />
          <Route path="/limbo" element={<AspectDescriptions />} />
          <Route path="/limbo-info" element={<LimboInfo />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
