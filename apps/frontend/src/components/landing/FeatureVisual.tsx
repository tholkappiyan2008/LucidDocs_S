import React from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  FileText,
  History,
  ListChecks,
  MessageSquare,
  Play,
  Volume2,
} from 'lucide-react';

/* ----------------------------------------------------------------------------
   Feature visuals — small, static UI previews used by the alternating feature
   showcase. Each one depicts a real ClearDoc capability with illustrative
   sample data. None of them are interactive: they are decorative previews,
   hidden from assistive technology, with the meaning carried by the adjacent
   feature copy.
   ---------------------------------------------------------------------------- */

export type FeatureVisualKind =
  | 'explain'
  | 'facts'
  | 'questions'
  | 'voice'
  | 'history'
  | 'deadlines';

const HEADERS: Record<FeatureVisualKind, { label: string; icon: React.ReactNode }> = {
  explain: { label: 'Original → plain English', icon: <FileText className="h-3.5 w-3.5" /> },
  facts: { label: 'Extracted at a glance', icon: <ListChecks className="h-3.5 w-3.5" /> },
  questions: { label: 'Document-grounded answers', icon: <MessageSquare className="h-3.5 w-3.5" /> },
  voice: { label: 'Read aloud', icon: <Volume2 className="h-3.5 w-3.5" /> },
  history: { label: 'Your document history', icon: <History className="h-3.5 w-3.5" /> },
  deadlines: { label: 'Deadlines & required action', icon: <Calendar className="h-3.5 w-3.5" /> },
};

const FACT_CARDS = [
  { label: 'Amount due', value: '₹2,740' },
  { label: 'Due date', value: '15 Jul 2026' },
  { label: 'Reference no.', value: 'EB-2026-004821' },
  { label: 'Issued by', value: 'Northgate Electricity Board' },
];

const HISTORY_ITEMS = [
  { name: 'electricity_bill_june.pdf', date: 'Analysed 12 Jul 2026', tone: 'text-terracotta' },
  { name: 'discharge_summary.pdf', date: 'Analysed 04 Jul 2026', tone: 'text-bright-cyan' },
  { name: 'rental_notice.pdf', date: 'Analysed 21 Jun 2026', tone: 'text-bright-cyan' },
];

const DEADLINES = [
  {
    what: 'Pay the bill',
    when: '15 Jul 2026',
    level: 'Critical',
    note: 'Late fee of ₹150 applies after this date',
    critical: true,
  },
  {
    what: 'Dispute the meter reading',
    when: 'Within 10 days of the bill',
    level: 'Soon',
    note: 'Raise a complaint with the reference number',
    critical: false,
  },
];

const VisualShell: React.FC<{ kind: FeatureVisualKind; children: React.ReactNode }> = ({
  kind,
  children,
}) => {
  const head = HEADERS[kind];
  return (
    <div
      aria-hidden="true"
      className="relative overflow-hidden rounded-sm border border-deep-teal/10 bg-white p-4 shadow-[0_10px_25px_-5px_rgba(0,49,53,0.12)] sm:p-5"
    >
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-deep-teal/10 pb-3">
        <span className="flex items-center gap-2 text-[0.625rem] font-extrabold uppercase tracking-[0.2em] text-deep-teal/60">
          <span className="text-bright-cyan">{head.icon}</span>
          {head.label}
        </span>
        <span className="rounded-sm border border-deep-teal/10 bg-surface px-1.5 py-0.5 text-[0.5rem] font-extrabold uppercase tracking-[0.14em] text-deep-teal/50">
          Sample
        </span>
      </div>
      {children}
    </div>
  );
};

