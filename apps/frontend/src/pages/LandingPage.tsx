import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Reveal } from '../components/Reveal';
import { HeroIllustration } from '../components/landing/HeroIllustration';
import { ProductPreview } from '../components/landing/ProductPreview';
import { FeatureVisual } from '../components/landing/FeatureVisual';
// scrollToTarget used on landing page CTAs pointing to in-page sections;
import { ArrowRight, CheckCircle2 } from 'lucide-react';

/* ----------------------------------------------------------------------------
   ClearDoc Landing Page — premium editorial composition.

   Sections (in on-page order, matching the Navbar scroll targets):
   0. Hero — "Documents shouldn't be difficult" + "From Document to
         Understanding" illustration.
   1. How It Works — 01 Upload / 02 Understand / 03 Take Control.
   2. Product showcase (id="preview") — static preview of the real UI.
   3. Capabilities — alternating editorial rows, only verified V1 features.
   4. Accessibility story — "Technology Should Be Accessible to Everyone".
   5. Final CTA.
   ---------------------------------------------------------------------------- */

const Eyebrow = ({ label }: { label: string }) => (
  <span
    className="inline-flex items-center gap-2 rounded-sm border border-bright-cyan/20 bg-bright-cyan/8 px-3 py-1 text-[0.6875rem] font-extrabold uppercase tracking-[0.18em] text-bright-cyan"
    aria-label={label}
  >
    <span className="h-1 w-1 rounded-full bg-bright-cyan shrink-0" />
    <span>{label}</span>
  </span>
);

const STEPS = [
  {
    n: '01',
    title: 'Upload',
    body: 'Upload a PDF or a photo of your electricity bill, hospital discharge summary, legal notice or tax form.',
    tone: 'cyan' as const,
  },
  {
    n: '02',
    title: 'Understand',
    body: 'AI explains the important information in plain English, in the language you choose.',
    tone: 'light' as const,
  },
  {
    n: '03',
    title: 'Take control',
    body: 'See what matters, when it is due and what to do next — and ask follow-up questions grounded in the document.',
    tone: 'cyan' as const,
  },
];

const CAPABILITIES = [
  {
    kind: 'explain' as const,
    title: 'Plain document explanations',
    body: 'Upload a clear scan, phone photo or multi-page PDF. ClearDoc reads it in memory and explains it in plain language — in the language you choose.',
  },
  {
    kind: 'facts' as const,
    title: 'Important information at a glance',
    body: 'Amounts, dates, reference numbers and sender details appear in a short summary card, so you can scan the essentials without reading every line of dense fine print.',
  },
  {
    kind: 'questions' as const,
    title: 'Document-grounded follow-up questions',
    body: "Ask things like \"What is the due date?\" or \"How much do I owe?\". Answers come only from your own document — if the answer isn’t there, ClearDoc says so instead of guessing.",
  },
  {
    kind: 'voice' as const,
    title: 'Read-aloud accessibility',
    body: 'Have summaries, facts and deadlines read aloud using browser speech synthesis — with play, pause, resume, stop and speed control.',
  },
  {
    kind: 'history' as const,
    title: 'Document history',
    body: 'Every analysed document stays in your workspace. Reopen it any time to reread the summary, check dates or ask a new question.',
  },
  {
    kind: 'deadlines' as const,
    title: 'Deadline & action identification',
    body: 'Due dates, late fees and penalties are highlighted so you know what is urgent — and what the next step is.',
  },
];

