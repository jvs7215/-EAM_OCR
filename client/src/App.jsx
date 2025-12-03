import { useState } from 'react'
import UploadZone from './components/UploadZone'
import ResultViewer from './components/ResultViewer'
import ThemeToggle from './components/ThemeToggle'
import { useTheme } from './hooks/useTheme'
import './index.css'
import './App.css'
import nlp from 'compromise'

import { convertPdfToImages } from './utils/pdfUtils';

function App() {
  const [theme, toggleTheme] = useTheme();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, stage: '', fileName: '' });

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

    try {
      const newResults = [];
      const totalFiles = files.length;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress({ current: i + 1, total: totalFiles, stage: 'Reading file', fileName: file.name });

        let fileText = '';
        let fileConfidence = 0;
        let imageUrl = '';
        let pages = null; // For multi-page documents
        let isMultiPage = false;

        if (file.type === 'application/pdf') {
          setProgress({ current: i + 1, total: totalFiles, stage: 'Converting PDF', fileName: file.name });
          const images = await convertPdfToImages(file);
          isMultiPage = images.length > 1;
          imageUrl = URL.createObjectURL(images[0]); // First page for preview

          let pageTexts = [];
          let totalConf = 0;
          pages = [];

          for (let j = 0; j < images.length; j++) {
            setProgress({ current: i + 1, total: totalFiles, stage: `OCR page ${j + 1}/${images.length}`, fileName: file.name });
            const data = await processImageFile(images[j]);
            const pageText = data.text;
            pageTexts.push(`--- Page ${j + 1} ---\n\n${pageText}\n\n`);
            totalConf += data.confidence;
            
            // Store each page separately
            pages.push({
              pageNumber: j + 1,
              imageUrl: URL.createObjectURL(images[j]),
              text: pageText,
              confidence: data.confidence
            });
          }

          fileText = pageTexts.join('\n');
          fileConfidence = totalConf / images.length;

        } else {
          setProgress({ current: i + 1, total: totalFiles, stage: 'Extracting text', fileName: file.name });
          imageUrl = URL.createObjectURL(file);
          const data = await processImageFile(file);
          fileText = data.text;
          fileConfidence = data.confidence;
        }

        setProgress({ current: i + 1, total: totalFiles, stage: 'Analyzing tags', fileName: file.name });

        const doc = nlp(fileText);

        const people = doc.people().out('array');
        const places = doc.places().out('array');
        const organizations = doc.organizations().out('array');
        const topics = doc.topics().out('array');

        const yearMatches = fileText.match(/\b(19|20)\d{2}\b/g) || [];
        const years = [...new Set(yearMatches)];

        const moneyMatches = fileText.match(/\$[\d,]+(?:\.\d{2})?/g) || [];
        const money = [...new Set(moneyMatches)];

        const phoneMatches = fileText.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g) || [];
        const phones = [...new Set(phoneMatches)];

        const emailMatches = fileText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
        const emails = [...new Set(emailMatches)];

        const urlMatches = fileText.match(/(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/g) || [];
        const urls = [...new Set(urlMatches)].slice(0, 2);

        const dateMatches = fileText.match(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}/gi) || [];
        const dates = [...new Set(dateMatches)].slice(0, 3);

        const timeMatches = fileText.match(/\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?/g) || [];
        const times = [...new Set(timeMatches)].slice(0, 2);

        const quotedMatches = fileText.match(/"([^"]{3,50})"/g) || [];
        const quoted = [...new Set(quotedMatches.map(q => q.replace(/"/g, '')))].slice(0, 3);

        const tags = [...new Set([
          ...people,
          ...places,
          ...organizations,
          ...topics.slice(0, 3),
          ...years.slice(0, 3),
          ...dates,
          ...times,
          ...money.slice(0, 2),
          ...phones.slice(0, 1),
          ...emails.slice(0, 1),
          ...urls,
          ...quoted
        ])].filter(tag => tag && tag.length > 1).slice(0, 20);

        newResults.push({
          id: Date.now() + i,
          fileName: file.name,
          text: fileText,
          confidence: fileConfidence,
          imageUrl: imageUrl,
          tags: tags,
          pages: pages, // Array of pages for multi-page documents
          isMultiPage: isMultiPage
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

  // If results exist, show result viewer
  if (result && result.length > 0 && !loading) {
    return (
      <div className="app-container">
        <header className="header">
          <div className="container">
            <div className="header-content">
              <div className="logo">
                <h1>EAM<span className="logo-accent">OCR</span></h1>
              </div>
              <div className="header-actions">
                <ThemeToggle theme={theme} onToggle={toggleTheme} />
                <button onClick={handleReset} className="btn-secondary">
                  Process New Documents
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="main-content">
          <div className="container">
            <ResultViewer results={result} />
          </div>
        </main>
      </div>
    );
  }

  // Landing page layout: Hero → Value Prop → Features → CTA
  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <h1>EAM<span className="logo-accent">OCR</span></h1>
              <p className="logo-subtitle">Erie Art Museum Document Digitizer</p>
            </div>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* Upload Section - Front and Center */}
        <section className="upload-section">
          <div className="container">
            <div className="upload-wrapper">
              <UploadZone onFileSelect={handleUpload} loading={loading} />
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <div className="container">
            <h2 className="section-title">What Works Best</h2>
            <div className="features-grid">
              <div className="feature-card">
                <h3>Supported Formats</h3>
                <ul className="feature-list">
                  <li>PDF documents</li>
                  <li>JPG, PNG images</li>
                  <li>BMP, TIFF files</li>
                  <li>Multi-page PDFs</li>
                </ul>
              </div>
              <div className="feature-card">
                <h3>Ideal Documents</h3>
                <ul className="feature-list">
                  <li>Typed or printed text</li>
                  <li>Clear scans and photos</li>
                  <li>High-contrast images</li>
                  <li>Standard fonts</li>
                </ul>
              </div>
              <div className="feature-card">
                <h3>Limitations</h3>
                <ul className="feature-list">
                  <li>Handwritten text (low accuracy)</li>
                  <li>Heavily damaged documents</li>
                  <li>Complex table formatting</li>
                  <li>Very low resolution images</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Loading State */}
        {loading && (
          <div className="loading-overlay">
            <div className="loading-container">
              <div className="loading-header">
                <h3>Processing Documents</h3>
                <span className="progress-count">{progress.current} of {progress.total}</span>
              </div>
              <div className="progress-bar-outer">
                <div
                  className="progress-bar-inner"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                ></div>
              </div>
              <div className="loading-details">
                <p className="loading-stage">{progress.stage}</p>
                <p className="loading-filename">{progress.fileName}</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <div className="container">
          <p>© {new Date().getFullYear()} Erie Art Museum. Internal Tool.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
