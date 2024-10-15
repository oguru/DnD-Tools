import './App.css';

import {
  Link,
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes
} from "react-router-dom";

import AspectDescriptions from './pages/AspectDescriptions';
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
          </ul>
        </nav>

        <Routes>
        <Route path="/" element={<Navigate to="/secret-messages" replace />} />
          <Route path="/secret-messages" element={<SecretMessages />} />
          <Route path="/limbo" element={<AspectDescriptions />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
