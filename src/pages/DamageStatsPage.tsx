import PageLayout from '../components/PageLayout';
import DamageStatsRoller from '../components/DamageStatsRoller';
import React from 'react';

const DamageStatsPage: React.FC = () => {
  return (
    <PageLayout title="Damage Min/Avg/Max">
      <div style={{maxWidth: '720px'}}>
        <p>Enter dice and bonus to compute minimum, average, and maximum damage for expressions like <strong>10d8+10</strong>.</p>
        <DamageStatsRoller />
      </div>
    </PageLayout>
  );
};

export default DamageStatsPage;

