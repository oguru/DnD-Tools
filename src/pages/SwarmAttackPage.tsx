import PageLayout from '../components/PageLayout';
import SwarmAttackCalculator from '../components/SwarmAttackCalculator';
import React from 'react';

const SwarmAttackPage: React.FC = () => {
  return (
    <PageLayout title="Swarm Attack Calculator">
      <SwarmAttackCalculator />
    </PageLayout>
  );
};

export default SwarmAttackPage;

