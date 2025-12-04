import { useState, useRef } from 'react';

export default function UploadZone({ onFileSelect, loading }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files);
    }
  };

  return (
    <div
      className={`upload-zone ${isDragging ? 'dragging' : ''} ${loading ? 'loading' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={!loading ? handleClick : undefined}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        accept="image/*,.pdf"
        multiple
        style={{ display: 'none' }}
      />

      {loading ? (
        <div className="loading-content">
          <div className="spinner"></div>
          <p>Scanning document...</p>
        </div>
      ) : (
        <div className="upload-content">
          <div className="upload-icon-wrapper">
            <svg className="upload-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3>Drop your documents here</h3>
          <p>or <span className="browse-link">click to browse</span></p>
          <div className="supported-formats">
            <span className="format-badge">PDF</span>
            <span className="format-badge">JPG</span>
            <span className="format-badge">PNG</span>
            <span className="format-badge">BMP</span>
          </div>
        </div>
      )}

      <style>{`
        .upload-zone {
          background: var(--color-surface);
          backdrop-filter: var(--blur-lg);
          -webkit-backdrop-filter: var(--blur-lg);
          border: 2px dashed var(--color-border);
          border-radius: var(--radius-xl);
          padding: 5rem 3rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          box-shadow: var(--shadow-glass);
          max-width: 700px;
          margin: 0 auto;
        }
        .upload-zone::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--gradient-accent);
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 0;
        }
        .upload-zone:hover {
          border-color: var(--color-accent);
          background: var(--color-surface-hover);
          transform: translateY(-2px);
          box-shadow: var(--shadow-xl);
          border-style: solid;
        }
        .upload-zone:hover::before {
          opacity: 0.03;
        }
        .upload-zone.dragging {
          border-color: var(--color-accent);
          background: var(--color-accent-light);
          border-style: solid;
          transform: scale(1.02);
          box-shadow: var(--shadow-xl);
        }
        .upload-zone.dragging::before {
          opacity: 0.1;
        }
        .upload-zone.loading {
          cursor: wait;
          border-style: solid;
        }
        .upload-content {
          position: relative;
          z-index: 1;
        }
        .upload-icon-wrapper {
          margin: 0 auto 1.5rem;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--gradient-accent);
          border-radius: var(--radius-full);
          box-shadow: var(--shadow-md);
        }
        .upload-icon {
          width: 40px;
          height: 40px;
          color: white;
          stroke-width: 2.5;
        }
        .upload-zone:hover .upload-icon-wrapper {
          transform: scale(1.1);
          transition: transform 0.3s ease;
        }
        h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          color: var(--color-primary);
          font-family: var(--font-display);
        }
        p {
          color: var(--color-text-light);
          font-size: 1rem;
          margin-bottom: 0;
        }
        .browse-link {
          color: var(--color-accent);
          font-weight: 600;
          text-decoration: underline;
          text-underline-offset: 3px;
          transition: color 0.2s;
        }
        .upload-zone:hover .browse-link {
          color: var(--color-accent-hover);
        }
        .supported-formats {
          margin-top: 2rem;
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        .format-badge {
          padding: 0.5rem 1rem;
          background: var(--color-accent-light);
          backdrop-filter: var(--blur-sm);
          -webkit-backdrop-filter: var(--blur-sm);
          color: var(--color-accent);
          border-radius: var(--radius-full);
          font-size: 0.8125rem;
          font-weight: 600;
          border: 1px solid var(--color-border);
          transition: all 0.2s;
          box-shadow: var(--shadow-xs);
        }
        .upload-zone:hover .format-badge {
          background: var(--color-accent);
          color: white;
          border-color: var(--color-accent);
          transform: translateY(-2px);
        }
        .loading-content {
          position: relative;
          z-index: 1;
        }
        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid var(--color-border);
          border-top-color: var(--color-accent);
          border-radius: 50%;
          margin: 0 auto 1.5rem;
          animation: spin 0.8s linear infinite;
        }
        .loading-content p {
          color: var(--color-text);
          font-weight: 500;
          font-size: 1.125rem;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
