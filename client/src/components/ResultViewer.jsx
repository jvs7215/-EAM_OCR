import { useState, useEffect } from 'react';

export default function ResultViewer({ results }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [copied, setCopied] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [editingTagIndex, setEditingTagIndex] = useState(null);
  const [tagInputValue, setTagInputValue] = useState('');
  const [tags, setTags] = useState(() => results[0]?.tags || []);
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
  const [isEditingText, setIsEditingText] = useState(false);
  const [editedText, setEditedText] = useState('');

  const selectedResult = results[selectedIndex];
  const isMultiPage = selectedResult?.isMultiPage && selectedResult?.pages?.length > 0;
  const totalPages = isMultiPage ? selectedResult.pages.length : 1;
  
  // Reset to page 1 when switching documents
  const handleDocumentChange = (index) => {
    setSelectedIndex(index);
    setCurrentPage(1);
    setTags(results[index]?.tags || []);
    setEditingTagIndex(null);
  };

  // Update tags when selected result changes
  useEffect(() => {
    setTags(selectedResult?.tags || []);
  }, [selectedResult]);

  // Reset zoom and offset when page or document changes
  useEffect(() => {
    setImageZoom(1);
    setImageOffset({ x: 0, y: 0 });
    setIsDragging(false);
    setIsEditingText(false);
  }, [currentPage, selectedIndex]);

  // Get current page data
  const getCurrentPageData = () => {
    if (isMultiPage && selectedResult.pages) {
      return selectedResult.pages[currentPage - 1];
    }
    return {
      imageUrl: selectedResult.imageUrl,
      text: selectedResult.text,
      confidence: selectedResult.confidence
    };
  };

  const currentPageData = getCurrentPageData();

  // Initialize/update edited text when entering edit mode or page changes
  useEffect(() => {
    if (isEditingText) {
      const textToEdit = isMultiPage ? currentPageData.text : selectedResult.text;
      setEditedText(textToEdit);
    }
  }, [isEditingText, currentPage, selectedIndex, isMultiPage, currentPageData, selectedResult]);

  const handleCopy = () => {
    const textToCopy = isEditingText 
      ? editedText 
      : (isMultiPage ? currentPageData.text : selectedResult.text);
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveText = () => {
    if (isMultiPage && selectedResult.pages) {
      const updatedPages = [...selectedResult.pages];
      updatedPages[currentPage - 1] = {
        ...updatedPages[currentPage - 1],
        text: editedText
      };
      selectedResult.pages = updatedPages;
      selectedResult.text = updatedPages.map((p, i) => `--- Page ${i + 1} ---\n\n${p.text}\n\n`).join('\n');
    } else {
      selectedResult.text = editedText;
    }
    setIsEditingText(false);
  };

  const handleCancelEdit = () => {
    setIsEditingText(false);
    setEditedText('');
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Keyboard navigation for pages
  useEffect(() => {
    if (!isMultiPage) return;

    const handleKeyPress = (e) => {
      // Only handle if not typing in an input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if (e.key === 'ArrowLeft' && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else if (e.key === 'ArrowRight' && currentPage < totalPages) {
        setCurrentPage(currentPage + 1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPage, totalPages, isMultiPage]);

  // Close modal with Escape key
  useEffect(() => {
    if (!imageModalOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setImageModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [imageModalOpen]);

  const hasMultipleDocs = results.length > 1;

  return (
    <div className={`result-viewer ${hasMultipleDocs ? 'has-sidebar' : 'single-doc'}`}>
      {/* Document List Sidebar */}
      {hasMultipleDocs && (
        <div className="result-sidebar">
          <h3 className="sidebar-title">Documents ({results.length})</h3>
          <div className="doc-list">
            {results.map((res, index) => (
              <button
                key={res.id}
                onClick={() => handleDocumentChange(index)}
                className={`doc-item ${index === selectedIndex ? 'active' : ''}`}
              >
                <span className="doc-name">{res.fileName}</span>
                <span className="doc-confidence">{Math.round(res.confidence)}%</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="result-viewer-content">
        {/* Main Content Area */}
        <div className="result-main-wrapper">
          <div className="result-main">
            <div className={`result-grid ${hasMultipleDocs ? '' : 'single-doc-grid'}`}>
          {/* Image Card */}
          <div className="result-card image-card">
            <div className="card-header">
              <div className="card-header-top">
                <h3>Original Document</h3>
                {isMultiPage && (
                  <div className="page-navigation">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className="page-nav-btn"
                      aria-label="Previous page"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                    </button>
                    <span className="page-info">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="page-nav-btn"
                      aria-label="Next page"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div 
              className={`image-container ${imageZoom > 1 ? (isDragging ? 'dragging' : 'zoom-active') : ''}`}
              onWheel={(e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                setImageZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
              }}
              onMouseDown={(e) => {
                if (imageZoom > 1 && e.button === 0) {
                  setIsDragging(true);
                  setDragStart({ x: e.clientX - imageOffset.x, y: e.clientY - imageOffset.y });
                }
              }}
              onMouseMove={(e) => {
                if (isDragging && imageZoom > 1) {
                  setImageOffset({
                    x: e.clientX - dragStart.x,
                    y: e.clientY - dragStart.y
                  });
                }
              }}
              onMouseUp={() => {
                setIsDragging(false);
              }}
              onMouseLeave={() => {
                setIsDragging(false);
              }}
            >
              <div 
                className={`image-zoom-wrapper ${isDragging ? 'dragging' : ''}`}
                style={{ 
                  transform: `scale(${imageZoom}) translate(${imageOffset.x / imageZoom}px, ${imageOffset.y / imageZoom}px)`
                }}
              >
                <img 
                  src={currentPageData.imageUrl} 
                  alt={`Page ${currentPage} of ${selectedResult.fileName}`}
                  onClick={(e) => {
                    if (!isDragging && imageZoom <= 1) {
                      setImageModalOpen(true);
                    }
                  }}
                  className="clickable-image"
                  draggable={false}
                />
              </div>
            </div>
          </div>

          {/* Text Card */}
          <div className="result-card text-card">
            <div className="card-header">
              <div className="card-header-content">
                <div className="card-title-group">
                  <h3>Extracted Text</h3>
                  {isMultiPage && (
                    <span className="page-badge">
                      Page {currentPage}
                    </span>
                  )}
                  <span className="confidence-badge">
                    {Math.round(isMultiPage ? currentPageData.confidence : selectedResult.confidence)}% confidence
                  </span>
                </div>
                <div className="card-actions">
                  {isEditingText ? (
                    <>
                      <button
                        onClick={handleSaveText}
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
                  ) : (
                    <>
                      <button
                        onClick={() => setIsEditingText(true)}
                        className="action-btn"
                      >
                        Edit
                      </button>
                      <button
                        onClick={handleCopy}
                        className={`action-btn ${copied ? 'success' : ''}`}
                      >
                        {copied ? '✓ Copied' : 'Copy'}
                      </button>
                      <button
                        onClick={() => {
                          const textToDownload = isMultiPage ? selectedResult.text : selectedResult.text;
                          const element = document.createElement("a");
                          const file = new Blob([textToDownload], { type: 'text/plain' });
                          element.href = URL.createObjectURL(file);
                          const fileName = isMultiPage 
                            ? `${selectedResult.fileName}_all_pages_extracted.txt`
                            : `${selectedResult.fileName}_extracted.txt`;
                          element.download = fileName;
                          document.body.appendChild(element);
                          element.click();
                          document.body.removeChild(element);
                        }}
                        className="action-btn"
                      >
                        {isMultiPage ? 'Download All' : 'Download'}
                      </button>
                      {isMultiPage && (
                        <button
                          onClick={() => {
                            const element = document.createElement("a");
                            const file = new Blob([currentPageData.text], { type: 'text/plain' });
                            element.href = URL.createObjectURL(file);
                            element.download = `${selectedResult.fileName}_page_${currentPage}_extracted.txt`;
                            document.body.appendChild(element);
                            element.click();
                            document.body.removeChild(element);
                          }}
                          className="action-btn"
                        >
                          Download Page
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="text-content">
              {isEditingText ? (
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="text-editor"
                  spellCheck={false}
                />
              ) : (
                <pre>{isMultiPage ? currentPageData.text : selectedResult.text}</pre>
              )}
            </div>
            {isMultiPage && (
              <div className="page-navigation-footer">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="page-nav-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                  Previous
                </button>
                <span className="page-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="page-nav-btn"
                >
                  Next
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </div>
            )}
          </div>
          </div>
          </div>

          {/* Tags Section - Below both cards */}
          {tags && tags.length > 0 && (
            <div className="tags-section-below">
              <div className="tags-header">
                <h3>Tags</h3>
                <button
                  onClick={() => setTagsExpanded(!tagsExpanded)}
                  className="tags-toggle-btn"
                  aria-label={tagsExpanded ? 'Collapse tags' : 'Expand tags'}
                >
                  {tagsExpanded ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="18 15 12 9 6 15"></polyline>
                      </svg>
                      Hide Tags
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                      Show Tags ({tags.length})
                    </>
                  )}
                </button>
              </div>
              {tagsExpanded && (
                <>
                  <div className="tags-header-actions">
                    <button
                      onClick={() => {
                        const newTag = '';
                        setTags([...tags, newTag]);
                        setEditingTagIndex(tags.length);
                        setTagInputValue(newTag);
                      }}
                      className="add-tag-btn"
                    >
                      + Add Tag
                    </button>
                  </div>
                  <div className="tags-list">
                    {tags.map((tag, i) => (
                      <div key={i} className="tag-wrapper">
                        {editingTagIndex === i ? (
                          <input
                            type="text"
                            value={tagInputValue}
                            onChange={(e) => setTagInputValue(e.target.value)}
                            onBlur={() => {
                              const newTags = [...tags];
                              if (tagInputValue.trim()) {
                                newTags[i] = tagInputValue.trim();
                              } else {
                                newTags.splice(i, 1);
                              }
                              setTags(newTags);
                              setEditingTagIndex(null);
                              setTagInputValue('');
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.target.blur();
                              } else if (e.key === 'Escape') {
                                setEditingTagIndex(null);
                                setTagInputValue('');
                              }
                            }}
                            className="tag-input"
                            autoFocus
                          />
                        ) : (
                          <span 
                            className="tag"
                            onClick={() => {
                              setEditingTagIndex(i);
                              setTagInputValue(tag);
                            }}
                          >
                            {tag}
                          </span>
                        )}
                        <button
                          onClick={() => {
                            const newTags = tags.filter((_, idx) => idx !== i);
                            setTags(newTags);
                          }}
                          className="tag-remove"
                          aria-label="Remove tag"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {imageModalOpen && (
        <div className="image-modal-overlay" onClick={() => setImageModalOpen(false)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="image-modal-close"
              onClick={() => setImageModalOpen(false)}
              aria-label="Close image"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <img 
              src={currentPageData.imageUrl} 
              alt={`Page ${currentPage} of ${selectedResult.fileName}`}
              className="modal-image"
            />
            {isMultiPage && (
              <div className="modal-page-info">
                Page {currentPage} of {totalPages}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .result-viewer {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding: 1rem 0;
          height: 100%;
          max-height: calc(100vh - 80px);
          overflow: hidden;
          position: relative;
        }

        .result-viewer-content {
          display: flex;
          flex: 1;
          min-height: 0;
          width: 100%;
        }

        .result-viewer.single-doc .result-viewer-content {
          display: flex;
        }

        .result-main-wrapper {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          min-height: 0;
          flex: 1;
        }

        @media (max-width: 1024px) {
          .result-sidebar {
            position: relative;
            left: 0;
            top: 0;
            width: 100%;
            max-height: none;
            margin-bottom: 1rem;
          }

          .result-viewer.has-sidebar .result-main {
            margin-left: 0;
          }
        }

        /* Sidebar */
        .result-sidebar {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 0.75rem;
          position: fixed;
          left: 1.5rem;
          top: 90px;
          width: 180px;
          height: fit-content;
          max-height: calc(100vh - 110px);
          overflow-y: auto;
          z-index: 10;
        }

        @media (max-width: 1024px) {
          .result-sidebar {
            position: relative;
            top: 0;
            max-height: none;
            margin-bottom: 1rem;
          }
        }

        .sidebar-title {
          font-size: 0.75rem;
          color: var(--color-text-light);
          margin-bottom: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
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
          padding: 0.625rem 0.75rem;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          color: var(--color-text);
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          width: 100%;
          font-size: 0.8125rem;
        }

        .doc-item:hover {
          border-color: var(--color-accent);
          background: var(--color-surface);
        }

        .doc-item.active {
          background: var(--color-accent);
          border-color: var(--color-accent);
          color: white;
        }

        .doc-item.active .doc-confidence {
          color: rgba(255, 255, 255, 0.9);
        }

        .doc-name {
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
          min-width: 0;
          font-size: 0.8125rem;
        }

        .doc-confidence {
          font-size: 0.6875rem;
          color: var(--color-text-light);
          margin-left: 0.5rem;
          font-weight: 600;
          flex-shrink: 0;
        }

        /* Main Content */
        .result-main {
          width: 100%;
          height: 100%;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        .result-viewer.has-sidebar .result-main-wrapper {
          margin-left: 0;
          width: 100%;
        }

        .result-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          flex: 1;
          min-height: 0;
        }

        .result-grid.single-doc-grid {
          grid-template-columns: 1fr 1fr;
          max-width: 1400px;
          margin: 0 auto;
        }


        @media (max-width: 768px) {
          .result-viewer {
            padding: 0.5rem 0;
            gap: 1rem;
          }

          .result-viewer-content {
            gap: 1rem;
          }

          .result-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .result-grid.single-doc-grid {
            grid-template-columns: 1fr;
          }

          .result-card {
            max-height: none;
            height: auto;
          }

          .image-card {
            max-height: 400px;
          }

          .text-card {
            max-height: 500px;
          }
        }

        /* Cards */
        .result-card {
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          height: 100%;
          max-height: calc(100vh - 100px);
        }

        .image-card {
          height: 100%;
        }

        .text-card {
          height: 100%;
        }

        .card-header {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--color-border);
          background: var(--color-surface);
          flex-shrink: 0;
        }

        .card-header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        @media (max-width: 768px) {
          .card-header-top {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }

          .card-header-top h3 {
            font-size: 0.9375rem;
          }

          .card-header-top .page-navigation {
            width: 100%;
            justify-content: space-between;
          }
        }

        .card-header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          flex-wrap: wrap;
          width: 100%;
          min-width: 0;
        }

        @media (max-width: 768px) {
          .card-header {
            padding: 0.75rem 1rem;
          }

          .card-header-content {
            flex-direction: column;
            gap: 0.75rem;
          }

          .card-title-group {
            width: 100%;
            flex-wrap: wrap;
            gap: 0.5rem;
          }

          .card-actions {
            width: 100%;
            justify-content: flex-start;
          }

          .action-btn {
            flex: 1;
            min-width: 0;
            padding: 0.5rem 0.625rem;
            font-size: 0.75rem;
          }
        }

        .card-title-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .card-header h3 {
          font-size: 1rem;
          margin: 0;
          font-weight: 600;
        }

        /* Page Navigation */
        .page-navigation {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        @media (max-width: 768px) {
          .page-navigation {
            gap: 0.375rem;
            font-size: 0.8125rem;
            width: 100%;
            justify-content: center;
          }

          .page-navigation .page-nav-btn {
            padding: 0.375rem 0.5rem;
            font-size: 0.75rem;
            min-width: 36px;
          }

          .page-navigation .page-nav-btn svg {
            width: 14px;
            height: 14px;
          }

          .page-info {
            font-size: 0.75rem;
            white-space: nowrap;
          }
        }

        .page-navigation-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1.5rem;
          border-top: 1px solid var(--color-border);
          background: var(--color-surface);
          flex-shrink: 0;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        @media (max-width: 768px) {
          .page-navigation-footer {
            padding: 0.625rem 1rem;
            flex-direction: column;
            gap: 0.75rem;
          }

          .page-navigation-footer .page-nav-btn {
            flex: 1;
            min-width: 0;
            padding: 0.5rem 0.75rem;
            font-size: 0.8125rem;
          }

          .page-navigation-footer .page-info {
            order: -1;
            width: 100%;
            text-align: center;
          }
        }

        .page-nav-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--color-surface);
          color: var(--color-text);
          border: 1px solid var(--color-border);
          padding: 0.5rem 1rem;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .page-nav-btn:hover:not(:disabled) {
          background: var(--color-accent);
          color: white;
          border-color: var(--color-accent);
        }

        .page-nav-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .page-info {
          font-size: 0.875rem;
          color: var(--color-text-light);
          font-weight: 500;
          white-space: nowrap;
        }

        .page-badge {
          background: var(--color-surface);
          color: var(--color-text);
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-md);
          font-size: 0.75rem;
          font-weight: 600;
          border: 1px solid var(--color-border);
        }

        .confidence-badge {
          background: #e0f2fe;
          color: #0369a1;
          padding: 0.375rem 0.75rem;
          border-radius: var(--radius-md);
          font-size: 0.75rem;
          font-weight: 600;
        }

        [data-theme="dark"] .confidence-badge {
          background: rgba(129, 140, 248, 0.2);
          color: #a5b4fc;
        }

        .card-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .action-btn {
          background: var(--color-surface);
          color: var(--color-text);
          border: 1px solid var(--color-border);
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius-md);
          font-size: 0.8125rem;
          font-weight: 500;
          transition: all 0.2s ease;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .action-btn:hover {
          background: var(--color-accent);
          color: white;
          border-color: var(--color-accent);
        }

        .action-btn.success {
          background: var(--color-success);
          color: white;
          border-color: var(--color-success);
        }

        /* Image Container */
        .image-container {
          flex: 1;
          background: #f9fafb;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 1rem;
          min-height: 0;
          position: relative;
          user-select: none;
          cursor: zoom-in;
        }

        .image-container.zoom-active {
          cursor: grab;
        }

        .image-container.dragging {
          cursor: grabbing;
        }

        [data-theme="dark"] .image-container {
          background: #0a0d14;
        }

        .image-zoom-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.1s ease-out;
          transform-origin: center center;
          will-change: transform;
        }

        .image-zoom-wrapper.dragging {
          transition: none;
        }

        .image-container img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-md);
          pointer-events: auto;
        }

        .clickable-image {
          cursor: zoom-in;
          transition: transform 0.2s ease;
        }

        .clickable-image:hover {
          transform: scale(1.02);
        }

        /* Image Modal */
        .image-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 2rem;
          animation: fadeIn 0.2s ease;
        }

        .image-modal-content {
          position: relative;
          max-width: 95vw;
          max-height: 95vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: scaleIn 0.2s ease;
        }

        .modal-image {
          max-width: 100%;
          max-height: 85vh;
          object-fit: contain;
          border-radius: var(--radius-md);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .image-modal-close {
          position: absolute;
          top: -2.5rem;
          right: 0;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: var(--radius-md);
          padding: 0.5rem;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .image-modal-close:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .modal-page-info {
          margin-top: 1rem;
          color: white;
          font-size: 0.875rem;
          opacity: 0.8;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .image-modal-overlay {
            padding: 1rem;
          }

          .image-modal-close {
            top: -3rem;
            right: 0;
          }
        }

        /* Text Content */
        .text-content {
          flex: 1;
          padding: 1rem 1.5rem;
          overflow-y: auto;
          overflow-x: auto;
          background: var(--color-bg);
          min-height: 0;
        }

        @media (max-width: 768px) {
          .text-content {
            padding: 0.75rem 1rem;
          }

          .text-content pre,
          .text-editor {
            font-size: 0.8125rem;
          }
        }

        .text-content pre {
          white-space: pre-wrap;
          font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', monospace;
          font-size: 0.875rem;
          line-height: 1.6;
          color: var(--color-text);
          margin: 0;
          word-break: break-word;
        }

        .text-editor {
          width: 100%;
          height: 100%;
          border: none;
          outline: 2px solid var(--color-accent);
          outline-offset: -2px;
          background: var(--color-bg);
          color: var(--color-text);
          font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', monospace;
          font-size: 0.875rem;
          line-height: 1.6;
          padding: 1rem 1.5rem;
          resize: none;
          white-space: pre-wrap;
          word-break: break-word;
          tab-size: 4;
        }

        .text-editor:focus {
          outline: 2px solid var(--color-accent);
        }

        /* Tags Section Below */
        .tags-section-below {
          margin-top: 0.75rem;
          padding: 0.5rem 1rem;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
        }

        .tags-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .tags-header h3 {
          font-size: 0.8125rem;
          margin: 0;
          font-weight: 600;
          color: var(--color-text-light);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .tags-header-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          margin-top: 0.5rem;
        }

        .tags-toggle-btn {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          background: transparent;
          border: 1px solid var(--color-border);
          color: var(--color-text-light);
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tags-toggle-btn:hover {
          background: var(--color-surface-hover);
          border-color: var(--color-accent);
          color: var(--color-accent);
        }

        .add-tag-btn {
          background: var(--color-accent);
          color: white;
          border: none;
          padding: 0.25rem 0.625rem;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .add-tag-btn:hover {
          opacity: 0.9;
        }

        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.375rem;
        }

        .tag-wrapper {
          display: inline-flex;
          align-items: center;
          gap: 0.125rem;
        }

        .tag {
          background: var(--color-bg);
          color: var(--color-accent);
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          border: 1px solid var(--color-border);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tag:hover {
          background: var(--color-surface-hover);
          border-color: var(--color-accent);
        }

        .tag-input {
          background: var(--color-bg);
          color: var(--color-text);
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          border: 2px solid var(--color-accent);
          font-weight: 500;
          min-width: 80px;
          font-family: inherit;
        }

        .tag-remove {
          background: transparent;
          border: none;
          color: var(--color-text-light);
          font-size: 1rem;
          line-height: 1;
          cursor: pointer;
          padding: 0;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .tag-remove:hover {
          background: var(--color-error);
          color: white;
        }

      `}</style>
    </div>
  );
}