const ACCESSIBILITY_POINTS = [
  {
    label: 'Plain simple explanations',
    detail: 'Dense legal and medical wording is rewritten into plain, human language.',
  },
  {
    label: 'Read-aloud functionality',
    detail: 'Browser-powered voice narration in your chosen language, with speed control.',
  },
  {
    label: 'High-contrast accessibility mode',
    detail: 'A dedicated high-contrast view for better visibility when you need it.',
  },
  {
    label: 'Adjustable text size',
    detail: 'A large-text mode that scales the interface so people with low vision can read comfortably.',
  },
  {
    label: 'Document-grounded answers',
    detail: 'Follow-up questions are answered only from the document, without hallucination.',
  },
];

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const primaryHref = user ? '/dashboard' : '/register';
  const primaryLabel = user ? 'Go to Workspace' : 'Understand Your Document';
  const primaryCta = user ? '/upload' : '/register';
  const ctaLabel = user ? 'Upload a Document' : 'Start Understanding';

  return (
    <div className="min-h-screen bg-surface text-deep-teal">
      {/* ===========================================================
          A. HERO — "Documents shouldn't be difficult."
          Two-column: copy left, "From Document to Understanding"
          illustration right.
          =========================================================== */}
      <section className="relative overflow-hidden bg-surface">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(1200px 600px at 92% -8%, rgba(15,164,175,0.16), transparent 60%), radial-gradient(800px 520px at -10% 110%, rgba(150,71,52,0.10), transparent 60%)',
          }}
        />

        <div className="relative mx-auto max-w-6xl px-5 sm:px-8 lg:px-10 pt-12 sm:pt-16 lg:pt-24 pb-14 sm:pb-18 lg:pb-24">
          <div className="mx-auto grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)] lg:gap-14 xl:gap-20">
            {/* ---------- Copy ---------- */}
            <Reveal delay={0.04}>
              <div className="min-w-0">
                <Eyebrow label="AI for Accessibility & Digital Inclusion" />

                <h1 className="mt-6 text-balance text-[2.5rem] leading-[1.05] tracking-tight sm:text-4xl lg:text-[3.625rem] xl:text-[4.0625rem] xl:leading-[0.98] xl:tracking-[-0.02em]">
                  Documents
                  <span className="block text-terracotta">shouldn’t be difficult.</span>
                </h1>

                <p className="mt-5 max-w-lg text-[1.0625rem] leading-[1.62] text-deep-teal/70 sm:text-[1.125rem] sm:leading-[1.65]">
                  Understand bills, medical reports, legal notices and important documents with AI-powered
                  explanations in{' '}
                  <span className="not-italic font-semibold text-deep-teal">plain, simple English</span>.
                </p>

                {/* CTAs */}
                <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
                  <Link
                    to={primaryHref}
                    className="btn-primary flex items-center justify-center gap-2 rounded-sm px-8 py-[13px] text-base font-extrabold shadow-md transition-all hover:shadow-lg sm:justify-start"
                  >
                    <span className="leading-snug">{primaryLabel}</span>
                    <ArrowRight className="h-5 w-5 text-white/80 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </Link>
                  <a
                    href="#how-it-works"
                    className="btn-outline flex items-center justify-center gap-2 rounded-sm px-7 py-[13px] text-base font-semibold tracking-wide"
                  >
                    <span>Explore ClearDoc</span>
                    <ArrowRight className="h-4 w-4 text-deep-teal/70" aria-hidden="true" />
                  </a>
                </div>

                {/* Trust strip */}
                <div className="mt-11 rounded-sm border border-deep-teal/10 bg-white/90 p-4 shadow-sm sm:p-5">
                  <ul className="flex flex-wrap gap-x-8 gap-y-3">
                    {[
                      'Plain 5th-grade language',
                      'Read aloud in your browser',
                      'Follow-up questions from your document',
                      'Processed in memory — never written to disk',
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2.5 text-[15px] font-medium text-deep-teal">
                        <CheckCircle2 className="h-[18px] w-[18px] shrink-0 text-bright-cyan" aria-hidden="true" />
                        <span className="truncate text-[0.8125rem]">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>

            {/* ---------- Visual ---------- */}
            <Reveal delay={0.14}>
              <div className="lg:order-1 sm:min-w-0">
                <HeroIllustration />
              </div>
            </Reveal>
          </div>
        </div>

        {/* fade */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-surface to-transparent" aria-hidden="true" />
      </section>

      {/* ===========================================================
          B. HOW IT WORKS — deep teal, three editorial numerals
          =========================================================== */}
      <section
        id="how-it-works"
        className="relative overflow-hidden"
        style={{ background: '#024950' }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{ background: 'radial-gradient(900px 500px at 50% 0%, rgba(15,164,175,0.14), transparent 60%)' }}
        />

        <div className="relative mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
          {/* section heading */}
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <Eyebrow label="Simple 3-step process" />
              <h2 className="mx-auto mt-4 max-w-xl text-center text-balance text-[2.5rem] leading-snug text-white font-extrabold sm:text-4xl lg:text-[3.625rem] xl:text-[4rem]">
                From confusing paperwork
                <span className="block text-bright-cyan">to clear understanding.</span>
              </h2>
            </div>
          </Reveal>

          {/* steps */}
          <ol className="mx-auto mt-16 grid gap-6 sm:gap-8 sm:grid-cols-3" aria-label="How ClearDoc works">
            {STEPS.map((step) => (
              <Reveal key={step.n} className="group">
                <li className="overflow-hidden rounded-sm bg-white/5 p-6 pb-8 shadow-sm sm:p-7" style={{ borderColor: 'rgba(255,255,255,0.10)', borderImage: 'none' }}>
                  {step.tone === 'cyan' ? (
                    <span className="text-5xl sm:text-6xl lg:text-6xl -mt-3 leading-none font-extrabold tracking-tight text-bright-cyan">
                      {step.n}
                    </span>
                  ) : (
                    <span className="text-5xl sm:text-6xl lg:text-6xl -mt-3 leading-none font-extrabold tracking-tight text-white/70">
                      {step.n}
                    </span>
                  )}
                  <div className="mt-3 text-left sm:mt-2">
                    <h3 className="text-xl font-bold text-white sm:text-2xl">{step.title}</h3>
                    <p className="mt-3 text-[0.9375rem] leading-[1.6] text-white/72">{step.body}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#024950] to-transparent" aria-hidden="true" />
      </section>

      {/* ===========================================================
          C. PRODUCT SHOWCASE — id="preview" (matches Navbar/Footer)
          =========================================================== */}
      <section id="preview" className="relative overflow-hidden bg-white py-14 sm:py-20 lg:py-24">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{ background: 'radial-gradient(900px 460px at 50% -10%, rgba(15,164,175,0.06), transparent 60%)' }}
        />

        <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10 pb-14 sm:pb-20 lg:pb-24">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <Eyebrow label="See exactly what you get" />
              <h2 className="mt-5 text-balance text-[2.75rem] leading-tight text-extrabold tracking-tight sm:text-4xl lg:text-[3.5rem] xl:text-[3.875rem]">
                Your document, translated into action.
              </h2>
              <p className="mt-4 max-w-xl text-center text-[1.0625rem] leading-[1.6] text-deep-teal/70">
                Upload once. Get a plain-language summary, important facts, key dates, a reference
                number, what to do next — and a read-aloud.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="mt-14 flex justify-center">
              <ProductPreview className="w-full max-w-[40rem]" />
            </div>
          </Reveal>
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" aria-hidden="true" />
      </section>

      {/* ===========================================================
          D. CAPABILITIES — alternating editorial rows, V1 scope only
          =========================================================== */}
      <section id="features" className="relative overflow-hidden bg-surface py-14 sm:py-20 lg:py-24">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{ background: 'radial-gradient(900px 460px at 50% 0%, rgba(15,164,175,0.10), transparent 65%)' }}
        />

        <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <Eyebrow label="Capabilities · V1" />
              <h2 className="mt-5 text-balance text-[2.625rem] leading-tight text-extrabold tracking-tight sm:text-4xl lg:text-[3.375rem] xl:text-[3.75rem]">
                Built for everyone,
                <span className="block text-terracotta">regardless of literacy or vision.</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-center text-[1.0625rem] leading-[1.6] text-deep-teal/70">
                Six capabilities that turn everyday paperwork into clear, actionable understanding.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 grid gap-0 divide-y divide-deep-teal/10 border-y border-deep-teal/10 sm:divide-y-0 sm:border-y-0 sm:gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
            {CAPABILITIES.map(({ kind, title, body }, idx) => {
              const first = idx % 2 === 0;
              return (
                <Reveal key={title}>
                  <div
                    className={
                      (first
                        ? `flex-row items-start gap-6 sm:gap-10`
                        : `flex-row-reverse items-start gap-6 sm:gap-10`)
                    }
                  >
                    <div
                      className={
                        first ? `shrink-0 order-1` : `shrink-0 order-2`
                      }
                    >
                      <FeatureVisual kind={kind} className="min-w-full sm:min-w-0" />
                    </div>
                    <div
                      className={
                        first ? `grow pt-14 sm:pt-0` : `grow pt-14 sm:pt-0`
                      }
                    >
                      <h3 className="text-lg font-extrabold text-deep-teal tracking-tight" id={`cap-${title.replace(/\s+/g, '')}${idx}`}>
                        {title}
                      </h3>
                      <p className="mt-2 text-[0.9375rem] leading-[1.62] text-deep-teal/70">{body}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-surface to-transparent" aria-hidden="true" />
      </section>

      {/* ===========================================================
          E. ACCESSIBILITY STORY
          "Technology Should Be Accessible to Everyone."
          =========================================================== */}
      <section className="relative overflow-hidden bg-white py-16 sm:py-20 lg:py-24">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(900px 460px at 14% -10%, rgba(15,164,175,0.10), transparent 60%), radial-gradient(800px 500px at 100% 100%, rgba(150,71,52,0.10), transparent 60%)',
          }}
        />

        <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
          <div className="mx-auto grid gap-10 items-start max-w-4xl lg:grid-cols-2 lg:gap-16 xl:gap-20">
            {/* Copy */}
            <Reveal>
              <div className="min-w-0">
                <Eyebrow label="Accessibility first" />
                <h2 className="mt-4 text-balance text-[2.25rem] leading-snug text-extrabold tracking-tight sm:text-3xl lg:text-[3.25rem] xl:text-[3.5rem]">
                  Technology should be
                  <span className="block text-bright-cyan">accessible to everyone.</span>
                </h2>
                <p className="mt-5 max-w-sm text-[1.0625rem] leading-[1.65] text-deep-teal/70">
                  ClearDoc exists for the people paperwork usually leaves behind: elderly citizens,
                  low-literacy readers, people with low vision and neurodiverse users who find dense
                  documents overwhelming. We build for understanding, not for features.
                </p>

                <ul className="mt-8 grid gap-5">
                  {ACCESSIBILITY_POINTS.map((item, idx) => (
                    <li
                      key={item.label}
                      className="flex items-start gap-4 overflow-hidden rounded-sm border border-white/10 bg-white/90 p-4 transition-colors hover:bg-white shadow-sm"
                    >
                      <span className="mt-0.5 h-5 w-5 shrink-0 rounded-sm bg-bright-cyan flex items-center justify-center text-[10px] font-extrabold text-deep-teal">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <div className="font-semibold text-deep-teal">{item.label}</div>
                        <div className="mt-0.5 text-sm text-deep-teal/68">{item.detail}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            {/* Visual: "Same sentence, two readings" + extracted facts panel */}
            <Reveal delay={0.12}>
              <div className="max-w-[20rem]">
                {/* Before / After */}
                <div className="overflow-hidden rounded-sm border border-deep-teal/12 bg-deep-teal p-5 shadow-[0_24px_48px_-20px_rgba(0,49,53,0.45)] sm:p-6" style={{ background: '#003135' }}>
                  <div className="text-center text-[0.625rem] font-extrabold uppercase tracking-[0.2em] text-light-cyan">
                    Same sentence, two readings
                  </div>

                  {/* before */}
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <div className="text-[0.5625rem] font-extrabold uppercase tracking-[0.18em] text-white/45">In the document</div>
                    <p className="mt-2 text-[0.75rem] leading-relaxed text-white/55 italic">
                      “Notice is hereby given that the account holder shall remit the outstanding
                      principal together with applicable interest on or before the aforementioned date,
                      failing which the facility shall stand terminated.”
                    </p>
                  </div>

                  <div className="mt-4 flex items-center gap-3 text-[0.625rem] text-light-cyan">
                    <span className="flex h-5 flex-1 items-center gap-1">
                      <span className="h-1.5 w-10 rounded-full bg-deep-teal/10" />
                      <span className="rounded-sm bg-deep-teal/15 px-2 text-[0.5625rem] font-bold uppercase tracking-[0.14em] text-light-cyan">clear explanation → action</span>
                      <span className="h-1.5 flex-1 rounded-full bg-deep-teal/10" />
                    </span>
                  </div>

                  {/* after */}
                  <div className="mt-3 rounded-sm border border-bright-cyan/40 bg-bright-cyan/10 p-4">
                    <div className="text-[0.5625rem] font-extrabold uppercase tracking-[0.18em] text-deep-teal">
                      In ClearDoc
                    </div>
                    <p className="mt-2 text-[0.9375rem] font-semibold leading-snug text-deep-teal">
                      Pay the amount you owe, by 15 July 2026. If you don’t, the service stops
                      and a late fee applies.
                    </p>
                  </div>

                  {/* accessibility controls chips */}
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4">
                    {[
                      { label: 'High contrast', badge: '+' },
                      { label: 'Large text (118%)', badge: '-' },
                      { label: 'Read aloud', badge: '•' },
                      { label: 'Keyboard ready', badge: '•' },
                    ].map((c) => (
                      <span key={c.label} className="rounded-sm border border-white/10 bg-white/10 px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.06em] text-white/75">
                        {c.label}
                        <span className="ml-1 opacity-50">{c.badge === '+' ? '✓' : ''}{c.badge === '-' ? '' : c.badge}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* extracted-facts mini panel */}
                <div className="mt-5 rounded-sm border border-deep-teal/12 bg-deep-teal/5 p-4 shadow-sm">
                  <div className="mb-3 text-[0.625rem] font-extrabold uppercase tracking-[0.18em] text-deep-teal/60">
                    Fine print, identified at a glance
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { label: 'Amount due', value: '₹2,740' },
                      { label: 'Due date', value: '15 Jul 2026' },
                      { label: 'Reference no.', value: 'EB-2026-004821' },
                    ].map((row) => (
                      <div key={row.label} className="flex items-baseline justify-between gap-3 border-b border-white/10 pb-1.5 last:border-0 last:pb-0">
                        <span className="text-[0.625rem] font-bold uppercase tracking-[0.12em] text-white/45">{row.label}</span>
                        <span className="text-[0.8125rem] font-extrabold text-light-cyan">{row.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-sm bg-deep-teal/15 px-3 py-2 text-[0.625rem] font-bold uppercase tracking-[0.14em] text-bright-cyan">
                    Required action: Pay before 15 Jul 2026
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" aria-hidden="true" />
      </section>

      {/* ===========================================================
          F. FINAL CTA — deep teal, restrained cyan accents
          =========================================================== */}
      <section
        className="relative overflow-hidden px-5 py-20 sm:py-24 lg:py-28"
        style={{ background: 'linear-gradient(180deg, #003135 0%, #024950 100%)' }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(900px 600px at 50% -5%, rgba(15,164,175,0.20), transparent 60%), radial-gradient(800px 500px at 90% 100%, rgba(150,71,52,0.14), transparent 60%)',
          }}
        />

        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <div className="text-white/60 text-[0.6875rem] font-extrabold uppercase tracking-[0.2em]">
              Make every document easier to understand
            </div>
            <h2 className="mt-3 max-w-2xl text-center text-balance text-[2.625rem] leading-snug text-white font-extrabold tracking-tight sm:text-4xl lg:text-[3.5rem] xl:text-4xl">
              Make Every Document
              <span className="block text-bright-cyan">Easier to Understand.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-white/70 text-[1.0625rem]">
              Turn complicated paperwork into clear understanding.
              <br className="sm:hidden" />
              Free to start; your documents stay in memory and are never written to disk.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:justify-center">
              <Link
                to={primaryCta}
                className="btn-cyan flex items-center justify-center gap-2 rounded-sm px-9 py-[13px] text-base font-extrabold shadow-md hover:shadow-lg"
              >
                <span>{ctaLabel}</span>
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
              {user ? (
                <Link
                  to="/history"
                  className="btn-ghost flex items-center justify-center gap-2 rounded-sm px-7 py-[13px] text-base font-semibold"
                >
                  <span>Your documents</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="btn-ghost flex items-center justify-center gap-2 rounded-sm px-7 py-[13px] text-base font-semibold"
                >
                  Log in
                </Link>
              )}
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
};
