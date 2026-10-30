import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CalendarDays, Hash, Volume2, Zap } from 'lucide-react';

/* ----------------------------------------------------------------------------
   "From Document to Understanding"

   A custom editorial composition for the hero: a sample electricity bill is
   connected to the plain-language explanation ClearDoc produces.

   Every value shown is illustrative sample data — no real personal
   information, no implied live processing. The whole composition is exposed to
   assistive technology as a single labelled image.
   ---------------------------------------------------------------------------- */

const ILLUSTRATION_LABEL =
  'Illustration of the ClearDoc journey: a sample electricity bill is turned into a plain-language ' +
  'explanation showing a short summary, the amount due, the due date, a reference number and the ' +
  'required action. All information shown is illustrative sample data.';

const FactRow: React.FC<{ label: string; value: string; accent?: boolean }> = ({
  label,
  value,
  accent,
}) => (
  <div className="flex items-baseline justify-between gap-3 border-b border-deep-teal/10 py-1.5 last:border-0">
    <span className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-deep-teal/55">
      {label}
    </span>
    <span
      className={`text-[0.8125rem] font-extrabold tabular-nums ${
        accent ? 'text-terracotta' : 'text-deep-teal'
      }`}
    >
      {value}
    </span>
  </div>
);

export const HeroIllustration: React.FC<{ className?: string }> = ({ className = '' }) => {
  const reduce = useReducedMotion();

  const float = (delay: number) =>
    reduce
      ? {}
      : {
          animate: { y: [0, -7, 0] },
          transition: { duration: 8, repeat: Infinity, ease: 'easeInOut' as const, delay },
        };

  return (
    <div className={`relative mx-auto w-full max-w-[34rem] ${className}`}>
      {/* Stage — deep teal canvas that gives the floating panels their depth */}
      <div
        className="relative overflow-hidden rounded-sm border border-deep-teal/20 bg-deep-teal p-4 shadow-[0_30px_60px_-30px_rgba(0,49,53,0.55)] sm:p-6"
        style={{
          backgroundImage: [
            'radial-gradient(600px 320px at 85% -5%, rgba(15,164,175,0.28), transparent 65%)',
            'radial-gradient(500px 320px at -10% 105%, rgba(150,71,52,0.24), transparent 60%)',
            'linear-gradient(rgba(175,221,229,0.055) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(175,221,229,0.055) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: 'auto, auto, 32px 32px, 32px 32px',
        }}
        role="img"
        aria-label={ILLUSTRATION_LABEL}
      >
        {/* Stage caption */}
        <div className="relative mb-4 flex flex-wrap items-center justify-between gap-2 sm:mb-5">
          <span className="text-[0.625rem] font-extrabold uppercase tracking-[0.24em] text-light-cyan">
            From Document to Understanding
          </span>
          <span className="rounded-sm border border-white/15 bg-white/10 px-2 py-0.5 text-[0.5625rem] font-bold uppercase tracking-[0.16em] text-white/75">
            Illustrative sample
          </span>
        </div>

        <div className="relative" aria-hidden="true">
          {/* ---------------- A. Original document preview ---------------- */}
          <motion.div
            {...float(0)}
            className="w-full rounded-sm border border-white/20 bg-white p-3.5 shadow-[0_22px_44px_-22px_rgba(0,0,0,0.7)] sm:p-4"
          >
            {/* Letterhead */}
            <div className="flex items-start gap-3 border-b border-deep-teal/10 pb-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-deep-teal text-light-cyan">
                <Zap className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <div className="truncate text-[0.8125rem] font-extrabold leading-tight text-deep-teal">
                  Northgate Electricity Board
                </div>
                <div className="text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-deep-teal/55">
                  Electricity Bill · June 2026
                </div>
              </div>
              <span className="ml-auto hidden shrink-0 rounded-sm border border-deep-teal/15 bg-surface px-1.5 py-0.5 text-[0.5625rem] font-bold uppercase tracking-[0.14em] text-deep-teal/60 sm:inline">
                PDF
              </span>
            </div>

            {/* Structured bill fields */}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 pt-3 sm:grid-cols-3">
              <div className="col-span-2 sm:col-span-3">
                <dt className="text-[0.5625rem] font-bold uppercase tracking-[0.16em] text-deep-teal/45">
                  Service address
                </dt>
                <dd className="truncate text-[0.8125rem] font-semibold text-deep-teal">
                  12 Example Street, Sample Town
                </dd>
              </div>
              <div>
                <dt className="text-[0.5625rem] font-bold uppercase tracking-[0.16em] text-deep-teal/45">
                  Reference no.
                </dt>
                <dd className="text-[0.8125rem] font-extrabold tabular-nums text-deep-teal">
                  EB-2026-004821
                </dd>
              </div>
              <div>
                <dt className="text-[0.5625rem] font-bold uppercase tracking-[0.16em] text-deep-teal/45">
                  Billing period
                </dt>
                <dd className="text-[0.8125rem] font-semibold text-deep-teal">01–30 Jun 2026</dd>
              </div>
              <div>
                <dt className="text-[0.5625rem] font-bold uppercase tracking-[0.16em] text-deep-teal/45">
                  Units used
                </dt>
                <dd className="text-[0.8125rem] font-semibold text-deep-teal">342 units</dd>
              </div>
            </dl>

            {/* Totals strip */}
            <div className="mt-3 flex items-end justify-between gap-3 rounded-sm border border-deep-teal/10 bg-surface px-3 py-2.5">
              <div>
                <div className="text-[0.5625rem] font-bold uppercase tracking-[0.16em] text-deep-teal/50">
                  Amount due
                </div>
                <div className="text-lg font-extrabold leading-tight tabular-nums text-deep-teal">
                  ₹2,740
                </div>
              </div>
              <div className="text-right">
                <div className="text-[0.5625rem] font-bold uppercase tracking-[0.16em] text-deep-teal/50">
                  Due date
                </div>
                <div className="text-sm font-extrabold text-terracotta">15 Jul 2026</div>
              </div>
            </div>
          </motion.div>

          {/* ---------------- B. Connection to the explanation ---------------- */}
          <div className="relative flex items-center justify-center gap-3 py-3 sm:py-3.5">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-bright-cyan/60" />
            <span className="flex items-center gap-2 rounded-sm border border-bright-cyan/40 bg-deep-teal px-2.5 py-1 text-[0.5625rem] font-extrabold uppercase tracking-[0.18em] text-light-cyan">
              <motion.span
                aria-hidden="true"
                className="block h-1.5 w-1.5 rounded-full bg-bright-cyan"
                animate={reduce ? undefined : { opacity: [0.35, 1, 0.35] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              />
              Plain-language explanation
            </span>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-bright-cyan/60" />
          </div>

          {/* ---------------- C. Simplified information preview ---------------- */}
          <motion.div
            {...float(1.6)}
            className="w-full rounded-sm border border-white/20 bg-white shadow-[0_22px_44px_-22px_rgba(0,0,0,0.7)]"
          >
            <div className="flex items-center gap-2 border-b border-deep-teal/10 bg-deep-teal px-3.5 py-2.5">
              <span className="grid h-5 w-5 place-items-center rounded-sm bg-bright-cyan text-[0.5rem] font-extrabold text-deep-teal">
                CD
              </span>
              <span className="text-[0.625rem] font-extrabold uppercase tracking-[0.18em] text-white">
                In simple words
              </span>
              <span className="ml-auto flex items-center gap-1 rounded-sm border border-white/15 bg-white/10 px-1.5 py-0.5 text-[0.5rem] font-bold uppercase tracking-[0.12em] text-white/70">
                <Volume2 className="h-2.5 w-2.5" aria-hidden="true" />
                Read aloud
              </span>
            </div>

            <div className="p-3.5 sm:p-4">
              <p className="text-[0.8125rem] leading-[1.6] text-deep-teal">
                This is your electricity bill for June. You used{' '}
                <strong className="font-extrabold">342 units</strong>. Pay{' '}
                <strong className="font-extrabold">₹2,740</strong> before{' '}
                <strong className="font-extrabold">15 July 2026</strong> to avoid a late fee.
              </p>

              <div className="mt-3 border-t border-deep-teal/10 pt-1">
                <FactRow label="Amount due" value="₹2,740" />
                <FactRow label="Due date" value="15 Jul 2026" accent />
                <FactRow label="Reference no." value="EB-2026-004821" />
              </div>

              <div className="mt-3 flex items-start gap-2 rounded-sm border border-terracotta/25 bg-terracotta/10 px-3 py-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta" />
                <div>
                  <div className="text-[0.5625rem] font-extrabold uppercase tracking-[0.16em] text-terracotta">
                    Required action
                  </div>
                  <div className="mt-0.5 text-[0.8125rem] font-semibold leading-snug text-deep-teal">
                    Pay ₹2,740 by 15 Jul 2026
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stage footer */}
        <div className="relative mt-4 flex items-center gap-2 border-t border-white/10 pt-3 text-[0.5625rem] font-bold uppercase tracking-[0.18em] text-white/55">
          <CalendarDays className="h-3 w-3 text-bright-cyan" aria-hidden="true" />
          <span>Bill → summary → facts → deadline → next step</span>
          <Hash className="ml-auto h-3 w-3 text-bright-cyan" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
};

export default HeroIllustration;
