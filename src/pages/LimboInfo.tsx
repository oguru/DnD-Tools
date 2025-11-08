import '../styles/LimboInfo.css';

import PageLayout from '../components/PageLayout';
import React from 'react';

const LimboInfo: React.FC = () => {
  return (
    <PageLayout title="Limbo Defensive Options">
      <div className="abilities-container">
        <div className="ability-card">
          <div className="ability-header">
            <h2>Create Barrier - Strength Check</h2>
          </div>
          <p className="ability-quote">"You raise a crystalline wall from the earth itself..."</p>
          <p className="ability-success">Success: Creates a substantial crystalline barrier that absorbs incoming damage</p>
        </div>

        <div className="ability-card">
          <div className="ability-header">
            <h2>Redirect Energy - Arcana Check</h2>
          </div>
          <p className="ability-quote">"You tap into the shard's magical energy, attempting to convert it..."</p>
          <p className="ability-success">Success: Converts incoming damage into healing energy for the Spire</p>
        </div>

        <div className="ability-card">
          <div className="ability-header">
            <h2>Counter Strike - Intelligence Check</h2>
          </div>
          <p className="ability-quote">"You analyze the shard's trajectory, preparing to turn it against the Colossus..."</p>
          <p className="ability-success">Success: Partially blocks the attack while reflecting energy back at the Colossus</p>
        </div>

        <div className="ability-card">
          <div className="ability-header">
            <h2>Disrupt Attack - Wisdom Check</h2>
          </div>
          <p className="ability-quote">"You interfere with the shard's crystalline structure..."</p>
          <p className="ability-success">Success: Reduces incoming damage and weakens the next attack</p>
        </div>
      </div>
    </PageLayout>
  );
};

export default LimboInfo;

