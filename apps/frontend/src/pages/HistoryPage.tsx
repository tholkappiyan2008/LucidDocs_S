import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getDocuments,
  deleteDocument,
  DocumentListItem,
  PaginationMeta,
} from '../services/document.service';
import {
  FileText,
  Trash2,
  ArrowUpRight,
  UploadCloud,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  Clock,
  Building,
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Delete modal state
  const [docToDelete, setDocToDelete] = useState<DocumentListItem | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const fetchHistory = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getDocuments(page, 10);
      if (res && res.documents) {
        setDocuments(res.documents);
        setPagination(res.pagination);
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        'Failed to load document history. Please check your network connection.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(pagination.page);
  }, []);

  const handleConfirmDelete = async () => {
    if (!docToDelete) return;

    try {
      setDeleting(true);
      await deleteDocument(docToDelete.id);

      setDocuments((prev) => prev.filter((d) => d.id !== docToDelete.id));
      setPagination((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }));

      setFeedback(`Document “${docToDelete.file_name}” was permanently deleted.`);
      setDocToDelete(null);
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message || 'Failed to delete document. Please try again.';
      setError(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14 lg:px-10 lg:py-16">
      {/* Header */}
      <header className="flex flex-col gap-6 border-b border-deep-teal/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-sm bg-bright-cyan/10 px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-bright-cyan border border-bright-cyan/20">
            <span className="h-1.5 w-1.5 rounded-full bg-bright-cyan" />
            <span>Document Archive</span>
          </div>
          <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-deep-teal">
            Document History
          </h1>
          <p className="mt-2.5 max-w-xl text-base leading-relaxed text-deep-teal/70">
            Every analysis you have run — reopen it to re-read, listen, or ask follow-up questions.
          </p>
        </div>

        <Link to="/upload" className="btn btn-primary px-6 py-3.5 font-bold shadow-xs shrink-0">
          <UploadCloud className="h-4 w-4" aria-hidden="true" />
          <span>Upload Document</span>
        </Link>
      </header>

      {/* Feedback Message */}
      {feedback && (
        <div
          className="mt-8 flex items-center justify-between gap-4 rounded-sm border-l-4 border-ocean-teal bg-ocean-teal/10 px-5 py-4 text-sm text-deep-teal"
          role="status"
          aria-live="polite"
        >
          <span className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-ocean-teal" aria-hidden="true" />
            <span>{feedback}</span>
          </span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 text-deep-teal/50 hover:text-deep-teal transition-colors"
            aria-label="Dismiss feedback"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          className="mt-8 flex items-center justify-between gap-4 rounded-sm border-l-4 border-terracotta bg-terracotta/10 px-5 py-4 text-sm text-deep-teal"
          role="alert"
        >
          <span className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-terracotta" aria-hidden="true" />
            <span>{error}</span>
          </span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="p-1 text-deep-teal/50 hover:text-deep-teal transition-colors"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="py-16 text-center" role="status">
          <span className="sr-only">Loading your document history</span>
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-3 border-deep-teal border-t-transparent" />
          <p className="mt-4 text-sm font-semibold text-deep-teal/70">
            Loading document archive…
          </p>
        </div>
      ) : documents.length === 0 ? (
        /* Empty State */
        <div className="mt-10 rounded-sm border border-dashed border-deep-teal/20 bg-white px-6 py-16 text-center shadow-xs">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-deep-teal/5 text-deep-teal">
            <FileText className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 className="mt-6 text-2xl font-bold tracking-tight text-deep-teal">
            No documents analyzed yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-deep-teal/70">
            Upload an electricity bill, hospital discharge summary, or official notice to get a
            plain-language breakdown, key dates and read-aloud narration.
          </p>
          <Link to="/upload" className="btn btn-primary mt-8 px-6 py-3.5 font-bold shadow-xs">
            <UploadCloud className="h-4 w-4" aria-hidden="true" />
            <span>Upload your first document</span>
          </Link>
        </div>
      ) : (
        /* Document Cards List */
        <div className="mt-8 space-y-4">
          <div className="divide-y divide-deep-teal/10 rounded-sm border border-deep-teal/10 bg-white shadow-xs">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="group p-5 sm:p-6 transition-colors hover:bg-deep-teal/2"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 sm:items-center sm:gap-6">
                  {/* Metadata */}
                  <div className="sm:col-span-3 space-y-1">
                    <span className="inline-block rounded-xs bg-ocean-teal/10 px-2 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wider text-ocean-teal">
                      {doc.doc_type || 'Document'}
                    </span>
                    <p className="flex items-center gap-1.5 text-xs text-deep-teal/70">
                      <Building className="h-3 w-3 text-deep-teal/40" />
                      <span className="truncate">{doc.sender || 'Unknown Sender'}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-deep-teal/50">
                      <Clock className="h-3 w-3 text-deep-teal/40" />
                      <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                    </p>
                  </div>

                  {/* Document Title & Summary */}
                  <div className="sm:col-span-6 min-w-0">
                    <h2 className="truncate text-base sm:text-lg font-bold tracking-tight text-deep-teal">
                      {doc.file_name}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-xs sm:text-sm leading-relaxed text-deep-teal/70">
                      {doc.plain_summary || 'Analysis ready to view.'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 sm:col-span-3 sm:justify-end">
                    <Link
                      to={`/documents/${doc.id}`}
                      className="btn btn-primary px-4 py-2 text-xs font-bold shadow-xs flex-1 sm:flex-none justify-center"
                      aria-label={`Open ${doc.file_name}`}
                    >
                      <span>Open</span>
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => setDocToDelete(doc)}
                      className="p-2 rounded-sm text-deep-teal/40 hover:text-terracotta hover:bg-terracotta/10 transition-colors cursor-pointer"
                      title="Delete document permanently"
                      aria-label={`Delete document ${doc.file_name}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 border-t border-deep-teal/10 pt-6">
              <span className="text-xs font-semibold text-deep-teal/65">
                Page {pagination.page} of {pagination.totalPages} · {pagination.total} total documents
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fetchHistory(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="rounded-sm border border-deep-teal/15 bg-white p-2 text-deep-teal hover:border-bright-cyan disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => fetchHistory(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="rounded-sm border border-deep-teal/15 bg-white p-2 text-deep-teal hover:border-bright-cyan disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal Dialog */}
      {docToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-deep-teal/60 backdrop-blur-xs p-4 animate-rise"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div className="w-full max-w-md rounded-sm border border-deep-teal/15 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 id="delete-dialog-title" className="text-lg font-bold text-deep-teal">
                  Permanently delete document?
                </h3>
                <p className="text-xs text-deep-teal/65">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-deep-teal/80">
              Are you sure you want to delete{' '}
              <strong className="font-bold text-deep-teal">“{docToDelete.file_name}”</strong>? The
              plain-language summary, key facts, deadlines, and follow-up Q&A records will be
              permanently purged from your account.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-deep-teal/10">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                disabled={deleting}
                className="btn btn-quiet py-2.5 px-4 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="btn btn-danger py-2.5 px-5 text-xs font-bold shadow-xs"
              >
                {deleting ? 'Deleting…' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
