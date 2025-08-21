import React, { useCallback, useState } from 'react';

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
  selectedFile: File | null;
  label: string;
  accept: string;
  id: string;
  helpText?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileChange, selectedFile, label, accept, id, helpText }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileChange(e.dataTransfer.files[0]);
    }
  }, [onFileChange]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileChange(e.target.files[0]);
    } else {
      onFileChange(null);
    }
  };

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <label
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`flex justify-center w-full h-32 px-4 transition bg-gray-700 border-2 ${isDragging ? 'border-cyan-400' : 'border-gray-600'} border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-500 focus:outline-none`}
      >
        <span className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="font-medium text-gray-400">
                {selectedFile ? selectedFile.name : 'Drop file or click to upload'}
                <span className="text-cyan-400 underline ml-1">browse</span>
            </span>
        </span>
        <input type="file" id={id} name={id} className="hidden" accept={accept} onChange={handleFileSelect} />
      </label>
      {helpText && <p className="text-xs text-gray-500 mt-1">{helpText}</p>}
    </div>
  );
};