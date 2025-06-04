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
  
  // Format message to highlight damage numbers
  const formatMessage = (message) => {
    if (!message) return '';
    
    // Add highlighting for "Damage: X" pattern
    const damagePattern = /(Damage: )(\d+)( \w+)/g;
    let formattedMessage = message.replace(damagePattern, '$1<span class="damage-number">$2</span>$3');
    
    // Add highlighting for "Total Damage: X" pattern
    const totalDamagePattern = /(Total Damage: )(\d+)( \w+)/g;
    formattedMessage = formattedMessage.replace(totalDamagePattern, '$1<span class="damage-number">$2</span>$3');
    
    // Highlight AOE damage numbers - pattern: "X damage"
    formattedMessage = formattedMessage.replace(/(\d+)( damage)/g, 
      '<span class="damage-number">$1</span>$2');
    
    // Highlight numbers in the format of "damage: X" regardless of case
    formattedMessage = formattedMessage.replace(/(damage: )(\d+)/gi, 
      '$1<span class="damage-number">$2</span>');
    
    // Highlight numbers in character AOE format "X dmg"
    formattedMessage = formattedMessage.replace(/(\d+)( dmg)/g, 
      '<span class="damage-number">$1</span>$2');
    
    // Add line breaks between targets for AoE attacks for better readability
    if (formattedMessage.includes('AoE') || formattedMessage.includes('AOE')) {
      // Add line breaks after semicolons (separates individual results)
      formattedMessage = formattedMessage.replace(/; /g, ';<br />');
      
      // Add line breaks between boss/character/group names and their results
      formattedMessage = formattedMessage.replace(/(to bosses - |to groups - |to characters - )/g, '$1<br />');
    }
    
    return formattedMessage;
  };

  // Only show the most recent maxResults, in reverse chronological order
  const visibleResults = [...(attackResults || [])]
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, maxResults);

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
                    <div 
                      className="result-message"
                      dangerouslySetInnerHTML={{ __html: formatMessage(result.message) }}
                    />
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