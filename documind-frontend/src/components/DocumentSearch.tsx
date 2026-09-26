import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, SearchX, Sparkles, AlertCircle } from 'lucide-react';
import type { SearchMatch } from '../types/document';
import { documentService } from '../services/api';

const MAX_QUERY_LENGTH = 500;

export const DocumentSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchMatch[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');
  const [queryError, setQueryError] = useState('');

  const validateQuery = (q: string): boolean => {
    if (!q.trim()) {
      setQueryError('Please enter a search query.');
      return false;
    }
    if (q.trim().length > MAX_QUERY_LENGTH) {
      setQueryError(`Query must be under ${MAX_QUERY_LENGTH} characters.`);
      return false;
    }
    setQueryError('');
    return true;
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validateQuery(query)) return;

    try {
      setIsSearching(true);
      setError('');
      setHasSearched(false);
      const response = await documentService.searchDocuments(query.trim());
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

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-icon card-icon--purple">
          <Sparkles size={18} />
        </div>
        <div>
          <div className="card-title">Semantic Search</div>
          <div className="card-subtitle">Find documents using natural language</div>
        </div>
      </div>

      <form onSubmit={handleSearch}>
        <div className="search-bar">
          <input
            className={`input ${queryError ? 'input-error' : ''}`}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (queryError) setQueryError('');
            }}
            placeholder="Describe what you're looking for..."
            id="search-input"
            maxLength={MAX_QUERY_LENGTH}
          />
          <motion.button
            type="submit"
            className="btn btn-primary"
            disabled={isSearching || !query.trim()}
            whileTap={{ scale: 0.95 }}
          >
            {isSearching ? <span className="spinner" /> : <Search size={16} />}
          </motion.button>
        </div>
        {queryError && (
          <div className="input-error-msg">
            <AlertCircle size={12} />
            {queryError}
          </div>
        )}
        <div style={{ textAlign: 'right', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          {query.length}/{MAX_QUERY_LENGTH}
        </div>
      </form>

      {/* Error state */}
      {error && (
        <motion.div
          className="status-msg status-msg--error"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle size={14} />
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
            <div className="spinner" style={{ margin: '0 auto 0.65rem', width: 22, height: 22, borderWidth: 2.5, color: 'var(--accent-blue)' }} />
            <div className="empty-state-title">Searching vector database...</div>
            <div className="empty-state-text">Analyzing semantic similarity across all documents</div>
          </motion.div>
        )}

        {!isSearching && hasSearched && results.length === 0 && !error && (
          <motion.div
            key="no-results"
            className="empty-state"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="empty-state-icon">
              <SearchX size={36} />
            </div>
            <div className="empty-state-title">No matching documents</div>
            <div className="empty-state-text">
              Try different keywords or upload more documents to expand the knowledge base.
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
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.85rem', marginBottom: '0.2rem' }}>
              {results.length} result{results.length !== 1 ? 's' : ''} for <strong style={{ color: 'var(--text-secondary)' }}>"{query}"</strong>
            </div>
            <ul className="results-list">
              {results.map((match, index) => (
                <motion.li
                  key={match.document_id}
                  className="result-item"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                >
                  <div className="result-rank">#{index + 1}</div>
                  <FileText size={16} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
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

        {!isSearching && !hasSearched && !error && (
          <motion.div
            key="initial"
            className="empty-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="empty-state-icon">
              <Search size={32} />
            </div>
            <div className="empty-state-title">Ready to search</div>
            <div className="empty-state-text">
              Enter a natural language query to find semantically similar documents.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};