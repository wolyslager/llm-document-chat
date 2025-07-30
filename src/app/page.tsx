'use client';

import { useState } from 'react';
import TypingText from '@/components/TypingText';
import Sidebar from '@/components/Sidebar';
import DocumentsTab from '@/components/DocumentsTab';

export default function HomePage() {
  const [currentTab, setCurrentTab] = useState<'home' | 'documents'>('home');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResponse, setSearchResponse] = useState<any>(null);
  const [showTyping, setShowTyping] = useState(false);
  const [typingCompleted, setTypingCompleted] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResponse(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setResponse(null);

    const formData = new FormData();
    formData.append('file', file);

    // Abort the request if it takes longer than 60 seconds so we can show a nicer message
    const controller = new AbortController();
    let didTimeout = false;
    const timeoutId = setTimeout(() => {
      didTimeout = true;
      controller.abort();
    }, 60_000);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const res = await fetch(`${backendUrl}/api/upload`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      // If the server returns a 504 Gateway Timeout (or similar), show the same friendly message
      if (!res.ok) {
        if (res.status === 504 || res.status === 502) {
          throw new Error('timeout');
        }
      }

      const result = await res.json();
      setResponse(result);
    } catch (error: any) {
      // Treat fetch abort or generic network failure after our timeout as informational
      if (didTimeout || error.name === 'AbortError' || error.message === 'timeout') {
        setResponse({
          info: 'The upload is taking longer than expected. Processing will continue in the background – please check back in a few minutes.'
        });
      } else {
        setResponse({ error: error instanceof Error ? error.message : 'Upload failed' });
      }
    } finally {
      clearTimeout(timeoutId);
      setUploading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchResponse(null);
    setShowTyping(false);
    setTypingCompleted(false);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const res = await fetch(`${backendUrl}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery.trim() }),
      });

      const result = await res.json();
      setSearchResponse(result);
      
      // Start typing effect for successful responses
      if (result.success && result.response) {
        setShowTyping(true);
      }
    } catch (error) {
      setSearchResponse({ error: error instanceof Error ? error.message : 'Search failed' });
    } finally {
      setSearching(false);
    }
  };

  const handleTypingComplete = () => {
    setTypingCompleted(true);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const renderHomeTab = () => (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
        Document Upload & Search
      </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Document</h2>
            
            <div className="mb-4">
              <label htmlFor="file-input" className="block text-sm font-medium text-gray-700 mb-2">
                Select File
              </label>
              <input
                id="file-input"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {file && (
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Selected:</span> {file.name}
                </p>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {uploading ? 'Processing...' : 'Upload & Process'}
            </button>

            {/* Loading Animation */}
            {uploading && (
              <div className="mt-4">
                <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-md border border-blue-200">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <div className="text-blue-700">
                    <div className="font-medium">Processing your document...</div>
                    <div className="text-sm text-blue-600">This may take a few moments while we extract and index the content</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Search Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Documents</h2>
            
            <div className="mb-4">
              <label htmlFor="search-input" className="block text-sm font-medium text-gray-700 mb-2">
                Ask a question about your documents
              </label>
              <div className="flex gap-2">
                <input
                  id="search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  placeholder="e.g., What are the main topics discussed?"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                />
                <button
                  onClick={handleSearch}
                  disabled={!searchQuery.trim() || searching}
                  className="bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {searching ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Searching...</span>
                    </>
                  ) : (
                    <span>Search</span>
                  )}
                </button>
              </div>
            </div>

            {/* Loading Animation */}
            {searching && (
              <div className="mt-4">
                <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-md">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span className="text-blue-700 text-sm">Searching your documents...</span>
                </div>
              </div>
            )}

            {/* Search Results */}
            {searchResponse && !searching && (
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Search Result</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  {searchResponse.success ? (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Query:</span> {searchResponse.query}
                      </p>
                      <div className="prose prose-sm max-w-none text-black">
                        {showTyping && !typingCompleted ? (
                          <TypingText 
                            text={searchResponse.response}
                            speed={10}
                            className="whitespace-pre-wrap"
                            onComplete={handleTypingComplete}
                          />
                        ) : (
                          <div className="whitespace-pre-wrap">{searchResponse.response}</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-red-600 text-sm">
                      Error: {searchResponse.error}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upload Response */}
        {response && !uploading && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {response.duplicate ? 'Duplicate File Detected' :
               response.info ? 'Upload In Progress' :
               response.error ? 'Upload Error' : 'Upload Complete'}
            </h2>

            {response.info ? (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
                {response.info}
              </div>
            ) : response.error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {response.error}
              </div>
            ) : response.duplicate ? (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
                <div className="font-medium">File &quot;{response.originalName}&quot; already exists</div>
                <div className="text-sm mt-1">
                  Previously uploaded: {response.existingDocument ?
                    new Date(response.existingDocument.uploadedAt).toLocaleString() : 'Unknown'}
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
                <div className="font-medium">Successfully processed &quot;{response.originalName}&quot;</div>
                {response.extraction && (
                  <div className="text-sm mt-2 space-y-1">
                    <div>📊 Tables: {response.extraction.tables?.length || 0}</div>
                    <div>📝 Text: {response.extraction.rawText?.length || 0} characters</div>
                    <div>🔍 Added to search index</div>
                  </div>
                )}
              </div>
            )}
            
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                Show raw response
              </summary>
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm text-black mt-2">
                {JSON.stringify(response, null, 2)}
              </pre>
            </details>
          </div>
        )}
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {currentTab === 'home' ? renderHomeTab() : <DocumentsTab />}
        </div>
      </div>
    </div>
  );
}