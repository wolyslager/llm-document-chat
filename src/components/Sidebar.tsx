'use client';

import { useState } from 'react';

interface SidebarProps {
  currentTab: 'home' | 'documents';
  onTabChange: (tab: 'home' | 'documents') => void;
}

export default function Sidebar({ currentTab, onTabChange }: SidebarProps) {
  return (
    <div className="w-64 bg-gray-900 text-white h-screen flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">Document Processor</h1>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => onTabChange('home')}
              className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                currentTab === 'home'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span>🏠</span>
                <span>Home</span>
              </div>
            </button>
          </li>
          
          <li>
            <button
              onClick={() => onTabChange('documents')}
              className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                currentTab === 'documents'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span>📄</span>
                <span>Documents</span>
              </div>
            </button>
          </li>
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-700 text-sm text-gray-400">
        <p>Upload • Process • Search</p>
      </div>
    </div>
  );
}