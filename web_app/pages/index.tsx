import React, { useState, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { Worker } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { jsPDF } from 'jspdf';

// Lazy-load the PDF Viewer to improve performance
const Viewer = lazy(() =>
  import('@react-pdf-viewer/core').then((mod) => ({ default: mod.Viewer }))
);

// Helper function to highlight text matches
const highlightText = (text: string, searchTerm: string): JSX.Element => {
  if (!searchTerm) return <span>{text}</span>;
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span key={i} className="highlight">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

const IndexPage = () => {
  // Document states
  const [file, setFile] = useState<File | null>(null);
  const [fileURL, setFileURL] = useState<string | null>(null);

  // Summaries, Q&A
  const [summary, setSummary] = useState<string | null>(null);
  const [summarySentiment, setSummarySentiment] = useState<any>(null);
  const [chatHistory, setChatHistory] = useState<{ question: string; answer: string }[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');

  // Loading and error states
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  const [isLoadingQA, setIsLoadingQA] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Search state for filtering chat history
  const [searchQuery, setSearchQuery] = useState<string>('');

  // ------------------------------
  // Handle new file selection (clears previous state)
  // ------------------------------
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFileURL(URL.createObjectURL(selectedFile));

      // Clear previous states for a fresh session
      setChatHistory([]);
      setSummary(null);
      setSummarySentiment(null);
      setError(null);

      // Summarize the new document
      summarizeDocument(selectedFile);
    }
  };

  // ------------------------------
  // Summarize the uploaded document
  // ------------------------------
  const summarizeDocument = async (file: File) => {
    setIsLoadingSummary(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://127.0.0.1:5000/summarize', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setSummary(null);
        setSummarySentiment(null);
      } else {
        setSummary(data.summary);
        setSummarySentiment(data.sentiment);
      }
    } catch (err) {
      console.error('Error summarizing document:', err);
      setError('Failed to summarize document.');
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // ------------------------------
  // Ask a question about the document
  // ------------------------------
  const handleQuestionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file || !currentQuestion) return;

    setIsLoadingQA(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('question', currentQuestion);

    try {
      const response = await fetch('http://127.0.0.1:5000/contracts', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setChatHistory((prev) => [
          ...prev,
          { question: currentQuestion, answer: data.answer || "Answer doesn't exist" },
        ]);
      }
      setCurrentQuestion('');
    } catch (err) {
      console.error('Error during Q&A:', err);
      setError('Failed to process question.');
    } finally {
      setIsLoadingQA(false);
    }
  };

  // ------------------------------
  // Generate and download a PDF file for given content
  // ------------------------------
  const downloadPDF = (filename: string, title: string, content: string) => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(title, 10, 20);
    doc.setFontSize(12);
    const lines = doc.splitTextToSize(content, 180);
    doc.text(lines, 10, 30);
    doc.save(filename);
  };

  // ------------------------------
  // Filter chat history based on search query
  // ------------------------------
  const filteredChatHistory = chatHistory.filter((chat) =>
    chat.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container">
      <h1 style={{ textAlign: 'center' }}>Analysis</h1>

      {/* File Upload */}
      <div className="file-upload">
        <label className="file-input-label">
          <input
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.txt"
            className="file-input"
          />
          Choose File
        </label>
        <span className="file-placeholder">{file ? file.name : 'No file chosen'}</span>
      </div>

      {/* Document Viewer */}
      {fileURL && (
        <div className="document-viewer">
          <h3>Document Preview</h3>
          <Suspense fallback={<p>Loading document viewer...</p>}>
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js">
              <div className="pdf-viewer">
                <Viewer fileUrl={fileURL} />
              </div>
            </Worker>
          </Suspense>
        </div>
      )}

      {/* Error Message */}
      {error && <p className="error-message">{error}</p>}

      {/* Summary & Sentiment */}
      {isLoadingSummary ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="loading"
        >
          Generating summary...
        </motion.p>
      ) : (
        summary && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7 }}
              className="response-container"
            >
              <h2>Document Summary</h2>
              <p>{summary}</p>
              <button
                onClick={() => downloadPDF('document-summary.pdf', 'Document Summary', summary)}
                className="download-btn"
              >
                Download Summary (PDF)
              </button>
            </motion.div>

            {summarySentiment && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7 }}
                className="sentiment-container"
              >
                <h3>Summary Polarity</h3>
                <div className="sentiment-box">
                  <span className={`sentiment-tag sentiment-${summarySentiment.label.toLowerCase()}`}>
                    {summarySentiment.label}
                  </span>
                </div>
              </motion.div>
            )}
          </>
        )
      )}

      {/* Search Input */}
      <div className="chat-tools">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search chat history..."
          className="search-input"
        />
      </div>

      {/* Chat Container */}
      <div className="chat-container">
        {filteredChatHistory.map((chat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="chat-entry"
          >
            <div className="user-question">
              <strong>Q:</strong> {chat.question}
            </div>
            <div className="system-answer">
              <strong>A:</strong> {highlightText(chat.answer, searchQuery)}
            </div>
          </motion.div>
        ))}
        {isLoadingQA && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="loading dots"
          >
            Generating response...
          </motion.p>
        )}
      </div>

      {/* Chat Input Form */}
      <form onSubmit={handleQuestionSubmit} className="chat-input">
        <input
          type="text"
          value={currentQuestion}
          onChange={(e) => setCurrentQuestion(e.target.value)}
          placeholder="Type your question here..."
        />
        <button type="submit" disabled={isLoadingQA || !file}>
          {isLoadingQA ? 'Loading...' : 'Send'}
        </button>
      </form>

      {/* Download Q&A History */}
      {chatHistory.length > 0 && (
        <div className="download-history">
          <button
            onClick={() => {
              const historyText = chatHistory
                .map((chat) => `Q: ${chat.question}\nA: ${chat.answer}\n`)
                .join('\n');
              downloadPDF('qa-history.pdf', 'Q&A History', historyText);
            }}
            className="download-btn"
          >
            Download Q&A History (PDF)
          </button>
        </div>
      )}
    </div>
  );
};

export default IndexPage;
