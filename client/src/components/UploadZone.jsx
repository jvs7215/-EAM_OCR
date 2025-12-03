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
    if (!loading) {
      fileInputRef.current.click();
    }
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
      onClick={handleClick}
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
        <div className="upload-loading">
          <div className="upload-spinner"></div>
          <p>Processing...</p>
        </div>
      ) : (
        <div className="upload-content">
          <div className="upload-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          <h3 className="upload-title">Drop files here or click to browse</h3>
          <p className="upload-subtitle">Supports PDF, JPG, PNG, BMP</p>
        </div>
      )}

      <style>{`
        .upload-zone {
          background: var(--color-bg);
          border: 2px dashed var(--color-border);
          border-radius: var(--radius-lg);
          padding: 3rem 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .upload-zone:hover:not(.loading) {
          border-color: var(--color-accent);
          background: var(--color-surface);
        }

        .upload-zone.dragging {
          border-color: var(--color-accent);
          background: var(--color-surface);
          border-style: solid;
        }

        .upload-zone.loading {
          cursor: wait;
          border-style: solid;
          border-color: var(--color-border);
        }

        .upload-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .upload-icon {
          color: var(--color-accent);
          margin-bottom: 0.5rem;
        }

        .upload-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0;
          color: var(--color-text);
        }

        .upload-subtitle {
          font-size: 0.875rem;
          color: var(--color-text-light);
          margin: 0;
        }

        .upload-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .upload-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--color-border);
          border-top-color: var(--color-accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .upload-loading p {
          color: var(--color-text-light);
          font-size: 0.9375rem;
          margin: 0;
        }

        @media (max-width: 768px) {
          .upload-zone {
            padding: 2.5rem 1.5rem;
          }

          .upload-title {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
