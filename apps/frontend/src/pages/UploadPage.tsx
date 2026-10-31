import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useA11y } from '../context/A11yContext';
import { validateDocumentUpload, analyzeDocument } from '../services/document.service';
import {
  UploadCloud,
  FileText,
  Image,
  AlertCircle,
  CheckCircle2,
  X,
  ShieldCheck,
  Sparkles,
  Check,
} from 'lucide-react';

export const UploadPage: React.FC = () => {
  const { language } = useA11y();
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
      setError(
        `Unsupported file type (${file.type || 'unknown'}). Please upload a digital PDF document.`
      );
      return;
    }

    if (file.type.startsWith('image/')) {
      setError(
        'Image documents (PNG/JPEG) do not contain a selectable text layer. ClearDoc currently analyzes digital PDF documents (e-bills, medical invoices, statements, and notices).'
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(
        `File is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maximum allowed size is 10MB.`
      );
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
      const errResponse = err.response?.data?.error;
      const msg =
        errResponse?.message ||
        err.response?.data?.message ||
        'Failed to validate upload pipeline. Please ensure the file is a valid PDF.';
      const code = errResponse?.code;
      setError(code ? `[${code}] ${msg}` : msg);
    } finally {
      setValidating(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please select a document to upload.');
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);
      const res = await analyzeDocument(selectedFile, language);
      if (res && res.document) {
        navigate(`/documents/${res.document.id}`, { state: { document: res.document } });
      }
    } catch (err: any) {
      const errResponse = err.response?.data?.error;
      let msg = '';

      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        msg = 'The analysis request timed out. Render backend may be waking up from sleep. Please wait 15 seconds and try again.';
      } else if (errResponse?.message) {
        msg = errResponse.message;
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.response?.status === 502 || err.response?.status === 503) {
        msg = 'The backend service is currently waking up or temporarily unavailable on Render. Please try again in 15 seconds.';
      } else if (err.response?.status === 429) {
        msg = 'ClearDoc AI is currently experiencing high demand. Please wait a few seconds and try again.';
      } else if (!err.response && err.message) {
        msg = `Network error: ${err.message}. Please check that backend server is reachable.`;
      } else {
        msg = 'Document AI analysis failed. Please verify that backend Groq service and Supabase are healthy.';
      }

      const code = errResponse?.code;
      setError(code ? `[${code}] ${msg}` : msg);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 sm:py-14 lg:px-10 lg:py-16">
      {/* Header */}
      <header className="border-b border-deep-teal/10 pb-8">
        <div className="inline-flex items-center gap-2 rounded-sm bg-bright-cyan/10 px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-bright-cyan border border-bright-cyan/20">
          <span className="h-1.5 w-1.5 rounded-full bg-bright-cyan" />
          <span>New Document Analysis</span>
        </div>
        <h1 className="mt-3 text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-deep-teal break-words">
          Upload &amp; understand a document.
        </h1>
        <p className="mt-2.5 max-w-2xl text-base leading-relaxed text-deep-teal/70">
          Medical bills, utility statements, hospital records and legal notices are analyzed in
          memory and explained in simple, plain language.
        </p>
      </header>

      {/* Error Alert */}
      {error && (
        <div
          className="mt-8 flex items-start gap-3 border-l-4 border-terracotta bg-terracotta/10 px-5 py-4 text-deep-teal rounded-sm"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-terracotta" aria-hidden="true" />
          <div className="flex-1">
            <h2 className="text-sm font-bold text-deep-teal">Upload notice</h2>
            <p className="mt-1 text-sm leading-relaxed text-deep-teal/80">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="p-1 text-deep-teal/60 hover:text-deep-teal transition-colors"
            aria-label="Dismiss notice"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Success Alert */}
      {uploadSuccess && (
        <div
          className="mt-8 border-l-4 border-bright-cyan bg-bright-cyan/10 px-5 py-4 text-deep-teal rounded-sm"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-bright-cyan" aria-hidden="true" />
            <div>
              <h2 className="text-sm font-bold text-deep-teal">Upload pipeline verified</h2>
              <p className="mt-1 text-sm leading-relaxed text-deep-teal/80">
                File <strong className="font-bold">“{uploadSuccess.file.originalName}”</strong> (
                {uploadSuccess.file.detectedType.toUpperCase()},{' '}
                {formatFileSize(uploadSuccess.file.sizeBytes)}) passed in-memory signature and format
                validation.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        {/* Dropzone */}
        <div className="lg:col-span-7 min-w-0">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            tabIndex={0}
            role="button"
            aria-label="Upload document dropzone. Press Enter to select a file."
            className={`flex h-full min-h-[16rem] sm:min-h-[20rem] flex-col items-center justify-center rounded-sm border-2 border-dashed px-4 py-8 sm:px-6 sm:py-12 text-center transition-all duration-200 cursor-pointer ${
              isDragging
                ? 'border-bright-cyan bg-bright-cyan/5 shadow-md scale-[1.01]'
                : 'border-deep-teal/20 bg-white hover:border-bright-cyan hover:bg-deep-teal/2 shadow-xs'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
              onChange={handleFileChange}
              className="hidden"
              aria-hidden="true"
              tabIndex={-1}
            />

            <span className="flex h-14 w-14 items-center justify-center rounded-sm bg-deep-teal text-bright-cyan shadow-sm mb-4">
              <UploadCloud className="h-7 w-7" aria-hidden="true" />
            </span>

            <h2 className="text-xl font-bold tracking-tight text-deep-teal sm:text-2xl">
              {selectedFile ? 'Replace selected document' : 'Click to select or drag and drop'}
            </h2>
            <p className="mt-2 text-sm text-deep-teal/65">PDF, PNG or JPEG files up to 10MB</p>

            <span className="mt-6 inline-flex border border-deep-teal/20 px-5 py-2.5 text-sm font-bold text-deep-teal rounded-sm bg-surface hover:bg-white hover:border-bright-cyan transition-colors">
              Browse Files
            </span>
          </div>

          {/* Selected File Details */}
          {selectedFile && (
            <div className="mt-4 flex items-center justify-between gap-3 sm:gap-4 rounded-sm border border-deep-teal/15 bg-white p-3.5 sm:p-4 shadow-xs animate-rise min-w-0 overflow-hidden">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-deep-teal/5 text-deep-teal">
                  {selectedFile.type === 'application/pdf' ? (
                    <FileText className="h-5 w-5 text-deep-teal" aria-hidden="true" />
                  ) : (
                    <Image className="h-5 w-5 text-bright-cyan" aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-deep-teal">{selectedFile.name}</p>
                  <p className="truncate text-xs text-deep-teal/60">
                    {formatFileSize(selectedFile.size)} · {selectedFile.type || 'Document'}
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
                className="p-2 text-deep-teal/50 hover:text-terracotta hover:bg-terracotta/10 rounded-sm transition-colors cursor-pointer shrink-0"
                title="Remove file"
                aria-label="Remove selected file"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {/* Options & Actions */}
        <div className="lg:col-span-5 min-w-0 space-y-4">
          <div className="panel p-5 sm:p-6 space-y-6">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-deep-teal">
                Analysis Options
              </h2>
              <p className="mt-1 text-xs text-deep-teal/65 leading-relaxed">
                Documents are processed through multimodal AI to extract key facts, verified
                amounts, critical deadlines, and risk factors.
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!selectedFile || analyzing || validating}
                className="btn btn-primary w-full py-4 text-base font-bold shadow-sm hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                {analyzing ? (
                  <span className="flex items-center gap-2" role="status">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Analyzing document…</span>
                  </span>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-bright-cyan" aria-hidden="true" />
                    <span>Analyze Document</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleValidateOnly}
                disabled={!selectedFile || analyzing || validating}
                className="btn btn-quiet w-full py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {validating ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-deep-teal border-t-transparent" />
                ) : (
                  <Check className="h-4 w-4" aria-hidden="true" />
                )}
                <span>Verify file upload only</span>
              </button>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="flex items-start gap-3 rounded-sm border-l-4 border-ocean-teal bg-ocean-teal/5 p-4 text-deep-teal">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-ocean-teal" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-deep-teal/75">
              <strong className="font-bold text-deep-teal">In-memory privacy:</strong> Your document
              is processed directly in a volatile memory buffer and never stored as raw bytes on
              disk. Analysis records are owned strictly by your account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
