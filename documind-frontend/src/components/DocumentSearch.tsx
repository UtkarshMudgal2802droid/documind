import React, { useState } from 'react';
import { documentService } from '../services/api';
import type { SearchMatch } from '../types/document';

export const DocumentSearch: React.FC = () => {
    const [query, setQuery] = useState<string>('');
    const [results, setResults] = useState<SearchMatch[]>([]);
    const [isSearching, setIsSearching] = useState<boolean>(false);

    const handleSearch = async () => {
        if (!query.trim()) return;
        try {
            setIsSearching(true);
            const response = await documentService.searchDocuments(query);
            setResults(response.matches);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="card">
            <h2>2. Semantic Vector Search</h2>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., audit network infrastructure"
            />
            <button onClick={handleSearch} disabled={isSearching || !query}>
                {isSearching ? 'Searching...' : 'Search AWS Database'}
            </button>

            {results.length > 0 && (
                <ul>
                    {results.map((match) => (
                        <li key={match.document_id}>
                            <strong>{match.filename}</strong><br />
                            <small>{match.document_id}</small>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};