// File: src/components/NewProjectModal.tsx

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Framework } from '../types';

interface NewProjectModalProps {
  onClose: () => void;
  onCreate: (framework: Framework) => void;
}

const supportedFrameworks: Framework[] = ['React', 'Flask']; // Add more frameworks as needed

export default function NewProjectModal({ onClose, onCreate }: NewProjectModalProps) {
  const [selectedFramework, setSelectedFramework] = useState<Framework>('React');

  const handleCreate = () => {
    onCreate(selectedFramework);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-editor-bg w-96 p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-editor-text">New Project</h2>
          <button
            onClick={onClose}
            className="text-editor-icon hover:text-editor-text"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mb-4">
          <label htmlFor="framework" className="block text-sm font-medium text-editor-text mb-2">
            Select Framework
          </label>
          <select
            id="framework"
            value={selectedFramework}
            onChange={(e) => setSelectedFramework(e.target.value as Framework)}
            className="w-full px-3 py-2 border border-editor-border rounded-md bg-editor-bg text-editor-text focus:outline-none focus:border-editor-active"
          >
            {supportedFrameworks.map((framework) => (
              <option key={framework} value={framework}>
                {framework}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 mr-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
