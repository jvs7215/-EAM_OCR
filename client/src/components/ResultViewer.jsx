import { useState } from 'react';

export default function ResultViewer({ results }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const selectedResult = results[selectedIndex];

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedResult.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="result-viewer">
      <div className="layout-grid">
        {/* Sidebar for multiple documents */}
        <div className="sidebar">
          <h3>Documents ({results.length})</h3>
          <div className="doc-list">
            {results.map((res, index) => (
              <button
                key={res.id}
                onClick={() => setSelectedIndex(index)}
                className={`doc-item ${index === selectedIndex ? 'active' : ''}`}
              >
                <span className="doc-name">{res.fileName}</span>
                <span className="doc-conf">{Math.round(res.confidence)}%</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="main-view">
          <div className="grid">
            <div className="card image-card">
              <div className="card-header">
                <h3>Original Document</h3>
              </div>
              <div className="image-container">
                <img src={selectedResult.imageUrl} alt="Uploaded document" />
              </div>

              {selectedResult.tags && selectedResult.tags.length > 0 && (
                <div className="tags-section">
                  <h4>Auto-Detected Tags:</h4>
                  <div className="tags-list">
                    {selectedResult.tags.map((tag, i) => (
                      <span key={i} className="tag">{tag}</span>
                    ))}
                  </div>
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
                <div className="flex gap-2">
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
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .layout-grid {
          display: grid;
          grid-template-columns: 250px 1fr;
          gap: 2rem;
          align-items: start;
        }
        @media (max-width: 1024px) {
          .layout-grid { grid-template-columns: 1fr; }
        }

        .sidebar {
          background: var(--color-surface);
          border-radius: var(--radius-md);
          padding: 1rem;
          position: sticky;
          top: 1rem;
        }
        .sidebar h3 {
          font-size: 0.875rem;
          color: var(--color-text-light);
          margin-bottom: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .doc-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .doc-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: transparent;
          border: 1px solid transparent;
          border-radius: var(--radius-sm);
          color: var(--color-text);
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          width: 100%;
        }
        .doc-item:hover {
          background: var(--color-bg);
        }
        .doc-item.active {
          background: var(--color-bg);
          border-color: var(--color-accent);
          color: var(--color-accent);
        }
        .doc-name {
          font-size: 0.875rem;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 150px;
        }
        .doc-conf {
          font-size: 0.75rem;
          color: var(--color-text-light);
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 2rem;
        }
        @media (max-width: 768px) {
          .grid { grid-template-columns: 1fr; }
        }
        .card {
          background: var(--color-surface);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-md);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .text-card {
          height: 700px;
        }
        .image-card {
          height: auto;
          max-height: 700px;
        }
        .card-header {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--color-border);
          background: var(--color-surface);
        }
        .card-header h3 {
          font-size: 1rem;
          margin: 0;
        }
        .image-container {
          flex: 1;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 1rem;
        }
        .image-container img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          box-shadow: var(--shadow-sm);
        }
        .text-content {
          flex: 1;
          padding: 1.5rem;
          overflow-y: auto;
          background: var(--color-surface);
        }
        .text-content pre {
          white-space: pre;
          font-family: 'Courier New', monospace;
          font-size: 0.9375rem;
          line-height: 1.6;
          color: var(--color-text);
          overflow-x: auto;
          tab-size: 4;
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
          color: #000;
          transform: translateY(-1px);
        }
        .action-btn.success {
          background: #1e7e34;
          color: #fff;
        }
        
        .tags-section {
          padding: 1.5rem;
          background: var(--color-bg);
          border-top: 1px solid var(--color-border);
        }
        .tags-section h4 {
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--color-text-light);
          margin-bottom: 0.75rem;
          letter-spacing: 0.05em;
        }
        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .tag {
          background: var(--color-surface);
          color: var(--color-accent);
          padding: 0.35rem 0.75rem;
          border-radius: 100px;
          font-size: 0.8125rem;
          border: 1px solid var(--color-border);
        }
      `}</style>
    </div>
  );
}