export const FeatureVisual: React.FC<{ kind: FeatureVisualKind; className?: string }> = ({
  kind,
  className = '',
}) => {
  const body = (() => {
    switch (kind) {
      /* ---------------------------------------------------- explanations */
      case 'explain':
        return (
          <div className="space-y-3">
            <div className="border border-deep-teal/10 bg-[#FBFBF9] p-3">
              <div className="mb-2 text-[0.5rem] font-extrabold uppercase tracking-[0.16em] text-deep-teal/45">
                Original wording
              </div>
              <p className="text-[0.6875rem] leading-relaxed text-deep-teal/55 line-through decoration-terracotta/50">
                “The remittance of the aforesaid sum on or before the stipulated due date shall
                preclude the imposition of the applicable late payment surcharge.”
              </p>
            </div>
            <div className="flex justify-center text-bright-cyan" aria-hidden="true">
              <span className="text-[0.625rem] font-extrabold uppercase tracking-[0.2em]">
                ↓ ClearDoc
              </span>
            </div>
            <div className="border border-bright-cyan/40 bg-bright-cyan/10 p-3">
              <div className="mb-1.5 text-[0.5rem] font-extrabold uppercase tracking-[0.16em] text-deep-teal/55">
                In simple words
              </div>
              <p className="text-[0.8125rem] font-semibold leading-relaxed text-deep-teal">
                Pay on time and you won’t be charged extra. After 15 July a ₹150 late fee is added.
              </p>
            </div>
          </div>
        );

      /* ---------------------------------------------------------- facts */
      case 'facts':
        return (
          <div className="grid gap-2 sm:grid-cols-2">
            {FACT_CARDS.map((f) => (
              <div key={f.label} className="border border-deep-teal/10 bg-[#FBFCFA] px-3 py-2.5">
                <div className="text-[0.5rem] font-extrabold uppercase tracking-[0.16em] text-deep-teal/45">
                  {f.label}
                </div>
                <div className="mt-1 truncate text-[0.8125rem] font-extrabold tabular-nums text-deep-teal">
                  {f.value}
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2 border border-bright-cyan/40 bg-bright-cyan/10 px-3 py-2.5 sm:col-span-2">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-bright-cyan" />
              <span className="text-[0.6875rem] font-semibold text-deep-teal">
                4 key details found in 2 pages
              </span>
            </div>
          </div>
        );

      /* ------------------------------------------------------ questions */
      case 'questions':
        return (
          <div className="space-y-2.5">
            <div className="flex justify-end">
              <span className="max-w-[80%] rounded-sm bg-deep-teal px-3 py-2 text-[0.75rem] font-semibold text-white">
                What happens if I pay late?
              </span>
            </div>
            <div className="flex justify-start">
              <span className="max-w-[90%] rounded-sm border border-deep-teal/10 bg-[#FBFCFA] px-3 py-2 text-[0.75rem] leading-relaxed text-deep-teal">
                A ₹150 late fee applies from 16 July, plus 1.5% interest each month until it is
                paid.
              </span>
            </div>
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="flex items-center gap-1 rounded-sm border border-bright-cyan/40 bg-bright-cyan/10 px-2 py-1 text-[0.5rem] font-extrabold uppercase tracking-[0.14em] text-deep-teal">
                <CheckCircle2 className="h-2.5 w-2.5 text-bright-cyan" />
                Answered from your document
              </span>
              <span className="rounded-sm border border-deep-teal/10 px-2 py-1 text-[0.5rem] font-extrabold uppercase tracking-[0.14em] text-deep-teal/50">
                Not invented
              </span>
            </div>
          </div>
        );

      /* --------------------------------------------------------- voice */
      case 'voice':
        return (
          <div className="border border-deep-teal/10 bg-[#FBFBF9] p-3.5">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-deep-teal text-white">
                <Play className="h-4 w-4" fill="currentColor" />
              </span>
              <span className="flex h-8 flex-1 items-end gap-[3px]" aria-hidden="true">
                {[
                  8, 16, 11, 22, 14, 26, 18, 10, 24, 15, 28, 12, 20, 9, 25, 17, 11, 21, 13, 19, 10,
                  23, 16, 8,
                ].map((h, i) => (
                  <span
                    key={i}
                    className={`w-[3px] rounded-full ${
                      i < 9 ? 'bg-bright-cyan' : 'bg-deep-teal/15'
                    }`}
                    style={{ height: `${h}px` }}
                  />
                ))}
              </span>
              <span className="hidden shrink-0 text-[0.625rem] font-bold tabular-nums text-deep-teal/55 sm:block">
                0:42
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {['0.8×', '1.0×', '1.25×', '1.5×'].map((s, i) => (
                <span
                  key={s}
                  className={`px-2 py-1 text-[0.625rem] font-bold tabular-nums ${
                    i === 1 ? 'bg-deep-teal text-white' : 'border border-deep-teal/15 text-deep-teal/60'
                  }`}
                >
                  {s}
                </span>
              ))}
              <span className="ml-auto flex items-center gap-1.5 text-[0.5rem] font-extrabold uppercase tracking-[0.14em] text-deep-teal/50">
                <Volume2 className="h-3 w-3" />
                Play · Pause · Resume · Stop
              </span>
            </div>
          </div>
        );

      /* ------------------------------------------------------- history */
      case 'history':
        return (
          <ul className="divide-y divide-deep-teal/10 border border-deep-teal/10">
            {HISTORY_ITEMS.map((item) => (
              <li key={item.name} className="flex items-center gap-3 px-3 py-2.5">
                <FileText className="h-4 w-4 shrink-0 text-deep-teal/40" />
                <div className="min-w-0">
                  <div className="truncate text-[0.75rem] font-bold text-deep-teal">{item.name}</div>
                  <div className="text-[0.625rem] text-deep-teal/55">{item.date}</div>
                </div>
                <span className="ml-auto shrink-0 text-[0.5rem] font-extrabold uppercase tracking-[0.14em] text-bright-cyan">
                  Reopen
                </span>
              </li>
            ))}
          </ul>
        );

      /* ----------------------------------------------------- deadlines */
      case 'deadlines':
      default:
        return (
          <ul className="space-y-3">
            {DEADLINES.map((d) => (
              <li key={d.what} className="flex gap-3">
                <span className="mt-1 flex flex-col items-center">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      d.critical ? 'bg-terracotta' : 'bg-bright-cyan'
                    }`}
                  />
                  <span className="mt-1 w-px flex-1 bg-deep-teal/15" />
                </span>
                <div className="flex-1 border border-deep-teal/10 bg-[#FBFCFA] px-3 py-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[0.8125rem] font-extrabold text-deep-teal">{d.what}</span>
                    <span
                      className={`rounded-sm px-1.5 py-0.5 text-[0.5rem] font-extrabold uppercase tracking-[0.14em] ${
                        d.critical ? 'bg-terracotta text-white' : 'bg-deep-teal/10 text-deep-teal/70'
                      }`}
                    >
                      {d.level}
                    </span>
                    <span className="ml-auto text-[0.6875rem] font-bold tabular-nums text-deep-teal">
                      {d.when}
                    </span>
                  </div>
                  <div className="mt-1 flex items-start gap-1.5 text-[0.6875rem] text-deep-teal/60">
                    {d.critical ? (
                      <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-terracotta" />
                    ) : (
                      <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-bright-cyan" />
                    )}
                    <span>{d.note}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        );
    }
  })();

  return (
    <div className={className}>
      <VisualShell kind={kind}>{body}</VisualShell>
    </div>
  );
};

export default FeatureVisual;
