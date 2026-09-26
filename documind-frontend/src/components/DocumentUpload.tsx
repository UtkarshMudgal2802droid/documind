import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, CheckCircle, AlertCircle, CloudUpload } from 'lucide-react';
import toast from 'react-hot-toast';
import { documentService } from '../services/api';

export const DocumentUpload: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [uploadComplete, setUploadComplete] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
    setUploadComplete(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadComplete(false);
    setProgress({ current: 0, total: files.length });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
      try {
        await documentService.uploadDocument(files[i]);
        successCount++;
        setProgress({ current: i + 1, total: files.length });
      } catch {
        failCount++;
        toast.error(`Failed to upload ${files[i].name}`);
      }
    }

    setIsUploading(false);
    setUploadComplete(true);
    setFiles([]);

    if (successCount > 0) {
      toast.success(`${successCount} document${successCount > 1 ? 's' : ''} queued for AI vectorization`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} upload${failCount > 1 ? 's' : ''} failed`);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-icon card-icon--blue">
          <Upload size={20} />
        </div>
        <div>
          <div className="card-title">Document Ingestion</div>
          <div className="card-subtitle">Upload PDFs or text files for AI vectorization</div>
        </div>
      </div>

      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'dropzone--active' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="dropzone-icon">
          <CloudUpload size={36} />
        </div>
        <p className="dropzone-text">
          {isDragActive ? (
            'Drop files here...'
          ) : (
            <>Drag & drop files here, or <strong>click to browse</strong></>
          )}
        </p>
        <p className="dropzone-hint">Supports PDF and TXT files</p>
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.ul
            className="file-list"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {files.map((file, index) => (
              <motion.li
                key={`${file.name}-${index}`}
                className="file-item"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ delay: index * 0.05 }}
              >
                <FileText size={16} className="file-item-icon" />
                <span className="file-item-name">{file.name}</span>
                <span className="file-item-size">{formatSize(file.size)}</span>
                <button
                  className="file-item-remove"
                  onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                  aria-label={`Remove ${file.name}`}
                >
                  <X size={14} />
                </button>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {isUploading && (
        <div className="upload-progress">
          <div className="progress-bar-track">
            <motion.div
              className="progress-bar-fill"
              initial={{ width: 0 }}
              animate={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
          <div className="progress-text">
            <span>Uploading {progress.current} of {progress.total}...</span>
            <span>{Math.round((progress.current / progress.total) * 100)}%</span>
          </div>
        </div>
      )}

      {!isUploading && files.length > 0 && (
        <motion.button
          className="btn btn-primary btn-full"
          onClick={handleUpload}
          whileTap={{ scale: 0.98 }}
          style={{ marginTop: '1rem' }}
        >
          <Upload size={16} />
          Upload {files.length} file{files.length > 1 ? 's' : ''} to AI Pipeline
        </motion.button>
      )}

      {uploadComplete && (
        <motion.div
          className="status-msg status-msg--success"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <CheckCircle size={16} />
          All documents have been queued for AI vectorization
        </motion.div>
      )}
    </div>
  );
};