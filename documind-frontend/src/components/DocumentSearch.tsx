import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, SearchX, Sparkles, AlertCircle } from 'lucide-react';
import type { SearchMatch } from '../types/document';
import { documentService } from '../services/api';

export const DocumentSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchMatch[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    try {
      setIsSearching(true);
      setError('');
      setHasSearched(false);
      const response = await documentService.searchDocuments(query);
      setResults(response.matches);
      setHasSearched(true);
    } catch {
      setError('Search failed. Please check your connection and try again.');
      setResults([]);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-icon card-icon--purple">
          <Sparkles size={20} />
        </div>
        <div>
          <div className="card-title">Semantic Vector Search</div>
          <div className="card-subtitle">Find documents using natural language powered by AI embeddings</div>
        </div>
      </div>

      <form onSubmit={handleSearch}>
        <div className="search-bar">
          <input
            className="input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you're looking for..."
            id="search-input"
          />
          <motion.button
            type="submit"
            className="btn btn-primary"
            disabled={isSearching || !query.trim()}
            whileTap={{ scale: 0.95 }}
          >
            {isSearching ? (
              <span className="spinner" />
            ) : (
              <Search size={18} />
            )}
          </motion.button>
        </div>
      </form>

      {/* Error state */}
      {error && (
        <motion.div
          className="status-msg status-msg--error"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle size={16} />
          {error}
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence mode="wait">
        {isSearching && (
          <motion.div
            key="searching"
            className="empty-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="spinner" style={{ margin: '0 auto 0.75rem', width: 24, height: 24, borderWidth: 2.5, color: 'var(--accent-blue-light)' }} />
            <div className="empty-state-title">Searching vector database...</div>
            <div className="empty-state-text">Analyzing semantic similarity across all documents</div>
          </motion.div>
        )}

        {!isSearching && hasSearched && results.length === 0 && !error && (
          <motion.div
            key="no-results"
            className="empty-state"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="empty-state-icon">
              <SearchX size={40} />
            </div>
            <div className="empty-state-title">No matching documents found</div>
            <div className="empty-state-text">
              Try rephrasing your query or uploading more documents to expand the knowledge base.
            </div>
          </motion.div>
        )}

        {!isSearching && results.length > 0 && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem', marginBottom: '0.25rem' }}>
              {results.length} result{results.length !== 1 ? 's' : ''} found for <strong style={{ color: 'var(--text-secondary)' }}>"{query}"</strong>
            </div>
            <ul className="results-list">
              {results.map((match, index) => (
                <motion.li
                  key={match.document_id}
                  className="result-item"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                >
                  <div className="result-rank">#{index + 1}</div>
                  <FileText size={18} style={{ color: 'var(--accent-blue-light)', flexShrink: 0 }} />
                  <div className="result-info">
                    <div className="result-filename">{match.filename}</div>
                    <div className="result-id">{match.document_id}</div>
                  </div>
                  <span className="result-badge">Match</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}

        {!isSearching && !hasSearched && (
          <motion.div
            key="initial"
            className="empty-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="empty-state-icon">
              <Search size={36} />
            </div>
            <div className="empty-state-title">Ready to search</div>
            <div className="empty-state-text">
              Enter a natural language query above to find semantically similar documents.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};