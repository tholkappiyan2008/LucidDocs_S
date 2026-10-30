import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useA11y, SupportedLanguage } from '../context/A11yContext';
import { validateDocumentUpload, analyzeDocument } from '../services/document.service';
import {
  UploadCloud,
  FileText,
  Image,
  AlertCircle,
  CheckCircle2,
  X,
  Languages,
  ShieldCheck,
  Sparkles,
  Check,
} from 'lucide-react';

export const UploadPage: React.FC = () => {
  const { language, setLanguage } = useA11y();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];

  const validateAndSetFile = (file: File) => {
    setError(null);
    setUploadSuccess(null);

    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      setError(`Unsupported file type (${file.type || 'unknown'}). Please upload a PDF, PNG, or JPEG file.`);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(`File is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maximum allowed size is 10MB.`);
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleValidateOnly = async () => {
    if (!selectedFile) {
      setError('Please select a document to upload.');
      return;
    }

    try {
      setValidating(true);
      setError(null);
      const res = await validateDocumentUpload(selectedFile, language);
      setUploadSuccess(res);
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        'Failed to validate upload pipeline. Please ensure the file is a valid PDF or image.';
      setError(msg);
    } finally {
      setValidating(false);
    }
  };

  const handleAnalyzeWithGemini = async () => {
    if (!selectedFile) {
      setError('Please select a document to upload.');
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);
      const res = await analyzeDocument(selectedFile, language);
      if (res && res.document) {
        // Navigate to document details / results
        navigate(`/documents/${res.document.id}`, { state: { document: res.document } });
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        'Document AI analysis failed. Please verify that your GEMINI_API_KEY and SUPABASE credentials are configured in your .env file.';
      setError(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Upload & Understand Document
        </h1>
        <p className="mt-2 text-slate-600 text-base sm:text-lg">
          Upload any medical bill, utility statement, or legal notice. We analyze it securely in memory.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          className="mb-6 p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-start gap-3 text-rose-900"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle className="w-6 h-6 flex-shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-sm sm:text-base">Upload & Analysis Notice</h4>
            <p className="text-sm mt-0.5">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="p-1 hover:bg-rose-100 rounded-lg text-rose-700"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success Alert */}
      {uploadSuccess && (
        <div
          className="mb-6 p-5 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-start gap-3 text-emerald-950"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-emerald-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-base">File Upload Pipeline Verified!</h4>
            <p className="text-sm text-emerald-800 mt-1">
              File <strong>"{uploadSuccess.file.originalName}"</strong> (
              {uploadSuccess.file.detectedType.toUpperCase()}, {formatFileSize(uploadSuccess.file.sizeBytes)})
              passed memory storage and magic-byte signature validation.
            </p>
          </div>
        </div>
      )}

      {/* Upload Box & Dropzone */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-8">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              fileInputRef.current?.click();
            }
          }}
          tabIndex={0}
          role="button"
          aria-label="Upload document dropzone. Press Enter to select a file."
          className={`border-3 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all focus:outline-none focus:ring-4 focus:ring-emerald-500/20 ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50 scale-[1.01]'
              : 'border-slate-300 hover:border-emerald-400 bg-slate-50/50 hover:bg-slate-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
            onChange={handleFileChange}
            className="hidden"
            aria-hidden="true"
          />

          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-slate-800">
            {selectedFile ? 'Replace selected document' : 'Click to select or drag and drop document'}
          </h3>
          <p className="text-slate-500 text-sm mt-1">
            PDF, PNG, or JPEG files up to 10MB
          </p>

          <span className="inline-block mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow hover:bg-emerald-700 transition-colors">
            Browse Files
          </span>
        </div>

        {/* Selected File Card */}
        {selectedFile && (
          <div className="mt-6 p-4 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-700 shadow-sm flex-shrink-0">
                {selectedFile.type === 'application/pdf' ? (
                  <FileText className="w-5 h-5 text-rose-600" />
                ) : (
                  <Image className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div className="truncate">
                <p className="text-sm font-bold text-slate-900 truncate">{selectedFile.name}</p>
                <p className="text-xs text-slate-500">
                  {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Document'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
                setUploadSuccess(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl transition-colors ml-2"
              title="Remove file"
              aria-label="Remove selected file"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Language Selection Row */}
        <div className="mt-6 pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Languages className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <label htmlFor="upload-language" className="text-sm font-bold text-slate-800">
                Explanation Language
              </label>
              <p className="text-xs text-slate-500">Choose your preferred language for summaries</p>
            </div>
          </div>

          <select
            id="upload-language"
            value={language}
            onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="en">English (Simplified)</option>
            <option value="ta">தமிழ் (Tamil)</option>
            <option value="te">తెలుగు (Telugu)</option>
            <option value="hi">हिंदी (Hindi)</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button
            type="button"
            onClick={handleAnalyzeWithGemini}
            disabled={!selectedFile || analyzing || validating}
            className="flex-1 py-4 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-lg focus:ring-4 focus:ring-emerald-500/20"
          >
            {analyzing ? (
              <div className="flex items-center gap-2" role="status">
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Analyzing with Gemini AI...</span>
              </div>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <span>Analyze with Gemini AI</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleValidateOnly}
            disabled={!selectedFile || analyzing || validating}
            className="sm:w-auto py-4 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl border border-slate-300 transition-all flex items-center justify-center gap-2 text-sm focus:ring-2 focus:ring-slate-400"
          >
            {validating ? (
              <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>Verify Upload Only</span>
          </button>
        </div>
      </div>

      {/* Security Guarantee Box */}
      <div className="flex items-center gap-3 p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl text-emerald-900 text-sm">
        <ShieldCheck className="w-6 h-6 text-emerald-600 flex-shrink-0" />
        <span>
          <strong>Zero Disk Retention:</strong> Your document is held strictly in volatile RAM buffer during validation and is never saved to unencrypted local storage.
        </span>
      </div>
    </div>
  );
};
