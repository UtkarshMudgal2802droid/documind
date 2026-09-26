import React, { useState } from 'react';
import { documentService } from '../services/api';

export const DocumentUpload: React.FC = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [status, setStatus] = useState<string>('');
    const [isUploading, setIsUploading] = useState<boolean>(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleUpload = async () => {
        if (files.length === 0) return;

        setIsUploading(true);
        setStatus(`Uploading ${files.length} document(s)...`);

        let successCount = 0;
        let failCount = 0;

        for (const file of files) {
            try {
                await documentService.uploadDocument(file);
                successCount++;
                setStatus(`Uploaded ${successCount} of ${files.length}...`);
            } catch (error) {
                console.error(`Failed to upload ${file.name}:`, error);
                failCount++;
            }
        }

        setStatus(`Batch Complete! ${successCount} queued for AI. ${failCount > 0 ? `(${failCount} failed)` : ''}`);
        setIsUploading(false);
        setFiles([]);
    };

    return (
        <div className="card">
            <h2>1. Document Ingestion (Batch)</h2>
            <input type="file" multiple onChange={handleFileChange} />

            {files.length > 0 && (
                <ul style={{ marginTop: '0', marginBottom: '1rem' }}>
                    {files.map((file, index) => (
                        <li key={index} style={{ padding: '0.5rem', marginBottom: '0.2rem' }}>
                            <small>{file.name}</small>
                        </li>
                    ))}
                </ul>
            )}

            <button onClick={handleUpload} disabled={files.length === 0 || isUploading}>
                {isUploading ? 'Processing Batch...' : 'Upload Batch to Pipeline'}
            </button>
            {status && <p>{status}</p>}
        </div>
    );
};