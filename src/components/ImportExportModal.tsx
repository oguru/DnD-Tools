import '../styles/ImportExportModal.css';

import React, { useRef, useState } from 'react';

import PropTypes from 'prop-types';
import useDnDStore from '../store/dndStore';

const ImportExportModal = ({ isOpen, onClose, initialMode = 'export' }) => {
  const {
    characters,
    bosses,
    enemyGroups,
    exportStateSelective,
    importStateSelective
  } = useDnDStore();

  const [mode, setMode] = useState(initialMode); // 'export' or 'import'
  const [importFile, setImportFile] = useState(null);
  const fileInputRef = useRef(null);
  const [fileData, setFileData] = useState(null);

  // State to track which entity types are present in the file
  const [hasCharactersInFile, setHasCharactersInFile] = useState(true);
  const [hasBossesInFile, setHasBossesInFile] = useState(true);
  const [hasGroupsInFile, setHasGroupsInFile] = useState(true);

  // State for selections
  const [includeCharacters, setIncludeCharacters] = useState(true);
  const [includeBosses, setIncludeBosses] = useState(true);
  const [includeGroups, setIncludeGroups] = useState(true);

  // State for individual selections
  const [selectedCharacters, setSelectedCharacters] = useState([]);
  const [selectedBosses, setSelectedBosses] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);

  // State for "select all" checkboxes
  const [selectAllCharacters, setSelectAllCharacters] = useState(true);
  const [selectAllBosses, setSelectAllBosses] = useState(true);
  const [selectAllGroups, setSelectAllGroups] = useState(true);

  // State for import options
  const [mergeCharacters, setMergeCharacters] = useState(false);
  const [mergeBosses, setMergeBosses] = useState(false);
  const [mergeGroups, setMergeGroups] = useState(false);

  // State for what to do with missing entity types
  const [clearMissingCharacters, setClearMissingCharacters] = useState(false);
  const [clearMissingBosses, setClearMissingBosses] = useState(false);
  const [clearMissingGroups, setClearMissingGroups] = useState(false);

  // Initialize selections whenever includeX changes
  React.useEffect(() => {
    if (includeCharacters && selectAllCharacters) {
      setSelectedCharacters(characters.map(char => char.id));
    } else if (!includeCharacters) {
      setSelectedCharacters([]);
    }
  }, [includeCharacters, selectAllCharacters, characters]);

  React.useEffect(() => {
    if (includeBosses && selectAllBosses) {
      setSelectedBosses(bosses.map(boss => boss.id));
    } else if (!includeBosses) {
      setSelectedBosses([]);
    }
  }, [includeBosses, selectAllBosses, bosses]);

  React.useEffect(() => {
    if (includeGroups && selectAllGroups) {
      setSelectedGroups(enemyGroups.map(group => group.id));
    } else if (!includeGroups) {
      setSelectedGroups([]);
    }
  }, [includeGroups, selectAllGroups, enemyGroups]);

  // Handle file selection for import
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImportFile(file);
      
      // Read and parse the file to analyze its contents
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const jsonData = JSON.parse(event.target.result);
          setFileData(jsonData);
          
          // Check which entity types are present in the file
          const hasCharacters = Boolean(jsonData.characters && Array.isArray(jsonData.characters) && jsonData.characters.length > 0);
          const hasBosses = Boolean(jsonData.bosses && Array.isArray(jsonData.bosses) && jsonData.bosses.length > 0);
          const hasGroups = Boolean(jsonData.enemyGroups && Array.isArray(jsonData.enemyGroups) && jsonData.enemyGroups.length > 0);
          
          setHasCharactersInFile(hasCharacters);
          setHasBossesInFile(hasBosses);
          setHasGroupsInFile(hasGroups);
          
          // Update the import options based on what's in the file
          setIncludeCharacters(hasCharacters);
          setIncludeBosses(hasBosses);
          setIncludeGroups(hasGroups);
        } catch (error) {
          console.error('Error parsing JSON file:', error);
          alert('Invalid JSON file. Please select a properly formatted file.');
          setImportFile(null);
          setFileData(null);
        }
      };
      reader.readAsText(file);
    } else {
      setImportFile(null);
      setFileData(null);
      // Reset to default state
      setHasCharactersInFile(true);
      setHasBossesInFile(true);
      setHasGroupsInFile(true);
    }
  };

  // Toggle individual character selection
  const toggleCharacterSelection = (charId) => {
    setSelectedCharacters(prev => {
      if (prev.includes(charId)) {
        const newSelection = prev.filter(id => id !== charId);
        setSelectAllCharacters(newSelection.length === characters.length);
        return newSelection;
      } else {
        const newSelection = [...prev, charId];
        setSelectAllCharacters(newSelection.length === characters.length);
        return newSelection;
      }
    });
  };

  // Toggle individual boss selection
  const toggleBossSelection = (bossId) => {
    setSelectedBosses(prev => {
      if (prev.includes(bossId)) {
        const newSelection = prev.filter(id => id !== bossId);
        setSelectAllBosses(newSelection.length === bosses.length);
        return newSelection;
      } else {
        const newSelection = [...prev, bossId];
        setSelectAllBosses(newSelection.length === bosses.length);
        return newSelection;
      }
    });
  };

  // Toggle individual group selection
  const toggleGroupSelection = (groupId) => {
    setSelectedGroups(prev => {
      if (prev.includes(groupId)) {
        const newSelection = prev.filter(id => id !== groupId);
        setSelectAllGroups(newSelection.length === enemyGroups.length);
        return newSelection;
      } else {
        const newSelection = [...prev, groupId];
        setSelectAllGroups(newSelection.length === enemyGroups.length);
        return newSelection;
      }
    });
  };

  // Toggle "select all" for each entity type
  const toggleSelectAllCharacters = () => {
    if (selectAllCharacters) {
      setSelectedCharacters([]);
    } else {
      setSelectedCharacters(characters.map(char => char.id));
    }
    setSelectAllCharacters(!selectAllCharacters);
  };

  const toggleSelectAllBosses = () => {
    if (selectAllBosses) {
      setSelectedBosses([]);
    } else {
      setSelectedBosses(bosses.map(boss => boss.id));
    }
    setSelectAllBosses(!selectAllBosses);
  };

  const toggleSelectAllGroups = () => {
    if (selectAllGroups) {
      setSelectedGroups([]);
    } else {
      setSelectedGroups(enemyGroups.map(group => group.id));
    }
    setSelectAllGroups(!selectAllGroups);
  };

  // Handle export button click
  const handleExport = () => {
    exportStateSelective({
      includeCharacters,
      includeBosses,
      includeGroups,
      selectedCharacters: selectAllCharacters ? [] : selectedCharacters,
      selectedBosses: selectAllBosses ? [] : selectedBosses,
      selectedGroups: selectAllGroups ? [] : selectedGroups
    });
    onClose();
  };

  // Handle import button click
  const handleImport = () => {
    if (!importFile) {
      alert('Please select a file to import');
      return;
    }

    // If we've already parsed the file data, use it directly
    if (fileData) {
      const importOptions = {
        includeCharacters: hasCharactersInFile && includeCharacters,
        includeBosses: hasBossesInFile && includeBosses,
        includeGroups: hasGroupsInFile && includeGroups,
        mergeCharacters,
        mergeBosses,
        mergeGroups,
        clearMissingCharacters: !hasCharactersInFile && clearMissingCharacters,
        clearMissingBosses: !hasBossesInFile && clearMissingBosses,
        clearMissingGroups: !hasGroupsInFile && clearMissingGroups
      };

      const result = importStateSelective(JSON.stringify(fileData), importOptions);
      
      if (result) {
        alert('Import successful!');
        onClose();
      } else {
        alert('Error importing data. Please check the file format.');
      }
    } else {
      // Fallback to original method if file data isn't available
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importOptions = {
            includeCharacters,
            includeBosses,
            includeGroups,
            mergeCharacters,
            mergeBosses,
            mergeGroups
          };
          
          const result = importStateSelective(event.target.result, importOptions);

          if (result) {
            alert('Import successful!');
            onClose();
          } else {
            alert('Error importing data. Please check the file format.');
          }
        } catch (error) {
          alert('Invalid JSON file. Please select a properly formatted file.');
        }
      };
      reader.readAsText(importFile);
    }
  };

  // If the modal is not open, don't render anything
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="import-export-modal">
        <div className="modal-header">
          <h3>{mode === 'export' ? 'Export Data' : 'Import Data'}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-tabs">
          <button 
            className={`tab-button ${mode === 'export' ? 'active' : ''}`}
            onClick={() => setMode('export')}
          >
            Export
          </button>
          <button 
            className={`tab-button ${mode === 'import' ? 'active' : ''}`}
            onClick={() => setMode('import')}
          >
            Import
          </button>
        </div>

        <div className="modal-content">
          {mode === 'export' ? (
            <div className="export-section">
              <div className="selection-section">
                <h4>Select What to Export</h4>
                
                {/* Characters Section */}
                <div className="entity-section">
                  <div className="entity-header">
                    <label className="entity-checkbox">
                      <input 
                        type="checkbox" 
                        checked={includeCharacters} 
                        onChange={() => setIncludeCharacters(!includeCharacters)} 
                      />
                      <span>Characters</span>
                    </label>
                    {includeCharacters && characters.length > 0 && (
                      <label className="select-all-checkbox">
                        <input 
                          type="checkbox" 
                          checked={selectAllCharacters} 
                          onChange={toggleSelectAllCharacters} 
                        />
                        <span>{selectAllCharacters ? 'Deselect All' : 'Select All'}</span>
                      </label>
                    )}
                  </div>
                  
                  {includeCharacters && characters.length > 0 && (
                    <div className="entity-list">
                      {characters.map(char => (
                        <label key={char.id} className="entity-item">
                          <input 
                            type="checkbox" 
                            checked={selectedCharacters.includes(char.id)} 
                            onChange={() => toggleCharacterSelection(char.id)} 
                          />
                          <span>{char.name || 'Unnamed Character'}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {includeCharacters && characters.length === 0 && (
                    <div className="no-entities-message">No characters available</div>
                  )}
                </div>
                
                {/* Bosses Section */}
                <div className="entity-section">
                  <div className="entity-header">
                    <label className="entity-checkbox">
                      <input 
                        type="checkbox" 
                        checked={includeBosses} 
                        onChange={() => setIncludeBosses(!includeBosses)} 
                      />
                      <span>Bosses</span>
                    </label>
                    {includeBosses && bosses.length > 0 && (
                      <label className="select-all-checkbox">
                        <input 
                          type="checkbox" 
                          checked={selectAllBosses} 
                          onChange={toggleSelectAllBosses} 
                        />
                        <span>{selectAllBosses ? 'Deselect All' : 'Select All'}</span>
                      </label>
                    )}
                  </div>
                  
                  {includeBosses && bosses.length > 0 && (
                    <div className="entity-list">
                      {bosses.map(boss => (
                        <label key={boss.id} className="entity-item">
                          <input 
                            type="checkbox" 
                            checked={selectedBosses.includes(boss.id)} 
                            onChange={() => toggleBossSelection(boss.id)} 
                          />
                          <span>{boss.name || 'Unnamed Boss'}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {includeBosses && bosses.length === 0 && (
                    <div className="no-entities-message">No bosses available</div>
                  )}
                </div>
                
                {/* Groups Section */}
                <div className="entity-section">
                  <div className="entity-header">
                    <label className="entity-checkbox">
                      <input 
                        type="checkbox" 
                        checked={includeGroups} 
                        onChange={() => setIncludeGroups(!includeGroups)} 
                      />
                      <span>Enemy Groups</span>
                    </label>
                    {includeGroups && enemyGroups.length > 0 && (
                      <label className="select-all-checkbox">
                        <input 
                          type="checkbox" 
                          checked={selectAllGroups} 
                          onChange={toggleSelectAllGroups} 
                        />
                        <span>{selectAllGroups ? 'Deselect All' : 'Select All'}</span>
                      </label>
                    )}
                  </div>
                  
                  {includeGroups && enemyGroups.length > 0 && (
                    <div className="entity-list">
                      {enemyGroups.map(group => (
                        <label key={group.id} className="entity-item">
                          <input 
                            type="checkbox" 
                            checked={selectedGroups.includes(group.id)} 
                            onChange={() => toggleGroupSelection(group.id)} 
                          />
                          <span>{group.name || 'Unnamed Group'}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {includeGroups && enemyGroups.length === 0 && (
                    <div className="no-entities-message">No enemy groups available</div>
                  )}
                </div>
              </div>
              
              <div className="export-actions">
                <button 
                  className="export-button"
                  onClick={handleExport}
                  disabled={!includeCharacters && !includeBosses && !includeGroups}
                >
                  Export Selected Data
                </button>
              </div>
            </div>
          ) : (
            <div className="import-section">
              <div className="file-selection">
                <h4>Select File to Import</h4>
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleFileChange}
                  ref={fileInputRef}
                />
                <div className="file-name">
                  {importFile ? importFile.name : 'No file selected'}
                </div>
                {importFile && fileData && (
                  <div className="file-contents-summary">
                    <h5>File contains:</h5>
                    <ul>
                        {hasCharactersInFile && (
                            <li className={!includeCharacters && "disabled"} 
                                onClick={() => setIncludeCharacters(!includeCharacters)}
                            >Characters</li>
                        )}
                        {hasBossesInFile && (
                            <li 
                                className={!includeBosses && "disabled"} 
                                onClick={() => setIncludeBosses(!includeBosses)}
                            >Bosses</li>
                        )}
                        {hasGroupsInFile && (
                            <li
                                className={!includeGroups && "disabled"} 
                                onClick={() => setIncludeGroups(!includeGroups)}
                            >Groups</li>
                        )}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="import-options">
                <h4>Import Options</h4>
                
                {/* Characters Import Options */}
                <div className="entity-import-option">
                  <label className={`entity-checkbox ${!hasCharactersInFile ? 'disabled' : ''}`}>
                    <input 
                      type="checkbox" 
                      checked={includeCharacters && hasCharactersInFile}
                      onChange={() => setIncludeCharacters(!includeCharacters)}
                      disabled={!hasCharactersInFile}
                    />
                    <span>Import Characters {!hasCharactersInFile && '(Not in file)'}</span>
                  </label>
                  {includeCharacters && hasCharactersInFile && (
                    <div className="merge-option">
                      <label>
                        <input 
                          type="radio" 
                          name="character-merge" 
                          checked={!mergeCharacters} 
                          onChange={() => setMergeCharacters(false)} 
                        />
                        <span>Replace existing characters</span>
                      </label>
                      <label>
                        <input 
                          type="radio" 
                          name="character-merge" 
                          checked={mergeCharacters} 
                          onChange={() => setMergeCharacters(true)} 
                        />
                        <span>Add to existing characters</span>
                      </label>
                    </div>
                  )}
                  {!hasCharactersInFile && (
                    <div className="missing-entity-option">
                      <label>
                        <input 
                          type="checkbox"
                          checked={clearMissingCharacters}
                          onChange={() => setClearMissingCharacters(!clearMissingCharacters)}
                        />
                        <span>Clear existing characters</span>
                      </label>
                      <div className="missing-note">
                        {clearMissingCharacters 
                          ? "Existing characters will be removed" 
                          : "Existing characters will be kept (default)"}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Bosses Import Options */}
                <div className="entity-import-option">
                  <label className={`entity-checkbox ${!hasBossesInFile ? 'disabled' : ''}`}>
                    <input 
                      type="checkbox" 
                      checked={includeBosses && hasBossesInFile}
                      onChange={() => setIncludeBosses(!includeBosses)}
                      disabled={!hasBossesInFile}
                    />
                    <span>Import Bosses {!hasBossesInFile && '(Not in file)'}</span>
                  </label>
                  {includeBosses && hasBossesInFile && (
                    <div className="merge-option">
                      <label>
                        <input 
                          type="radio" 
                          name="boss-merge" 
                          checked={!mergeBosses} 
                          onChange={() => setMergeBosses(false)} 
                        />
                        <span>Replace existing bosses</span>
                      </label>
                      <label>
                        <input 
                          type="radio" 
                          name="boss-merge" 
                          checked={mergeBosses} 
                          onChange={() => setMergeBosses(true)} 
                        />
                        <span>Add to existing bosses</span>
                      </label>
                    </div>
                  )}
                  {!hasBossesInFile && (
                    <div className="missing-entity-option">
                      <label>
                        <input 
                          type="checkbox"
                          checked={clearMissingBosses}
                          onChange={() => setClearMissingBosses(!clearMissingBosses)}
                        />
                        <span>Clear existing bosses</span>
                      </label>
                      <div className="missing-note">
                        {clearMissingBosses 
                          ? "Existing bosses will be removed" 
                          : "Existing bosses will be kept (default)"}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Groups Import Options */}
                <div className="entity-import-option">
                  <label className={`entity-checkbox ${!hasGroupsInFile ? 'disabled' : ''}`}>
                    <input 
                      type="checkbox" 
                      checked={includeGroups && hasGroupsInFile}
                      onChange={() => setIncludeGroups(!includeGroups)}
                      disabled={!hasGroupsInFile}
                    />
                    <span>Import Enemy Groups {!hasGroupsInFile && '(Not in file)'}</span>
                  </label>
                  {includeGroups && hasGroupsInFile && (
                    <div className="merge-option">
                      <label>
                        <input 
                          type="radio" 
                          name="group-merge" 
                          checked={!mergeGroups} 
                          onChange={() => setMergeGroups(false)} 
                        />
                        <span>Replace existing groups</span>
                      </label>
                      <label>
                        <input 
                          type="radio" 
                          name="group-merge" 
                          checked={mergeGroups} 
                          onChange={() => setMergeGroups(true)} 
                        />
                        <span>Add to existing groups</span>
                      </label>
                    </div>
                  )}
                  {!hasGroupsInFile && (
                    <div className="missing-entity-option">
                      <label>
                        <input 
                          type="checkbox"
                          checked={clearMissingGroups}
                          onChange={() => setClearMissingGroups(!clearMissingGroups)}
                        />
                        <span>Clear existing enemy groups</span>
                      </label>
                      <div className="missing-note">
                        {clearMissingGroups 
                          ? "Existing enemy groups will be removed" 
                          : "Existing enemy groups will be kept (default)"}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="import-actions">
                <button 
                  className="import-button"
                  onClick={handleImport}
                  disabled={!importFile || (
                    (!hasCharactersInFile || !includeCharacters) && 
                    (!hasBossesInFile || !includeBosses) && 
                    (!hasGroupsInFile || !includeGroups) &&
                    !clearMissingCharacters && !clearMissingBosses && !clearMissingGroups
                  )}
                >
                  Import Data
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

ImportExportModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialMode: PropTypes.oneOf(['export', 'import'])
};

ImportExportModal.defaultProps = {
  initialMode: 'export'
};

export default ImportExportModal; 