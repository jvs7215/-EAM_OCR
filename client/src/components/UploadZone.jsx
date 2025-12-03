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
          <div className="icon">📄</div>
          <h3>Drop your document here</h3>
          <p>or click to browse</p>
          <div className="supported-formats">
            Supports JPG, PNG, BMP, PDF
          </div>
        </div>
      )}

      <style>{`
        .upload-zone {
          background: var(--color-surface);
          border: 2px dashed var(--color-border);
          border-radius: var(--radius-lg);
          padding: 4rem 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .upload-zone:hover {
          border-color: var(--color-accent);
          background: var(--color-surface-hover);
        }
        .upload-zone.dragging {
          border-color: var(--color-accent);
          background: var(--color-surface-hover);
          transform: scale(1.01);
        }
        .upload-zone.loading {
          cursor: wait;
          border-style: solid;
        }
        .icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        h3 {
          font-size: 1.25rem;
          margin-bottom: 0.5rem;
        }
        p {
          color: var(--color-text-light);
        }
        .supported-formats {
          margin-top: 1.5rem;
          font-size: 0.75rem;
          color: var(--color-text-light);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--color-border);
          border-top-color: var(--color-accent);
          border-radius: 50%;
          margin: 0 auto 1rem;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
