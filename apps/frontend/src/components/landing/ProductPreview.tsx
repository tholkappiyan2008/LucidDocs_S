import React from 'react';
import {
  CalendarDays,
  FileText,
  Gauge,
  Hash,
  ListChecks,
  Pause,
  Play,
  SkipForward,
} from 'lucide-react';

/* ----------------------------------------------------------------------------
   Product showcase preview.

   A static, non-interactive depiction of the real ClearDoc analysis screen:
   document preview → plain-language explanation → important facts → key dates
   → reference number → required action → read-aloud controls.

   Nothing here is a working control (no <button>, no <a>) so it can never be
   mistaken for, or used as, a live session. All data is illustrative sample
   data.
   ---------------------------------------------------------------------------- */

const Label: React.FC<{ icon?: React.ReactNode; children: React.ReactNode }> = ({
  icon,
  children,
}) => (
  <div className="mb-2 flex items-center gap-2 text-[0.625rem] font-extrabold uppercase tracking-[0.2em] text-deep-teal/60">
    {icon}
    <span>{children}</span>
  </div>
);

const FACTS = [
  { label: 'Amount due', value: '₹2,740' },
  { label: 'Units consumed', value: '342 units' },
  { label: 'Late fee if delayed', value: '₹150 + 1.5%/month' },
];

const DATES = [
  { what: 'Payment due date', when: '15 Jul 2026' },
  { what: 'Late fee starts', when: '16 Jul 2026' },
];

const ACTIONS = [
  'Pay ₹2,740 before 15 Jul 2026 to avoid a late fee.',
  'Check the meter reading of 342 units against your meter.',
  'Raise a complaint within 10 days if the reading looks wrong.',
];

