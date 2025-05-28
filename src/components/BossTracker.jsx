import '../styles/BossTracker.css';

import useDnDStore from '../store/dndStore';

const BossTracker = () => {
  // This component has been deprecated - its functionality has been moved to GroupsSection
  const { expandedSections, toggleSection } = useDnDStore();

  // Display a message to the user
  return (
    <div className="boss-tracker">
      <div className="section-header">
        <h3>Boss Tracker</h3>
        <button
          className="toggle-section-button"
          onClick={() => toggleSection('bosses')}
        >
          {expandedSections.bosses ? 'Hide Bosses' : 'Show Bosses'}
        </button>
      </div>

      {expandedSections.bosses && (
        <div className="boss-tracker-info">
          <p>The boss tracker functionality has been moved to the &quot;Enemy Groups &amp; Bosses&quot; section.</p>
          <p>You can now manage bosses, their attacks, and target characters directly from there.</p>
        </div>
      )}
    </div>
  );
};

export default BossTracker; 