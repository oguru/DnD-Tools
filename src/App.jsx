import './styles/global.css';
import './App.css';

import {
  Link,
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes
} from "react-router-dom";

import AllAspects from './pages/AllAspects';
import AspectDescriptions from './pages/AspectDescriptions';
import DiscoveredAspects from './pages/DiscoveredAspects';
import DivinePowers from './pages/DivinePowers';
import GroupAttackCalculator from './components/GroupAttackCalculator';
import LimboInfo from './pages/LimboInfo';
import SecretMessages from './pages/SecretMessages';
import SwarmAttackPage from './pages/SwarmAttackPage';
import RandomTables from './pages/RandomTablesPage';

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
                  <option style={{fontWeight: "bold"}} disabled value="">Player Info</option>
                  <option value="/limbo-info">Limbo</option>
                  <option value="/all-aspects">All Aspects</option>
                  <option value="/discovered-aspects">Discovered Aspects</option>
                  <option value="/divine-powers">Divine Powers</option>
                </select>
              </div>
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
                  <option style={{fontWeight: "bold"}} disabled value="">Tools</option>
                  <option value="/player-info/wild-surges">Random Tables</option>
                  <option value="/swarm-attack">Swarm Attack</option>
                  <option value="/group-attack">Group Attack</option>
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
          <Route path="/discovered-aspects" element={<DiscoveredAspects />} />
          <Route path="/all-aspects" element={<AllAspects />} />
          <Route path="/divine-powers" element={<DivinePowers />} />
          <Route path="/player-info/wild-surges" element={<RandomTables />} />
          <Route path="/swarm-attack" element={<SwarmAttackPage />} />
          <Route path="/group-attack" element={<GroupAttackCalculator />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