export const ProductPreview: React.FC<{ className?: string }> = ({ className = '' }) => (
  <figure className={`w-full ${className}`}>
    <div
      className="overflow-hidden rounded-sm border border-deep-teal/15 bg-white shadow-[0_30px_60px_-32px_rgba(0,49,53,0.45)]"
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-3 border-b border-deep-teal/10 bg-surface px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        </span>
        <span className="mx-auto truncate rounded-sm border border-deep-teal/10 bg-white px-3 py-1 text-[0.6875rem] font-semibold text-deep-teal/70">
          cleardoc.app / documents / electricity-bill-june
        </span>
        <span className="hidden shrink-0 rounded-sm border border-deep-teal/15 bg-white px-2 py-1 text-[0.5625rem] font-extrabold uppercase tracking-[0.16em] text-deep-teal/60 sm:inline">
          Preview
        </span>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        {/* ---------------- Document preview ---------------- */}
        <div className="border-b border-deep-teal/10 bg-[#FBFBF9] p-4 sm:p-5 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-2 pb-3">
            <FileText className="h-4 w-4 text-bright-cyan" aria-hidden="true" />
            <span className="truncate text-[0.75rem] font-bold text-deep-teal">
              electricity_bill_june.pdf
            </span>
            <span className="ml-auto shrink-0 text-[0.625rem] font-semibold text-deep-teal/50">
              Page 1 of 2
            </span>
          </div>

          {/* Rendered page */}
          <div className="border border-deep-teal/10 bg-white p-3.5 shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-deep-teal/10 pb-2.5">
              <div>
                <div className="text-[0.75rem] font-extrabold leading-tight text-deep-teal">
                  Northgate Electricity Board
                </div>
                <div className="text-[0.5625rem] font-bold uppercase tracking-[0.16em] text-deep-teal/50">
                  Electricity Bill · June 2026
                </div>
              </div>
              <span className="shrink-0 rounded-sm border border-deep-teal/15 px-1.5 py-0.5 text-[0.5rem] font-extrabold uppercase tracking-[0.12em] text-deep-teal/50">
                Original
              </span>
            </div>

            <dl className="grid grid-cols-2 gap-y-2 pt-2.5 text-[0.625rem]">
              <dt className="text-deep-teal/50">Account no.</dt>
              <dd className="text-right font-bold tabular-nums text-deep-teal">EB-2026-004821</dd>
              <dt className="text-deep-teal/50">Billing period</dt>
              <dd className="text-right font-semibold text-deep-teal">01–30 Jun 2026</dd>
              <dt className="text-deep-teal/50">Units consumed</dt>
              <dd className="text-right font-semibold tabular-nums text-deep-teal">342</dd>
              <dt className="text-deep-teal/50">Total payable</dt>
              <dd className="text-right font-extrabold tabular-nums text-deep-teal">₹2,740</dd>
            </dl>

            {/* Dense fine print — what makes documents hard to read */}
            <div className="mt-3 space-y-1.5 border-t border-deep-teal/10 pt-2.5" aria-hidden="true">
              {[100, 92, 96, 78, 88, 64].map((w, i) => (
                <span
                  key={i}
                  className="block h-1 rounded-full bg-deep-teal/10"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
          </div>

          <p className="mt-3 text-[0.6875rem] leading-relaxed text-deep-teal/55">
            ClearDoc reads the document in memory — the original file is never written to disk.
          </p>
        </div>

        {/* ---------------- Analysis ---------------- */}
        <div className="divide-y divide-deep-teal/10 p-4 sm:p-5">
          {/* Summary */}
          <div className="pb-4">
            <Label icon={<FileText className="h-3.5 w-3.5 text-bright-cyan" aria-hidden="true" />}>
              Plain-language summary
            </Label>
            <p className="text-[0.875rem] leading-[1.65] text-deep-teal">
              This is your monthly electricity bill. You used{' '}
              <strong className="font-extrabold">342 units</strong>. The total to pay is{' '}
              <strong className="font-extrabold">₹2,740</strong> by{' '}
              <strong className="font-extrabold">15 July 2026</strong>. After that date a late fee
              of ₹150 plus 1.5% interest per month is added.
            </p>
          </div>

          {/* Facts + dates */}
          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <div>
              <Label icon={<ListChecks className="h-3.5 w-3.5 text-bright-cyan" aria-hidden="true" />}>
                Important facts &amp; amounts
              </Label>
              <ul className="space-y-1.5">
                {FACTS.map((f) => (
                  <li
                    key={f.label}
                    className="flex items-baseline justify-between gap-2 border border-deep-teal/10 bg-[#FBFCFA] px-2.5 py-1.5"
                  >
                    <span className="text-[0.625rem] font-semibold uppercase tracking-wide text-deep-teal/55">
                      {f.label}
                    </span>
                    <span className="text-[0.75rem] font-extrabold tabular-nums text-deep-teal">
                      {f.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <Label icon={<CalendarDays className="h-3.5 w-3.5 text-bright-cyan" aria-hidden="true" />}>
                Key dates
              </Label>
              <ul className="space-y-1.5">
                {DATES.map((d) => (
                  <li
                    key={d.what}
                    className="border border-deep-teal/10 bg-[#FBFCFA] px-2.5 py-1.5"
                  >
                    <div className="text-[0.625rem] text-deep-teal/55">{d.what}</div>
                    <div className="text-[0.75rem] font-extrabold tabular-nums text-deep-teal">
                      {d.when}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Reference + required action */}
          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <div>
              <Label icon={<Hash className="h-3.5 w-3.5 text-bright-cyan" aria-hidden="true" />}>
                Reference number
              </Label>
              <div className="border border-deep-teal/10 bg-[#FBFCFA] px-3 py-2">
                <div className="text-base font-extrabold tabular-nums tracking-tight text-deep-teal">
                  EB-2026-004821
                </div>
                <div className="text-[0.625rem] text-deep-teal/55">
                  Quoted on every payment receipt
                </div>
              </div>
            </div>

            <div>
              <Label
                icon={<Gauge className="h-3.5 w-3.5 text-terracotta" aria-hidden="true" />}
              >
                Required action
              </Label>
              <div className="border border-terracotta/30 bg-terracotta/10 px-3 py-2">
                <div className="text-[0.8125rem] font-bold leading-snug text-deep-teal">
                  Pay ₹2,740 by 15 Jul 2026
                </div>
                <div className="mt-0.5 text-[0.625rem] text-deep-teal/60">
                  Deadline identified from the document
                </div>
              </div>
            </div>
          </div>

          {/* Next steps */}
          <div className="py-4">
            <Label icon={<ListChecks className="h-3.5 w-3.5 text-bright-cyan" aria-hidden="true" />}>
              Recommended next steps
            </Label>
            <ul className="space-y-1.5">
              {ACTIONS.map((a) => (
                <li key={a} className="flex items-start gap-2 text-[0.8125rem] leading-snug text-deep-teal">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-bright-cyan" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Read-aloud controls (static depiction) */}
          <div className="flex flex-wrap items-center gap-3 pt-4">
            <div className="flex items-center gap-2 border border-deep-teal/15 bg-surface px-3 py-2">
              <span className="grid h-6 w-6 place-items-center rounded-sm bg-deep-teal text-white" aria-hidden="true">
                <Play className="h-3 w-3" fill="currentColor" />
              </span>
              <span className="grid h-6 w-6 place-items-center rounded-sm border border-deep-teal/15 text-deep-teal/70" aria-hidden="true">
                <Pause className="h-3 w-3" />
              </span>
              <span className="grid h-6 w-6 place-items-center rounded-sm border border-deep-teal/15 text-deep-teal/70" aria-hidden="true">
                <SkipForward className="h-3 w-3" />
              </span>
              <span className="ml-1 flex h-4 items-end gap-[2px]" aria-hidden="true">
                {[6, 12, 9, 14, 7, 11, 5, 10, 13, 8].map((h, i) => (
                  <span
                    key={i}
                    className="w-[2px] rounded-full bg-bright-cyan/70"
                    style={{ height: `${h}px` }}
                  />
                ))}
              </span>
            </div>

            <div className="flex items-center gap-1.5" aria-hidden="true">
              {['0.8×', '1.0×', '1.25×', '1.5×'].map((s, i) => (
                <span
                  key={s}
                  className={`px-2 py-1 text-[0.625rem] font-bold tabular-nums ${
                    i === 1
                      ? 'bg-deep-teal text-white'
                      : 'border border-deep-teal/15 text-deep-teal/60'
                  }`}
                >
                  {s}
                </span>
              ))}
              <span className="ml-1 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-deep-teal/50">
                Read-aloud speed
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <figcaption className="mt-3 text-center text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-deep-teal/50">
      Static preview · illustrative sample data · not a live session
    </figcaption>
  </figure>
);

export default ProductPreview;
