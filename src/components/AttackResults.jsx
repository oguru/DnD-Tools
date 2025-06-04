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
    
    // Check if this is a healing message
    const isHealingMessage = message.includes('Healing!');
    
    // Add highlighting for "Damage: X" pattern
    const damagePattern = /(Damage: )(\d+)( \w+)/g;
    let formattedMessage = message.replace(damagePattern, '$1<span class="damage-number">$2</span>$3');
    
    // Add highlighting for "Total Damage: X" pattern
    const totalDamagePattern = /(Total Damage: )(\d+)( \w+)/g;
    formattedMessage = formattedMessage.replace(totalDamagePattern, '$1<span class="damage-number">$2</span>$3');
    
    // For healing messages, use healing-number class instead
    if (isHealingMessage) {
      // Highlight numbers in healing messages
      formattedMessage = formattedMessage.replace(/(\d+)( healing)/g, 
        '<span class="healing-number">$1</span>$2');
    } else {
      // Highlight AOE damage numbers - pattern: "X damage"
      formattedMessage = formattedMessage.replace(/(\d+)( damage)/g, 
        '<span class="damage-number">$1</span>$2');
      
      // Highlight numbers in the format of "damage: X" regardless of case
      formattedMessage = formattedMessage.replace(/(damage: )(\d+)/gi, 
        '$1<span class="damage-number">$2</span>');
      
      // Highlight numbers in character AOE format "X dmg"
      formattedMessage = formattedMessage.replace(/(\d+)( dmg)/g, 
        '<span class="damage-number">$1</span>$2');
    }
    
    // Add line breaks for better readability in AOE attacks
    if (formattedMessage.includes('AoE') || formattedMessage.includes('AOE')) {
      // Convert actual newlines to <br>
      formattedMessage = formattedMessage.replace(/\n/g, '<br />');
      
      // Add line breaks after semicolons (separates individual results)
      formattedMessage = formattedMessage.replace(/; /g, ';<br />');
      
      // Add line breaks between boss/character/group names and their results
      formattedMessage = formattedMessage.replace(/(to bosses - |to groups - |to characters - )/g, '$1<br />');
    }
    
    return formattedMessage;
  };

  // Group attack results by transaction ID for multi-healing operations
  const groupResultsByTransaction = (results) => {
    const groupedResults = [];
    const processedIds = new Set();
    
    results.forEach(result => {
      // Skip if we've already processed this result
      if (processedIds.has(result.id)) return;
      
      // Check if this is part of a batch transaction (healing-timestamp-entityId format)
      const idParts = result.id.split('-');
      if (idParts.length >= 2 && idParts[0] === 'healing') {
        // This is a healing transaction, look for other results with the same transaction prefix
        const transactionPrefix = `${idParts[0]}-${idParts[1]}`;
        
        // Find all results with the same transaction prefix
        const relatedResults = results.filter(r => 
          r.id.startsWith(transactionPrefix) && !processedIds.has(r.id)
        );
        
        if (relatedResults.length > 1) {
          // Multiple related results, combine them
          const combinedResult = {
            ...result,
            id: transactionPrefix,
            message: `Healing applied to multiple entities: \n${
              relatedResults.map(r => r.message.replace('Healing! ', '')).join('\n')
            }`,
            timestamp: result.timestamp
          };
          
          // Mark all related results as processed
          relatedResults.forEach(r => processedIds.add(r.id));
          
          groupedResults.push(combinedResult);
        } else {
          // Single result, add as is
          processedIds.add(result.id);
          groupedResults.push(result);
        }
      } else {
        // Not a batch transaction, add as is
        processedIds.add(result.id);
        groupedResults.push(result);
      }
    });
    
    return groupedResults;
  };

  // Only show the most recent maxResults, in reverse chronological order
  const visibleResults = groupResultsByTransaction([...(attackResults || [])])
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, maxResults);

  return (
    <div className="attack-results">
      <div className="section-header">
        <h3>Combat Log</h3>
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