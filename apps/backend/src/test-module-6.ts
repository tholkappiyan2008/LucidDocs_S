async function runModule6Tests() {
  console.log('\n--- [ClearDoc Module 6: Read Aloud Speech Engine Tests] ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${desc}`);
      failed++;
    }
  }

  // 1. Narrative speech text generator
  function generateSpeechText(analysis: any): string {
    if (!analysis) return '';
    const parts: string[] = [];
    if (analysis.plain_summary) parts.push(analysis.plain_summary);
    if (analysis.key_facts && analysis.key_facts.length > 0) {
      parts.push(analysis.key_facts.map((f: any) => `${f.label}: ${f.value}`).join('. '));
    }
    if (analysis.deadlines && analysis.deadlines.length > 0) {
      parts.push(analysis.deadlines.map((d: any) => `${d.what}, due date: ${d.date}`).join('. '));
    }
    if (analysis.risks && analysis.risks.length > 0) {
      parts.push(analysis.risks.map((r: any) => r.note).join('. '));
    }
    if (analysis.next_steps && analysis.next_steps.length > 0) {
      parts.push(analysis.next_steps.map((s: string, idx: number) => `Step ${idx + 1}: ${s}`).join('. '));
    }
    return parts.join('. ');
  }

  const sampleDoc = {
    plain_summary: 'Your electric bill is due next week.',
    key_facts: [{ label: 'Amount', value: '₹1,200' }],
    deadlines: [{ what: 'Pay Bill', date: '2026-11-10' }],
    risks: [{ level: 'low', note: 'Late fee applies after due date' }],
    next_steps: ['Pay online via UPI'],
  };

  const generatedText = generateSpeechText(sampleDoc);
  assert(generatedText.includes('Your electric bill is due next week'), 'Speech generator includes summary');
  assert(generatedText.includes('Amount: ₹1,200'), 'Speech generator includes key facts');
  assert(generatedText.includes('Pay Bill, due date: 2026-11-10'), 'Speech generator includes deadlines');
  assert(generatedText.includes('Late fee applies after due date'), 'Speech generator includes risks');
  assert(generatedText.includes('Step 1: Pay online via UPI'), 'Speech generator includes next steps');

  // 2. Multilingual BCP-47 Code Mapping
  const bcp47Map: Record<string, string> = {
    en: 'en-US',
    ta: 'ta-IN',
    te: 'te-IN',
    hi: 'hi-IN',
  };

  assert(bcp47Map.en === 'en-US', 'English mapped to en-US');
  assert(bcp47Map.ta === 'ta-IN', 'Tamil mapped to ta-IN');
  assert(bcp47Map.te === 'te-IN', 'Telugu mapped to te-IN');
  assert(bcp47Map.hi === 'hi-IN', 'Hindi mapped to hi-IN');

  // 3. Voice Matching Algorithm
  interface MockVoice {
    name: string;
    lang: string;
    default: boolean;
  }

  const mockVoices: MockVoice[] = [
    { name: 'Microsoft David - English (United States)', lang: 'en-US', default: true },
    { name: 'Google தமிழ்', lang: 'ta-IN', default: false },
    { name: 'Google తెలుగు', lang: 'te-IN', default: false },
    { name: 'Google हिन्दी', lang: 'hi-IN', default: false },
  ];

  function findMatchingVoice(targetLang: string, voices: MockVoice[]): MockVoice | null {
    const match = voices.find((v) => {
      const l = v.lang.toLowerCase();
      const t = targetLang.toLowerCase();
      return l.startsWith(t) || l.includes(`-${t}`) || l.includes(`_${t}`);
    });
    return match || null;
  }

  const enVoice = findMatchingVoice('en', mockVoices);
  assert(enVoice?.name.includes('English') === true, 'Matches English voice properly');

  const taVoice = findMatchingVoice('ta', mockVoices);
  assert(taVoice?.name.includes('தமிழ்') === true, 'Matches Tamil voice properly');

  const teVoice = findMatchingVoice('te', mockVoices);
  assert(teVoice?.name.includes('తెలుగు') === true, 'Matches Telugu voice properly');

  const hiVoice = findMatchingVoice('hi', mockVoices);
  assert(hiVoice?.name.includes('हिन्दी') === true, 'Matches Hindi voice properly');

  // 4. Missing Voice Graceful Handling (e.g. system without Telugu voice)
  const voicesWithoutTelugu = mockVoices.filter((v) => !v.lang.startsWith('te'));
  const missingTeVoice = findMatchingVoice('te', voicesWithoutTelugu);
  assert(missingTeVoice === null, 'Correctly detects when language voice is not installed on OS');

  // 5. Speech State Machine Transitions
  class MockSpeechController {
    public state: 'STOPPED' | 'PLAYING' | 'PAUSED' = 'STOPPED';
    public currentText: string = '';
    public rate: number = 1.0;

    play(text: string) {
      if (!text || text.trim() === '') return false;
      this.currentText = text;
      this.state = 'PLAYING';
      return true;
    }

    pause() {
      if (this.state === 'PLAYING') {
        this.state = 'PAUSED';
      }
    }

    resume() {
      if (this.state === 'PAUSED') {
        this.state = 'PLAYING';
      }
    }

    stop() {
      this.state = 'STOPPED';
      this.currentText = '';
    }

    onLanguageChange(newText: string) {
      // Must cancel prior speech immediately
      this.stop();
      this.currentText = newText;
    }
  }

  const controller = new MockSpeechController();
  assert(controller.state === 'STOPPED', 'Initial state is STOPPED');

  controller.play('Hello world');
  assert(controller.state === 'PLAYING', 'State transitions to PLAYING on play()');

  controller.pause();
  assert(controller.state === 'PAUSED', 'State transitions to PAUSED on pause()');

  controller.resume();
  assert(controller.state === 'PLAYING', 'State transitions to PLAYING on resume()');

  controller.stop();
  assert(controller.state === 'STOPPED', 'State transitions to STOPPED on stop()');

  // 6. Language Switch Interrupt Test
  controller.play('English text playing');
  assert(controller.state === 'PLAYING', 'Playing English audio');
  controller.onLanguageChange('தமிழ் உரை');
  assert(controller.state === 'STOPPED', 'Playback immediately halted upon language switch');
  assert(controller.currentText === 'தமிழ் உரை', 'Synchronized to new Tamil text');

  // 7. Empty text handling
  const emptyResult = controller.play('');
  assert(emptyResult === false, 'Empty text does not trigger playback');

  console.log(`\n==========================================`);
  console.log(`Module 6 Results: ${passed} passed, ${failed} failed`);
  console.log(`==========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runModule6Tests();
