import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDocuments, deleteDocument, DocumentListItem, PaginationMeta } from '../services/document.service';
import {
  Clock,
  FileText,
  Building,
  Trash2,
  ExternalLink,
  UploadCloud,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
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

      // Remove item locally without needing full reload
      setDocuments((prev) => prev.filter((d) => d.id !== docToDelete.id));
      setPagination((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }));

      setFeedback(`Document "${docToDelete.file_name}" was deleted successfully.`);
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Clock className="w-8 h-8 text-emerald-600" />
            <span>Document History</span>
          </h1>
          <p className="mt-1 text-slate-600 text-sm sm:text-base">
            Review past document analyses, deadlines, and translations
          </p>
        </div>

        <Link
          to="/upload"
          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow transition-colors"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload New Document</span>
        </Link>
      </div>

      {/* Success Notification */}
      {feedback && (
        <div
          className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-950 text-sm"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{feedback}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 text-emerald-700 hover:bg-emerald-100 rounded-lg"
            aria-label="Dismiss feedback"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div
          className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-950 text-sm"
          role="alert"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="p-1 text-rose-700 hover:bg-rose-100 rounded-lg"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center" role="status">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600 font-medium">Loading your document history...</p>
        </div>
      ) : documents.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 sm:p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">No documents analyzed yet</h3>
          <p className="text-slate-600 max-w-md mx-auto text-sm sm:text-base mb-6">
            Upload your medical bills, utility statements, or official notices to get plain-language summaries and audio read-aloud.
          </p>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-2xl shadow transition-all"
          >
            <UploadCloud className="w-5 h-5" />
            <span>Upload Your First Document</span>
          </Link>
        </div>
      ) : (
        /* Document Cards List */
        <div className="space-y-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 p-5 sm:p-6 shadow-sm hover:shadow transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                    {doc.doc_type}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate max-w-[200px]">{doc.sender}</span>
                  </span>
                  <span className="text-xs text-slate-400 ml-auto md:ml-0">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 truncate mb-1">
                  {doc.file_name}
                </h3>

                <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                  {doc.plain_summary}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                <Link
                  to={`/documents/${doc.id}`}
                  className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-sm rounded-xl transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setDocToDelete(doc)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors focus:ring-2 focus:ring-rose-500"
                  title="Delete document"
                  aria-label={`Delete document ${doc.file_name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-slate-200">
              <span className="text-xs sm:text-sm text-slate-500 font-medium">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} documents)
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fetchHistory(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="p-2 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 text-slate-700 rounded-xl transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => fetchHistory(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-2 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 text-slate-700 rounded-xl transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal Dialog */}
      {docToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 id="delete-dialog-title" className="text-xl font-bold text-slate-900">
              Delete Document Record?
            </h3>

            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Are you sure you want to delete <strong>"{docToDelete.file_name}"</strong>? This will remove all associated AI summaries, translations, and questions permanently.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                disabled={deleting}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white shadow-sm transition-colors flex items-center gap-2"
              >
                {deleting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>Delete Record</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
