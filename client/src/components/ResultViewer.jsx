import { useState, useRef } from 'react';

export default function ResultViewer({ results, onAddTag, onRemoveTag, onReset }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [currentPage, setCurrentPage] = useState(0); // For image pagination
  const [textPage, setTextPage] = useState(0); // For text pagination
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState({}); // Store edited text per document
  
  // Zoom and pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef(null);

  const selectedResult = results[selectedIndex];
  const totalPages = selectedResult.imageUrls ? selectedResult.imageUrls.length : 1;
  
  // Split text by page separators (format: "--- Page X ---\n\n...")
  const splitTextByPages = (text) => {
    if (!text) return [''];
    // Check if text contains page separators
    if (text.includes('--- Page')) {
      // Match pattern: "--- Page X ---" followed by content
      const pageRegex = /--- Page \d+ ---\s*\n\n/g;
      const pages = text.split(pageRegex)
        .map(page => page.trim())
        .filter(page => page.length > 0);
      return pages.length > 0 ? pages : [text.trim()];
    }
    // No page separators, return as single page
    return [text.trim()];
  };
  
  const textPages = splitTextByPages(selectedResult.text);
  const totalTextPages = textPages.length;

  const handleCopy = () => {
    const textToCopy = getFullEditedText();
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Initialize edited text when entering edit mode
  const handleEdit = () => {
    const docId = selectedResult.id;
    // Initialize the current page if not already edited
    if (!editedText[docId] || editedText[docId][textPage] === undefined) {
      setEditedText(prev => ({
        ...prev,
        [docId]: {
          ...(prev[docId] || {}),
          [textPage]: currentText
        }
      }));
    }
    setIsEditing(true);
  };
  
  const handleSaveEdit = () => {
    setIsEditing(false);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
  };
  
  const handleTextChange = (e) => {
    const docId = selectedResult.id;
    const newValue = e.target.value;
    setEditedText(prev => ({
      ...prev,
      [docId]: {
        ...(prev[docId] || {}),
        [textPage]: newValue
      }
    }));
  };

  const handleAddTagClick = () => {
    if (newTag.trim()) {
      onAddTag(selectedIndex, newTag.trim());
      setNewTag('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAddTagClick();
    }
  };

  const handleDocumentChange = (index) => {
    setSelectedIndex(index);
    setCurrentPage(0); // Reset to first page when switching documents
    setTextPage(0); // Reset text page
    setZoom(1); // Reset zoom
    setPan({ x: 0, y: 0 }); // Reset pan
    setIsEditing(false); // Exit edit mode when switching documents
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 5)); // Max zoom 5x
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5)); // Min zoom 0.5x
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.5, Math.min(5, prev + delta)));
  };

  // Pan handlers
  const handleMouseDown = (e) => {
    if (zoom > 1) {
      e.preventDefault(); // Prevent image drag
      setIsDragging(true);
      setDragStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
      setZoom(1); // Reset zoom when changing pages
      setPan({ x: 0, y: 0 }); // Reset pan when changing pages
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      setZoom(1); // Reset zoom when changing pages
      setPan({ x: 0, y: 0 }); // Reset pan when changing pages
    }
  };

  const handleNextTextPage = () => {
    if (textPage < totalTextPages - 1) {
      setTextPage(textPage + 1);
    }
  };

  const handlePrevTextPage = () => {
    if (textPage > 0) {
      setTextPage(textPage - 1);
    }
  };

  // Get current text to display (edited or original)
  const getCurrentText = () => {
    const originalText = textPages.length > 0 ? textPages[textPage] : selectedResult.text;
    const docId = selectedResult.id;
    if (editedText[docId] && editedText[docId][textPage] !== undefined) {
      return editedText[docId][textPage];
    }
    return originalText;
  };
  
  const currentText = getCurrentText();
  
  // Get full edited text for a document
  const getFullEditedText = () => {
    const docId = selectedResult.id;
    if (editedText[docId] && Object.keys(editedText[docId]).length > 0) {
      // Reconstruct full text from edited pages
      if (textPages.length > 0) {
        return textPages.map((page, idx) => 
          editedText[docId][idx] !== undefined ? editedText[docId][idx] : page
        ).join('\n\n');
      } else {
        // Single page document
        return editedText[docId][0] !== undefined ? editedText[docId][0] : selectedResult.text;
      }
    }
    return selectedResult.text;
  };

  return (
    <div className="result-viewer">
      {/* Minimal Document Selector at Top */}
      <div className="doc-selector-bar">
        <span className="doc-label">Documents ({results.length}):</span>
        <div className="doc-pills">
          {results.map((res, index) => (
            <button
              key={res.id}
              onClick={() => handleDocumentChange(index)}
              className={`doc-pill ${index === selectedIndex ? 'active' : ''}`}
            >
              {res.fileName}
            </button>
          ))}
        </div>
        {onReset && (
          <button onClick={onReset} className="process-new-btn">
            ← Process New Documents
          </button>
        )}
      </div>

      {/* Main Comparison View - Side by Side */}
      <div className="comparison-grid">
        <div className="card image-card">
          <div className="card-header flex justify-between items-center">
            <h3>Original Document</h3>
            {totalPages > 1 && (
              <div className="page-nav-top">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 0}
                  className="page-nav-btn"
                >
                  ← Back
                </button>
                <span className="page-indicator">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages - 1}
                  className="page-nav-btn"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
          <div 
            className="image-container"
            ref={imageContainerRef}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
          >
            {selectedResult.imageUrls && selectedResult.imageUrls.length > 0 ? (
              <img
                src={selectedResult.imageUrls[currentPage]}
                alt={`Page ${currentPage + 1}`}
                className="doc-image"
                draggable="false"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                }}
                onDragStart={(e) => e.preventDefault()}
              />
            ) : selectedResult.imageUrl ? (
              <img 
                src={selectedResult.imageUrl} 
                alt="Uploaded document" 
                className="doc-image"
                draggable="false"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                }}
                onDragStart={(e) => e.preventDefault()}
              />
            ) : null}
          </div>
          <div className="card-footer">
            <div className="zoom-controls">
              <button onClick={handleZoomOut} className="zoom-btn" title="Zoom Out">
                −
              </button>
              <span className="zoom-level">{Math.round(zoom * 100)}%</span>
              <button onClick={handleZoomIn} className="zoom-btn" title="Zoom In">
                +
              </button>
              {zoom !== 1 && (
                <button onClick={handleResetZoom} className="zoom-btn reset" title="Reset Zoom">
                  ↺
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="card text-card">
          <div className="card-header flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h3>Extracted Text</h3>
              <span className="confidence-badge" title="Confidence Score">
                {Math.round(selectedResult.confidence)}% Match
              </span>
            </div>
            {totalTextPages > 1 && (
              <div className="page-nav-top">
                <button
                  onClick={handlePrevTextPage}
                  disabled={textPage === 0}
                  className="page-nav-btn"
                >
                  ← Back
                </button>
                <span className="page-indicator">
                  Page {textPage + 1} of {totalTextPages}
                </span>
                <button
                  onClick={handleNextTextPage}
                  disabled={textPage === totalTextPages - 1}
                  className="page-nav-btn"
                >
                  Next →
                </button>
              </div>
            )}
          </div>

          <div className="text-content">
            {isEditing ? (
              <textarea
                value={currentText}
                onChange={handleTextChange}
                className="text-edit-area"
                placeholder="Edit extracted text..."
              />
            ) : (
              <pre>{currentText}</pre>
            )}
          </div>
          <div className="card-footer">
            <div className="flex gap-2 items-center justify-center">
              {!isEditing ? (
                <>
                  <button
                    onClick={handleCopy}
                    className={`action-btn ${copied ? 'success' : ''}`}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={handleEdit}
                    className="action-btn"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      const textToDownload = getFullEditedText();
                      const element = document.createElement("a");
                      const file = new Blob([textToDownload], { type: 'text/plain' });
                      element.href = URL.createObjectURL(file);
                      element.download = `${selectedResult.fileName}_extracted.txt`;
                      document.body.appendChild(element);
                      element.click();
                      document.body.removeChild(element);
                    }}
                    className="action-btn"
                  >
                    Download
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSaveEdit}
                    className="action-btn success"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="action-btn"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Tags Section - Below Comparison */}
      <div className="tags-section-bottom">
        <div className="tags-header">
          <h3>Tags</h3>
        </div>
        <div className="tags-content">
          <div className="tags-list">
            {selectedResult.tags && selectedResult.tags.map((tag, i) => (
              <span key={i} className="tag">
                {tag}
                <button
                  onClick={() => onRemoveTag(selectedIndex, tag)}
                  className="remove-tag-btn"
                  title="Remove tag"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="add-tag-container">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a tag..."
              className="tag-input"
            />
            <button onClick={handleAddTagClick} className="add-tag-btn">
              Add
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .doc-selector-bar {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
          padding: 1rem 1.5rem;
          background: var(--color-surface);
          backdrop-filter: var(--blur-lg);
          -webkit-backdrop-filter: var(--blur-lg);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-glass);
          border: 1px solid var(--color-border);
        }
        
        .process-new-btn {
          margin-left: auto;
          background: var(--color-surface);
          backdrop-filter: var(--blur-md);
          -webkit-backdrop-filter: var(--blur-md);
          border: 1px solid var(--color-border);
          color: var(--color-text);
          font-weight: 600;
          padding: 0.625rem 1.25rem;
          border-radius: var(--radius-full);
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: var(--shadow-sm);
          font-size: 0.875rem;
          cursor: pointer;
        }
        .process-new-btn:hover {
          background: var(--color-surface-hover);
          border-color: var(--color-accent);
          transform: translateX(-4px);
          box-shadow: var(--shadow-md);
        }

        .doc-label {
          font-size: 0.875rem;
          color: var(--color-text-light);
          font-weight: 500;
        }

        .doc-pills {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .doc-pill {
          padding: 0.5rem 1rem;
          background: var(--color-surface);
          backdrop-filter: var(--blur-sm);
          -webkit-backdrop-filter: var(--blur-sm);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-full);
          color: var(--color-text);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 0.875rem;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 200px;
          box-shadow: var(--shadow-xs);
        }
        .doc-pill:hover {
          border-color: var(--color-accent);
          transform: translateY(-2px);
          box-shadow: var(--shadow-sm);
        }
        .doc-pill.active {
          background: var(--gradient-accent);
          color: white;
          border-color: transparent;
          box-shadow: var(--shadow-md);
        }

        .comparison-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          min-width: 1000px;
          overflow-x: auto;
          margin-bottom: 2rem;
        }
        @media (max-width: 1024px) {
          .comparison-grid {
            grid-template-columns: 1fr;
            min-width: auto;
          }
        }
        
        .card {
          background: var(--color-surface);
          backdrop-filter: var(--blur-lg);
          -webkit-backdrop-filter: var(--blur-lg);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-glass);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          border: 1px solid var(--color-border);
          transition: all 0.3s ease;
        }
        .card:hover {
          box-shadow: var(--shadow-xl);
          transform: translateY(-2px);
          background: var(--color-surface-hover);
        }
        
        .text-card, .image-card {
          min-height: 90vh;
          max-height: 95vh;
          display: flex;
          flex-direction: column;
        }
        
        .card-header {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--color-border);
          background: var(--gradient-glass);
          backdrop-filter: var(--blur-md);
          -webkit-backdrop-filter: var(--blur-md);
          flex-shrink: 0;
        }
        
        .card-header h3 {
          font-size: 1.125rem;
          margin: 0;
          font-family: var(--font-display);
          font-weight: 600;
          color: var(--color-primary);
        }
        
        .card-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--color-border);
          background: var(--gradient-glass);
          backdrop-filter: var(--blur-md);
          -webkit-backdrop-filter: var(--blur-md);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .page-nav-top {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .page-nav-btn {
          background: var(--color-surface);
          backdrop-filter: var(--blur-sm);
          -webkit-backdrop-filter: var(--blur-sm);
          border: 1px solid var(--color-border);
          color: var(--color-text);
          padding: 0.625rem 1.25rem;
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.875rem;
          font-weight: 600;
          box-shadow: var(--shadow-xs);
        }
        .page-nav-btn:hover:not(:disabled) {
          background: var(--color-surface-hover);
          border-color: var(--color-accent);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .page-nav-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .page-indicator {
          font-size: 0.875rem;
          color: var(--color-text-light);
          font-weight: 500;
          min-width: 100px;
          text-align: center;
        }
        
        .image-container {
          flex: 1;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          overflow: hidden;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: center;
          justify-content: center;
          position: relative;
          user-select: none;
        }
        [data-theme="dark"] .image-container {
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
        }
        .doc-image {
          max-width: 100%;
          height: auto;
          box-shadow: var(--shadow-2xl);
          border-radius: var(--radius-md);
        }
        
        .zoom-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .zoom-level {
          font-size: 0.875rem;
          color: var(--color-text-light);
          font-weight: 600;
          min-width: 50px;
          text-align: center;
        }
        
        .zoom-btn {
          background: var(--color-surface);
          backdrop-filter: var(--blur-sm);
          -webkit-backdrop-filter: var(--blur-sm);
          border: 1px solid var(--color-border);
          color: var(--color-text);
          width: 32px;
          height: 32px;
          border-radius: var(--radius-full);
          font-size: 1.125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          box-shadow: var(--shadow-xs);
        }
        .zoom-btn:hover {
          background: var(--color-surface-hover);
          border-color: var(--color-accent);
          transform: scale(1.1);
          box-shadow: var(--shadow-sm);
        }
        .zoom-btn.reset {
          font-size: 1rem;
          margin-left: 0.25rem;
        }
        
        .text-content {
          flex: 1;
          padding: 2.5rem;
          overflow-y: auto;
          background: rgba(255, 255, 255, 0.95);
        }
        [data-theme="dark"] .text-content {
          background: rgba(26, 29, 41, 0.95);
        }
        .text-content pre {
          white-space: pre-wrap;
          word-wrap: break-word;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-size: 0.9375rem;
          line-height: 1.8;
          color: var(--color-text);
          margin: 0;
          background: rgba(255, 255, 255, 1);
          padding: 1.5rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
        }
        [data-theme="dark"] .text-content pre {
          background: rgba(15, 17, 23, 1);
        }
        .text-edit-area {
          width: 100%;
          min-height: 400px;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-size: 0.9375rem;
          line-height: 1.8;
          color: var(--color-text);
          background: rgba(255, 255, 255, 1);
          padding: 1.5rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
          resize: vertical;
          outline: none;
          transition: border-color 0.2s;
        }
        [data-theme="dark"] .text-edit-area {
          background: rgba(15, 17, 23, 1);
        }
        .text-edit-area:focus {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px var(--color-accent-light);
        }

        .confidence-badge {
          background: var(--color-success-light);
          color: var(--color-success);
          padding: 0.375rem 0.75rem;
          border-radius: var(--radius-full);
          font-size: 0.8125rem;
          font-weight: 700;
          border: 1px solid var(--color-success);
          box-shadow: var(--shadow-xs);
        }
        [data-theme="light"] .confidence-badge {
          color: #047857;
          border-color: #047857;
        }
        
        .action-btn {
          background: var(--color-surface);
          backdrop-filter: var(--blur-md);
          -webkit-backdrop-filter: var(--blur-md);
          color: var(--color-text);
          border: 1px solid var(--color-border);
          padding: 0.625rem 1.25rem;
          border-radius: var(--radius-full);
          font-size: 0.875rem;
          font-weight: 600;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          box-shadow: var(--shadow-sm);
        }
        .action-btn:hover {
          background: var(--color-surface-hover);
          border-color: var(--color-accent);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .action-btn.success {
          background: var(--color-success);
          color: white;
          border-color: var(--color-success);
        }
        
        .tags-section-bottom {
          background: var(--color-surface);
          backdrop-filter: var(--blur-lg);
          -webkit-backdrop-filter: var(--blur-lg);
          border-radius: var(--radius-xl);
          padding: 2rem;
          box-shadow: var(--shadow-glass);
          border: 1px solid var(--color-border);
        }

        .tags-header h3 {
          font-size: 0.875rem;
          text-transform: uppercase;
          color: var(--color-text-light);
          margin: 0 0 0.75rem 0;
          letter-spacing: 0.05em;
        }

        .tags-content {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          flex: 1;
        }

        .tag {
          background: var(--color-accent-light);
          backdrop-filter: var(--blur-sm);
          -webkit-backdrop-filter: var(--blur-sm);
          color: var(--color-accent);
          padding: 0.5rem 0.75rem 0.5rem 1rem;
          border-radius: var(--radius-full);
          font-size: 0.8125rem;
          font-weight: 600;
          border: 1px solid var(--color-border);
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
          box-shadow: var(--shadow-xs);
        }
        .tag:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-sm);
        }
        .remove-tag-btn {
          background: rgba(0, 0, 0, 0.1);
          border: none;
          color: var(--color-text-light);
          cursor: pointer;
          font-size: 1.125rem;
          line-height: 1;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          transition: all 0.2s;
        }
        .remove-tag-btn:hover {
          background: var(--color-error);
          color: white;
          transform: scale(1.1);
        }

        .add-tag-container {
          display: flex;
          gap: 0.5rem;
        }

        .tag-input {
          padding: 0.625rem 1rem;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-full);
          font-size: 0.875rem;
          background: var(--color-surface);
          backdrop-filter: var(--blur-sm);
          -webkit-backdrop-filter: var(--blur-sm);
          color: var(--color-text);
          min-width: 220px;
          transition: all 0.3s ease;
          box-shadow: var(--shadow-xs);
        }
        .tag-input:focus {
          outline: none;
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px var(--color-accent-light);
        }
        .add-tag-btn {
          padding: 0.625rem 1.5rem;
          background: var(--gradient-accent);
          color: white;
          border: none;
          border-radius: var(--radius-full);
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: var(--shadow-sm);
        }
        .add-tag-btn:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
      `}</style>
    </div>
  );
}
