import { useState } from 'react';

export default function ResultViewer({ results, onAddTag, onRemoveTag }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  const selectedResult = results[selectedIndex];
  const totalPages = selectedResult.imageUrls ? selectedResult.imageUrls.length : 1;

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedResult.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
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
      </div>

      {/* Main Comparison View */}
      <div className="comparison-grid">
        <div className="card image-card">
          <div className="card-header">
            <h3>Original Document</h3>
          </div>
          <div className="image-container">
            {selectedResult.imageUrls && selectedResult.imageUrls.length > 0 ? (
              <img
                src={selectedResult.imageUrls[currentPage]}
                alt={`Page ${currentPage + 1}`}
                className="doc-image"
              />
            ) : selectedResult.imageUrl ? (
              <img src={selectedResult.imageUrl} alt="Uploaded document" className="doc-image" />
            ) : null}
          </div>
          {totalPages > 1 && (
            <div className="page-nav-bottom">
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

        <div className="card text-card">
          <div className="card-header flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h3>Extracted Text</h3>
              <span className="confidence-badge" title="Confidence Score">
                {Math.round(selectedResult.confidence)}% Match
              </span>
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={handleCopy}
                className={`action-btn ${copied ? 'success' : ''}`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={() => {
                  const element = document.createElement("a");
                  const file = new Blob([selectedResult.text], { type: 'text/plain' });
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
            </div>
          </div>

          <div className="text-content">
            <pre>{selectedResult.text}</pre>
          </div>

          {totalPages > 1 && (
            <div className="page-nav-bottom">
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
          gap: 1rem;
          margin-bottom: 1rem;
          padding: 0.75rem 1rem;
          background: var(--color-surface);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
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
          padding: 0.375rem 0.75rem;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: 100px;
          color: var(--color-text);
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .doc-pill:hover {
          border-color: var(--color-accent);
        }
        .doc-pill.active {
          background: var(--color-accent);
          color: white;
          border-color: var(--color-accent);
        }

        .comparison-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          min-width: 1000px;
          overflow-x: auto;
          margin-bottom: 1.5rem;
        }
        
        .card {
          background: var(--color-surface);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-md);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        
        .text-card, .image-card {
          height: calc(100vh - 280px);
          display: flex;
          flex-direction: column;
        }
        
        .card-header {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--color-border);
          background: var(--color-surface);
          flex-shrink: 0;
        }
        .card-header h3 {
          font-size: 1rem;
          margin: 0;
        }

        .page-nav-bottom {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 1rem;
          background: var(--color-surface);
          border-top: 1px solid var(--color-border);
        }

        .page-nav-btn {
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          color: var(--color-text);
          padding: 0.5rem 1rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .page-nav-btn:hover:not(:disabled) {
          background: var(--color-accent);
          color: white;
          border-color: var(--color-accent);
        }
        .page-nav-btn:disabled {
          opacity: 0.3;
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
          background: #000;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: center;
        }
        .doc-image {
          max-width: 100%;
          height: auto;
          box-shadow: var(--shadow-sm);
        }
        
        .text-content {
          flex: 1;
          padding: 1.5rem;
          overflow-y: auto;
          background: var(--color-surface);
        }
        .text-content pre {
          white-space: pre-wrap;
          word-wrap: break-word;
          font-family: 'Courier New', monospace;
          font-size: 0.9375rem;
          line-height: 1.6;
          color: var(--color-text);
          margin: 0;
        }

        .confidence-badge {
          background: #e6f4ea;
          color: #1e7e34;
          padding: 0.25rem 0.5rem;
          border-radius: 100px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        
        .action-btn {
          background: var(--color-border);
          color: var(--color-text);
          border: none;
          padding: 0.5rem 1rem;
          border-radius: var(--radius-sm);
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
          cursor: pointer;
        }
        .action-btn:hover {
          background: var(--color-primary);
          color: #fff;
          transform: translateY(-1px);
        }
        .action-btn.success {
          background: #1e7e34;
          color: #fff;
        }
        
        .tags-section-bottom {
          background: var(--color-surface);
          border-radius: var(--radius-md);
          padding: 1rem 1.5rem;
          box-shadow: var(--shadow-sm);
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
          background: var(--color-bg);
          color: var(--color-accent);
          padding: 0.25rem 0.5rem 0.25rem 0.75rem;
          border-radius: 100px;
          font-size: 0.8125rem;
          border: 1px solid var(--color-border);
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        .remove-tag-btn {
          background: none;
          border: none;
          color: var(--color-text-light);
          cursor: pointer;
          font-size: 1rem;
          line-height: 1;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          border-radius: 50%;
        }
        .remove-tag-btn:hover {
          background: #fee2e2;
          color: #dc2626;
        }

        .add-tag-container {
          display: flex;
          gap: 0.5rem;
        }

        .tag-input {
          padding: 0.5rem;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          font-size: 0.875rem;
          background: var(--color-bg);
          color: var(--color-text);
          min-width: 200px;
        }
        .tag-input:focus {
          outline: none;
          border-color: var(--color-accent);
        }
        .add-tag-btn {
          padding: 0.5rem 1rem;
          background: var(--color-accent);
          color: white;
          border: none;
          border-radius: var(--radius-sm);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }
        .add-tag-btn:hover {
          background: var(--color-primary);
          color: black;
        }
      `}</style>
    </div>
  );
}
