import '../styles/AttackResults.css';

import useDnDStore from '../store/dndStore';
import { useState } from 'react';

const AttackResults = () => {
  const {
    attackResults = [], // Default to empty array if undefined
    expandedSections,
    toggleSection,
    clearAttackResults,
    removeAttackResult
  } = useDnDStore();

  // State for controlling how many results to show
  const [maxResults, setMaxResults] = useState(10);

  // Handle showing more results
  const handleShowMore = () => {
    setMaxResults(prev => prev + 10);
  };

  // Handle clearing all results
  const handleClearResults = () => {
    if (confirm('Are you sure you want to clear all attack results?')) {
      clearAttackResults();
    }
  };

  // Format timestamp to readable date/time
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Only show the most recent maxResults, in reverse chronological order
  const visibleResults = [...(attackResults || [])].reverse().slice(0, maxResults);

  return (
    <div className="attack-results">
      <div className="section-header">
        <h3>Attack Results</h3>
        <button
          className="toggle-section-button"
          onClick={() => toggleSection('results')}
        >
          {expandedSections?.results ? 'Hide Results' : 'Show Results'}
        </button>
      </div>

      {expandedSections?.results && (
        <>
          {(attackResults?.length > 0) ? (
            <>
              <div className="results-controls">
                <button
                  className="clear-results-button"
                  onClick={handleClearResults}
                >
                  Clear All Results
                </button>
              </div>
              
              <div className="results-list">
                {visibleResults.map(result => (
                  <div key={result.id} className={`result-card ${result.isAoE ? 'aoe-result' : ''}`}>
                    <div className="result-header">
                      <div className="result-time">{formatTimestamp(result.timestamp)}</div>
                      <button
                        className="dismiss-result-button"
                        onClick={() => removeAttackResult(result.id)}
                        title="Dismiss"
                      >
                        ×
                      </button>
                    </div>
                    <pre className="result-message">{result.message}</pre>
                  </div>
                ))}
              </div>
              
              {attackResults?.length > maxResults && (
                <button
                  className="show-more-button"
                  onClick={handleShowMore}
                >
                  Show More
                </button>
              )}
            </>
          ) : (
            <div className="no-results-message">
              <p>No attack results yet. Attack a target to see results here.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AttackResults; 