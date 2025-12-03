import { useState } from 'react'
import UploadZone from './components/UploadZone'
import ResultViewer from './components/ResultViewer'
import './index.css'
import nlp from 'compromise'

import { convertPdfToImages } from './utils/pdfUtils';

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, stage: '', fileName: '' });
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.setAttribute('data-theme', !isDarkMode ? 'dark' : 'light');
  };

  const processImageFile = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('http://localhost:3000/api/ocr', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('OCR processing failed');
    }

    return await response.json();
  };

  const handleUpload = async (files) => {
    setLoading(true);
    setError(null);
    // Don't clear previous results, append new ones? Or clear? 
    // Let's clear for now to keep it simple, or maybe append if we want "add more" functionality.
    // User said "upload multiple documents at a time", implying a batch.
    // User said "upload multiple documents at a time", implying a batch.

    try {
      const newResults = [];
      const totalFiles = files.length;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress({ current: i + 1, total: totalFiles, stage: 'Reading file', fileName: file.name });

        let fileText = '';
        let fileConfidence = 0;
        let imageUrls = [];

        if (file.type === 'application/pdf') {
          setProgress({ current: i + 1, total: totalFiles, stage: 'Converting PDF', fileName: file.name });
          const images = await convertPdfToImages(file);

          // Store all image URLs
          imageUrls = images.map(img => URL.createObjectURL(img));

          let pageTexts = [];
          let totalConf = 0;

          for (let j = 0; j < images.length; j++) {
            setProgress({ current: i + 1, total: totalFiles, stage: `OCR page ${j + 1}/${images.length}`, fileName: file.name });
            const data = await processImageFile(images[j]);
            pageTexts.push(`--- Page ${j + 1} ---\n\n${data.text}\n\n`);
            totalConf += data.confidence;
          }

          fileText = pageTexts.join('\n');
          fileConfidence = totalConf / images.length;

        } else {
          setProgress({ current: i + 1, total: totalFiles, stage: 'Extracting text', fileName: file.name });
          const url = URL.createObjectURL(file);
          imageUrls = [url];
          const data = await processImageFile(file);
          fileText = data.text;
          fileConfidence = data.confidence;
        }

        setProgress({ current: i + 1, total: totalFiles, stage: 'Analyzing tags', fileName: file.name });

        // Auto-tagging - Extract various entities
        const doc = nlp(fileText);

        // Extract entities using compromise
        const people = doc.people().out('array');
        const places = doc.places().out('array');
        const organizations = doc.organizations().out('array');
        const topics = doc.topics().out('array');

        // Custom patterns for art museums
        const yearMatches = fileText.match(/\b(19|20)\d{2}\b/g) || [];
        const years = [...new Set(yearMatches)];



        // Contact info
        const phoneMatches = fileText.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g) || [];
        const phones = [...new Set(phoneMatches)];

        const emailMatches = fileText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
        const emails = [...new Set(emailMatches)];

        const urlMatches = fileText.match(/(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/g) || [];
        const urls = [...new Set(urlMatches)].slice(0, 2);

        // Dates (month/day patterns)
        const dateMatches = fileText.match(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}/gi) || [];
        const dates = [...new Set(dateMatches)].slice(0, 3);

        // Times (event times)
        const timeMatches = fileText.match(/\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?/g) || [];
        const times = [...new Set(timeMatches)].slice(0, 2);

        // Quoted text (often artwork titles)
        const quotedMatches = fileText.match(/"([^"]{3,50})"/g) || [];
        const quoted = [...new Set(quotedMatches.map(q => q.replace(/"/g, '')))].slice(0, 3);

        // Combine all tags, remove duplicates, limit to 20
        const tags = [...new Set([
          ...people,
          ...places,
          ...organizations,
          ...topics.slice(0, 3),
          ...years.slice(0, 3),
          ...dates,
          ...times,
          ...years.slice(0, 3),
          ...dates,
          ...times,
          ...phones.slice(0, 1),
          ...emails.slice(0, 1),
          ...urls,
          ...quoted
        ])].filter(tag => {
          if (!tag) return false;
          // Filter out short tags (unless it's a year-like number)
          if (tag.length < 3) return false;
          // Filter out tags that don't have at least one letter (unless it's a year/date)
          if (!/[a-zA-Z]/.test(tag) && !/\d{4}/.test(tag)) return false;
          return true;
        }).slice(0, 20);

        newResults.push({
          id: Date.now() + i,
          fileName: file.name,
          text: fileText,
          confidence: fileConfidence,
          imageUrls: imageUrls,
          tags: tags
        });
      }

      setResult(newResults);
    } catch (err) {
      console.error(err);
      setError('Failed to process one or more documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  const handleAddTag = (resultIndex, newTag) => {
    if (!newTag || !newTag.trim()) return;

    setResult(prevResults => {
      const newResults = [...prevResults];
      const targetResult = { ...newResults[resultIndex] };

      if (!targetResult.tags.includes(newTag)) {
        targetResult.tags = [...targetResult.tags, newTag];
        newResults[resultIndex] = targetResult;
      }

      return newResults;
    });
  };

  const handleRemoveTag = (resultIndex, tagToRemove) => {
    setResult(prevResults => {
      const newResults = [...prevResults];
      const targetResult = { ...newResults[resultIndex] };

      targetResult.tags = targetResult.tags.filter(tag => tag !== tagToRemove);
      newResults[resultIndex] = targetResult;

      return newResults;
    });
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="container flex items-center justify-between">
          <div className="logo">
            <h1>EAM<span style={{ color: 'var(--color-accent)' }}>OCR</span></h1>
            <p className="subtitle">Erie Art Museum Document Digitizer</p>
          </div>
          <nav>
            <button onClick={toggleDarkMode} className="theme-toggle" title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
          </nav>
        </div>
      </header>

      <main className="main-content container">
        {!result && !loading && (
          <div className="upload-section animate-fade-in">
            <div className="hero-text text-center mb-4">
              <h2>Digitize Your Archives</h2>
              <p>Upload documents to extract text and metadata automatically.</p>
            </div>
            <UploadZone onFileSelect={handleUpload} loading={loading} />
            {error && <div className="error-message">{error}</div>}

            <div className="info-section">
              <h3>Works Best With:</h3>
              <ul className="info-list">
                <li>✓ Typed or printed documents</li>
                <li>✓ Clear scans and photos</li>
                <li>✓ High-contrast images</li>
                <li>✓ PDFs with image content</li>
              </ul>

              <h3>Limitations:</h3>
              <ul className="info-list">
                <li>✗ Handwritten text (low accuracy)</li>
                <li>✗ Heavily damaged documents</li>
                <li>✗ Complex table formatting</li>
              </ul>
            </div>
          </div>
        )}

        {loading && (
          <div className="loading-section animate-fade-in">
            <div className="progress-container">
              <div className="progress-header">
                <h3>Processing Documents</h3>
                <span className="progress-count">{progress.current} of {progress.total}</span>
              </div>

              <div className="progress-bar-outer">
                <div
                  className="progress-bar-inner"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                ></div>
              </div>

              <div className="progress-details">
                <p className="progress-stage">{progress.stage}</p>
                <p className="progress-filename">{progress.fileName}</p>
              </div>

              <div className="progress-spinner"></div>
            </div>
          </div>
        )}

        {result && result.length > 0 && !loading && (
          <div className="result-section animate-fade-in">
            <button onClick={handleReset} className="back-button mb-2">
              ← Process New Documents
            </button>
            <ResultViewer
              results={result}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
            />
          </div>
        )}
      </main>

      <footer className="footer text-center">
        <p>© {new Date().getFullYear()} Erie Art Museum. Internal Tool.</p>
      </footer>

      <style>{`
        .app-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .header {
          padding: 2rem 0;
          background: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
          margin-bottom: 3rem;
        }
        .logo h1 {
          font-size: 1.5rem;
          letter-spacing: -0.02em;
        }
        .subtitle {
          font-size: 0.875rem;
          color: var(--color-text-light);
        }
        .theme-toggle {
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          color: var(--color-text);
          padding: 0.5rem 1rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
        }
        .theme-toggle:hover {
          background: var(--color-accent);
          color: white;
          border-color: var(--color-accent);
          transform: translateY(-2px);
        }
        .main-content {
          flex: 1;
          width: 100%;
          padding-bottom: 4rem;
        }
        .hero-text h2 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }
        .hero-text p {
          color: var(--color-text-light);
          font-size: 1.125rem;
        }
        .error-message {
          margin-top: 1rem;
          padding: 1rem;
          background: #fee2e2;
          color: #dc2626;
          border-radius: var(--radius-sm);
          text-align: center;
        }
        .info-section {
          margin-top: 3rem;
          padding: 2rem;
          background: var(--color-surface);
          border-radius: var(--radius-lg);
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }
        .info-section h3 {
          font-size: 1rem;
          margin-bottom: 0.75rem;
          color: var(--color-accent);
        }
        .info-list {
          list-style: none;
          padding: 0;
          margin: 0 0 1.5rem 0;
        }
        .info-list:last-child {
          margin-bottom: 0;
        }
        .info-list li {
          padding: 0.5rem 0;
          color: var(--color-text-light);
          font-size: 0.9375rem;
        }
        .back-button {
          background: none;
          border: none;
          color: var(--color-text-light);
          font-weight: 500;
          padding: 0.5rem 0;
          transition: color 0.2s;
        }
        .back-button:hover {
          color: var(--color-primary);
        }
        .footer {
          padding: 2rem;
          color: var(--color-text-light);
          font-size: 0.875rem;
          border-top: 1px solid var(--color-border);
        }
        .loading-section {
          text-align: center;
          padding: 4rem 2rem;
        }
        .progress-container {
          max-width: 500px;
          margin: 0 auto;
          background: var(--color-surface);
          padding: 2rem;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-md);
        }
        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .progress-header h3 {
          font-size: 1.25rem;
          margin: 0;
        }
        .progress-count {
          font-size: 1rem;
          color: var(--color-accent);
          font-weight: 600;
        }
        .progress-bar-outer {
          width: 100%;
          height: 8px;
          background: var(--color-border);
          border-radius: 100px;
          overflow: hidden;
          margin-bottom: 1.5rem;
        }
        .progress-bar-inner {
          height: 100%;
          background: linear-gradient(90deg, var(--color-accent), #a78bfa);
          border-radius: 100px;
          transition: width 0.3s ease;
        }
        .progress-details {
          margin-bottom: 1.5rem;
        }
        .progress-stage {
          font-size: 1rem;
          color: var(--color-text);
          font-weight: 500;
          margin-bottom: 0.5rem;
        }
        .progress-filename {
          font-size: 0.875rem;
          color: var(--color-text-light);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .progress-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--color-border);
          border-top-color: var(--color-accent);
          border-radius: 50%;
          margin: 0 auto;
          animation: spin 1s linear infinite;
        }
        .loading-spinner {
          width: 60px;
          height: 60px;
          border: 4px solid var(--color-border);
          border-top-color: var(--color-accent);
          border-radius: 50%;
          margin: 0 auto 1.5rem;
          animation: spin 1s linear infinite;
        }
        .loading-text {
          font-size: 1.125rem;
          color: var(--color-text-light);
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default App
