'use client';

import { useState, useEffect } from 'react';

interface Document {
  id: string;
  fileId: string; // OpenAI file ID
  filename: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  processingTimeMs: number;
  status: string;
  extractedContent: any;
  vectorStoreId?: string;
  vectorStoreFileId?: string;
  extractedFileId?: string;
  errorMessage?: string;
}

export default function DocumentsTab() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm('Delete this document permanently?');
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete');
      }
    } catch (err) {
      alert('Failed to delete document');
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/documents');
      const data = await response.json();
      
      if (data.success) {
        setDocuments(data.documents);
      } else {
        setError(data.error || 'Failed to fetch documents');
      }
    } catch (err) {
      setError('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      success: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-black">Loading documents...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={fetchDocuments}
                className="bg-red-100 text-red-800 px-3 py-1 rounded-md text-sm hover:bg-red-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📄</div>
        <h3 className="text-lg font-medium text-black mb-2">No documents yet</h3>
        <p className="text-black">Upload your first document to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-black">Documents</h2>
        <div className="text-sm text-black">
          {documents.length} document{documents.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="space-y-3">
        {documents.map((doc) => (
          <div key={doc.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div
              className="p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {doc.fileType.includes('pdf') ? '📄' :
                       doc.fileType.includes('image') ? '🖼️' : '📝'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-black break-words">
                        {doc.originalName}
                      </h3>
                      <div className="flex items-center space-x-4 text-xs text-black">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>{formatDate(doc.uploadedAt)}</span>
                        <span>{doc.processingTimeMs}ms</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {getStatusBadge(doc.status)}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                    title="Delete document"
                    className="text-red-500 hover:text-red-700"
                  >
                    🗑️
                  </button>
                  <div className="text-gray-400">
                    {expandedDoc === doc.id ? '▲' : '▼'}
                  </div>
                </div>
              </div>
            </div>

            {expandedDoc === doc.id && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div>
                    <h4 className="font-medium text-black mb-3">Basic Information</h4>
                    <div className="space-y-2 text-sm text-black">
                      <div><span className="font-medium">Database ID:</span> <span className="font-mono text-xs">{doc.id}</span></div>
                      <div><span className="font-medium">OpenAI File ID:</span> <span className="font-mono text-xs">{doc.fileId}</span></div>
                      <div><span className="font-medium">Filename:</span> <span className="break-all">{doc.filename}</span></div>
                      <div><span className="font-medium">Original Name:</span> <span className="break-all">{doc.originalName}</span></div>
                      <div><span className="font-medium">File Type:</span> {doc.fileType}</div>
                      <div><span className="font-medium">File Size:</span> {formatFileSize(doc.fileSize)}</div>
                      <div><span className="font-medium">Uploaded:</span> {formatDate(doc.uploadedAt)}</div>
                      <div><span className="font-medium">Processing Time:</span> {doc.processingTimeMs}ms</div>
                      <div><span className="font-medium">Status:</span> {getStatusBadge(doc.status)}</div>
                      {doc.errorMessage && (
                        <div><span className="font-medium">Error:</span> <span className="text-red-600 break-all">{doc.errorMessage}</span></div>
                      )}
                    </div>
                  </div>

                  {/* Vector Store Info */}
                  <div>
                    <h4 className="font-medium text-black mb-3">Search Index</h4>
                    <div className="space-y-2 text-sm text-black">
                      <div><span className="font-medium">Vector Store ID:</span> <span className="font-mono text-xs break-all">{doc.vectorStoreId || 'N/A'}</span></div>
                      <div><span className="font-medium">Vector Store File ID:</span> <span className="font-mono text-xs break-all">{doc.vectorStoreFileId || 'N/A'}</span></div>
                      <div><span className="font-medium">Extracted File ID:</span> <span className="font-mono text-xs break-all">{doc.extractedFileId || 'N/A'}</span></div>
                    </div>
                  </div>
                </div>

                {/* Extracted Content */}
                {doc.extractedContent && (
                  <div className="mt-6">
                    <h4 className="font-medium text-black mb-3">Extracted Content</h4>
                    
                    {/* Tables */}
                    {doc.extractedContent.tables && doc.extractedContent.tables.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-black mb-2">
                          Tables ({doc.extractedContent.tables.length} entries)
                        </h5>
                        <div className="bg-white border rounded-md p-3">
                          <div className="space-y-1 text-xs">
                            {doc.extractedContent.tables.map((table: any, index: number) => (
                              <div key={index} className="flex space-x-2 break-words">
                                <span className="font-medium text-blue-600 flex-shrink-0">{table.row}:</span>
                                <span className="text-black flex-shrink-0">{table.column}</span>
                                <span className="text-black flex-shrink-0">=</span>
                                <span className="text-black break-all">{table.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Raw Text */}
                    {doc.extractedContent.rawText && (
                      <div>
                        <h5 className="text-sm font-medium text-black mb-2">
                          Raw Text ({doc.extractedContent.rawText.length} characters)
                        </h5>
                        <div className="bg-white border rounded-md p-3">
                          <div className="text-xs text-black whitespace-pre-wrap break-words">
                            {doc.extractedContent.rawText}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Raw Database Data */}
                <details className="mt-6">
                  <summary className="cursor-pointer text-sm font-medium text-black hover:text-gray-800">
                    Show Raw Database Data
                  </summary>
                  <div className="mt-2 bg-white border rounded-md p-3">
                    <pre className="text-xs text-black whitespace-pre-wrap break-words overflow-x-auto">
                      {JSON.stringify(doc, null, 2)}
                    </pre>
                  </div>
                </details>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}