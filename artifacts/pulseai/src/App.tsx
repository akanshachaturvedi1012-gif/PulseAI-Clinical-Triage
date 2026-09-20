import { useMemo, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { Activity, AlertCircle, AlertTriangle, ArrowRight, Bell, Check, ChevronDown, ClipboardList, Clock3, Copy, Download, FileCheck2, FileText, FlaskConical, HeartPulse, LayoutDashboard, Menu, MessageSquareText, PanelLeftClose, Search, Settings, ShieldCheck, Stethoscope, UploadCloud, UserRound, UsersRound, X, Zap } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { analyzeLabReport, generateReferral } from '@workspace/api-client-react';
import type { LabReport as ApiLabReport } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

type Risk = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'STABLE';
type Patient = {
  id: string;
  name: string;
  age: string;
  sex: string;
  complaint: string;
  risk: Risk;
  biomarker: string;
  wait: string;
  initials: string;
  summary: string;
};

const patients: Patient[] = [
  { id: 'john-doe', name: 'John Doe', age: '45', sex: 'Male', complaint: 'Severe weakness and palpitations', risk: 'CRITICAL', biomarker: 'Potassium 6.2 mEq/L', wait: '04 min', initials: 'JD', summary: 'Marked hyperkalemia with reported palpitations. Immediate clinician review is warranted to assess cardiac risk and confirm with repeat testing.' },
  { id: 'jane-smith', name: 'Jane Smith', age: '58', sex: 'Female', complaint: 'Chest discomfort', risk: 'HIGH', biomarker: 'Troponin elevated', wait: '08 min', initials: 'JS', summary: 'Elevated troponin with chest discomfort. Findings may reflect myocardial injury and should be correlated with ECG, symptoms, and serial measurements.' },
  { id: 'alex-johnson', name: 'Alex Johnson', age: '31', sex: 'Male', complaint: 'Routine health check', risk: 'STABLE', biomarker: 'None', wait: '12 min', initials: 'AJ', summary: 'No urgent abnormality identified in the available intake data. Continue routine clinical review and preventive care workflow.' },
];

const navItems = [
  { label: 'Triage Queue', icon: LayoutDashboard },
  { label: 'Patient Records', icon: UsersRound },
  { label: 'Lab Report Analyzer', icon: FlaskConical },
  { label: 'AI Referral Drafter', icon: MessageSquareText },
  { label: 'Settings', icon: Settings },
];

function riskClasses(risk: Risk) {
  if (risk === 'CRITICAL') return 'border-red-400/25 bg-red-500/10 text-red-300';
  if (risk === 'HIGH') return 'border-orange-400/25 bg-orange-500/10 text-orange-300';
  if (risk === 'MEDIUM') return 'border-yellow-400/25 bg-yellow-500/10 text-yellow-200';
  return 'border-teal-400/25 bg-teal-500/10 text-teal-300';
}

function RiskBadge({ risk }: { risk: Risk }) {
  return <span data-testid={`badge-risk-${risk.toLowerCase()}`} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-[.12em] ${riskClasses(risk)}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{risk}</span>;
}

function Sidebar({ active, onNavigate, collapsed, onToggle }: { active: string; onNavigate: (label: string) => void; collapsed: boolean; onToggle: () => void }) {
  return (
    <aside className={`${collapsed ? 'w-[76px]' : 'w-[252px]'} fixed inset-y-0 left-0 z-30 flex flex-col border-r border-slate-700/20 bg-[#0a0e15]/95 px-3 py-5 transition-[width] duration-300 max-md:w-[76px]`} aria-label="Primary navigation">
      <div className="flex items-center gap-3 px-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/15 text-teal-300 ring-1 ring-inset ring-teal-400/25"><Activity size={21} strokeWidth={2.5} /></div>
        {!collapsed && <div className="min-w-0"><div className="font-mono text-[13px] font-bold tracking-[.2em] text-slate-100">PULSE<span className="text-teal-400">AI</span></div><div className="mt-0.5 text-[9px] font-medium uppercase tracking-[.18em] text-slate-500">Clinical workspace</div></div>}
      </div>
      <div className={`mt-9 mb-3 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-600 ${collapsed ? 'text-center' : ''}`}>{collapsed ? '•••' : 'Workspace'}</div>
      <nav className="space-y-1">
        {navItems.map(({ label, icon: Icon }) => {
          const selected = active === label;
          return <button key={label} type="button" onClick={() => onNavigate(label)} data-testid={`nav-${label.toLowerCase().replaceAll(' ', '-')}`} title={label} className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[12px] font-medium transition-colors ${selected ? 'bg-teal-500/12 text-teal-300 ring-1 ring-inset ring-teal-400/15' : 'text-slate-500 hover:bg-slate-800/60 hover:text-slate-200'}`}><Icon size={17} className={selected ? 'text-teal-300' : 'text-slate-600 group-hover:text-slate-300'} />{!collapsed && <span>{label}</span>}{selected && !collapsed && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-teal-300" />}</button>;
        })}
      </nav>
      <div className="mt-auto">
        {!collapsed && <div className="mb-4 rounded-2xl border border-teal-400/10 bg-teal-500/[.06] p-3.5"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.12em] text-teal-300"><ShieldCheck size={14} /> Demo environment</div><p className="mt-2 text-[11px] leading-relaxed text-slate-500">Synthetic data only. Clinical responsibility remains with the reviewing clinician.</p></div>}
        <button type="button" data-testid="button-collapse-sidebar" onClick={onToggle} className="flex w-full items-center justify-center rounded-xl py-2.5 text-slate-600 transition-colors hover:bg-slate-800 hover:text-slate-200" aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}>{collapsed ? <PanelLeftClose size={17} /> : <><PanelLeftClose size={17} /><span className="ml-2 text-[11px]">Collapse sidebar</span></>}</button>
      </div>
    </aside>
  );
}

function Topbar({ search, onSearch, onMenu }: { search: string; onSearch: (value: string) => void; onMenu: () => void }) {
  return <header className="sticky top-0 z-20 flex h-[74px] items-center gap-4 border-b border-slate-700/20 bg-[#0b0f17]/85 px-5 backdrop-blur-xl md:px-8">
    <button type="button" data-testid="button-mobile-menu" onClick={onMenu} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 md:hidden" aria-label="Open navigation"><Menu size={20} /></button>
    <div className="relative max-w-[430px] flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={17} /><input type="search" data-testid="input-global-search" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search patients, records, biomarkers..." className="h-10 w-full rounded-xl border border-slate-700/50 bg-slate-800/35 pl-10 pr-4 text-xs text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-teal-400/50 focus:bg-slate-800/60" /></div>
    <div className="ml-auto flex items-center gap-3">
      <div className="hidden items-center gap-2 rounded-full border border-teal-400/15 bg-teal-500/[.07] px-3 py-2 sm:flex"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-300 opacity-40" /><span className="relative inline-flex h-2 w-2 rounded-full bg-teal-400" /></span><span className="text-[10px] font-bold uppercase tracking-[.12em] text-teal-300">Triage Agent: Active</span></div>
      <button type="button" data-testid="button-notifications" className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-slate-200" aria-label="Notifications"><Bell size={18} /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-400" /></button>
      <div className="hidden h-7 w-px bg-slate-700/50 sm:block" />
      <button type="button" data-testid="button-clinician-profile" className="flex items-center gap-2 rounded-xl px-1 py-1 text-left hover:bg-slate-800/70"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-xs font-bold text-blue-300 ring-1 ring-inset ring-blue-400/20">MC</div><div className="hidden md:block"><div className="text-[11px] font-semibold text-slate-200">Dr. Maya Chen</div><div className="text-[10px] text-slate-600">Attending clinician</div></div><ChevronDown size={14} className="text-slate-600" /></button>
    </div>
  </header>;
}

function MetricCard({ label, value, detail, icon: Icon, tone }: { label: string; value: string; detail: string; icon: typeof UsersRound; tone: string }) {
  return <div className="pulseai-glass pulseai-reveal group relative overflow-hidden rounded-2xl p-4 transition-transform duration-200 hover:-translate-y-0.5 sm:p-5"><div className={`mb-5 flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}><Icon size={17} /></div><div className="font-mono text-[25px] font-bold tracking-tight text-slate-100">{value}</div><div className="mt-1 text-[11px] font-medium text-slate-400">{label}</div><div className="mt-3 text-[10px] text-slate-600">{detail}</div><div className="absolute -right-5 -top-5 h-20 w-20 rounded-full border border-white/[.03]" /></div>;
}

type UploadStatus = 'idle' | 'processing' | 'ready' | 'error';

function UploadPanel({
  onFeedback,
  selectedPatientId,
  onPatientSelect,
  title = 'Lab report analyzer',
}: {
  onFeedback: (message: string) => void;
  selectedPatientId?: string | null;
  onPatientSelect?: (patient: Patient | null) => void;
  title?: string;
}) {
  const [file, setFile] = useState<string | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.csv'];

  const processFile = (candidate: File) => {
    const extension = `.${candidate.name.split('.').pop()?.toLowerCase() ?? ''}`;
    if (!allowedExtensions.includes(extension)) {
      setFile(null);
      setStatus('error');
      setError('Choose a PDF, DOC, DOCX, TXT, or CSV medical report.');
      return;
    }
    if (candidate.size > 10 * 1024 * 1024) {
      setFile(null);
      setStatus('error');
      setError('That file is larger than the 10 MB demo limit.');
      return;
    }

    setFile(candidate.name);
    setError(null);
    setStatus('processing');
    window.setTimeout(() => {
      setStatus('ready');
      onFeedback('Demo upload received. No medical analysis was performed.');
    }, 1400);
  };

  const resetUpload = () => {
    setFile(null);
    setError(null);
    setStatus('idle');
    if (inputRef.current) inputRef.current.value = '';
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) processFile(dropped);
  };

  return <section className="pulseai-glass pulseai-reveal pulseai-reveal-delay-1 rounded-2xl p-5 sm:p-6" aria-labelledby="upload-title">
    <div className="mb-5 flex items-start justify-between gap-4"><div><div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-teal-300"><FlaskConical size={14} /> Evidence intake</div><h2 id="upload-title" className="text-base font-semibold text-slate-100">{title}</h2><p className="mt-1 text-xs text-slate-500">Add a report to prepare a demonstration workflow.</p></div><span className="rounded-full border border-slate-700/70 px-2.5 py-1 text-[10px] text-slate-500">DEMO</span></div>
    <div onDragOver={(event) => event.preventDefault()} onDrop={onDrop} className={`rounded-xl border border-dashed ${status === 'ready' ? 'border-teal-400/40 bg-teal-500/[.05]' : status === 'error' ? 'border-red-400/40 bg-red-500/[.05]' : 'border-slate-600/60 bg-slate-900/25'} px-4 py-5 text-center transition-colors`}>
      {status === 'processing' ? <><div className="mx-auto mb-3 h-9 w-9 animate-pulse rounded-xl bg-teal-400/15 p-2.5 text-teal-300"><FileText size={16} /></div><p className="text-xs font-medium text-slate-200">Preparing demo upload for {file}</p><p className="mt-1 text-[10px] text-slate-500">No medical analysis is being performed.</p><div className="mx-auto mt-4 h-1 max-w-[210px] overflow-hidden rounded-full bg-slate-700"><div className="h-full w-2/3 rounded-full bg-teal-400 transition-all" /></div></> : status === 'ready' ? <><div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-teal-400/15 text-teal-300"><FileCheck2 size={17} /></div><p className="text-xs font-medium text-slate-200">{file}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[.1em] text-teal-300">Demo Analysis ready</p><p className="mt-2 text-[10px] leading-relaxed text-slate-500">Synthetic workflow only. Real clinical analysis will be available after the AI backend is connected.</p><button type="button" data-testid="button-remove-upload" onClick={resetUpload} className="mt-3 text-[10px] text-slate-500 underline-offset-2 hover:text-slate-200 hover:underline">Remove and choose another</button></> : status === 'error' ? <><div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-red-400/10 text-red-300"><AlertCircle size={17} /></div><p className="text-xs font-medium text-red-200">Upload could not be prepared</p><p className="mt-1 text-[10px] text-red-200/70">{error}</p><button type="button" onClick={resetUpload} className="mt-3 text-[10px] text-slate-400 underline-offset-2 hover:text-slate-200 hover:underline">Try another file</button></> : <><div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-400"><UploadCloud size={17} /></div><p className="text-xs font-medium text-slate-300">Drag and drop a lab report here</p><p className="mt-1 text-[10px] text-slate-600">PDF or common medical report, max 10 MB</p><button type="button" data-testid="button-upload-lab-report" onClick={() => inputRef.current?.click()} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-500 px-3.5 py-2 text-[11px] font-bold text-slate-950 transition-colors hover:bg-teal-400"><UploadCloud size={14} />Upload Lab Report</button><input ref={inputRef} type="file" accept=".pdf,.doc,.docx,.txt,.csv" className="hidden" onChange={(event) => { const selected = event.target.files?.[0]; if (selected) processFile(selected); }} /></>}
    </div>
    <div className="mt-4 flex items-center gap-3"><div className="h-px flex-1 bg-slate-700/50" /><span className="text-[10px] uppercase tracking-[.12em] text-slate-600">or</span><div className="h-px flex-1 bg-slate-700/50" /></div>
    <label className="mt-4 block text-[10px] font-semibold uppercase tracking-[.12em] text-slate-500">Select existing patient<select data-testid="select-existing-patient" value={selectedPatientId ?? ''} onChange={(event) => onPatientSelect?.(patients.find((patient) => patient.id === event.target.value) ?? null)} className="mt-2 h-10 w-full rounded-lg border border-slate-700/60 bg-slate-900/50 px-3 text-xs font-normal text-slate-300 outline-none focus:border-teal-400/50"><option value="">Choose a patient record</option>{patients.map((patient) => <option value={patient.id} key={patient.id}>{patient.name} · {patient.id === 'john-doe' ? 'Recent labs available' : 'Intake record available'}</option>)}</select></label>
    {/* TODO: Persist uploaded report metadata in Supabase when the database workflow is connected. */}
  </section>;
}

function QueueTable({ results, onReview }: { results: Patient[]; onReview: (patient: Patient) => void }) {
  return <section className="pulseai-glass pulseai-reveal pulseai-reveal-delay-2 overflow-hidden rounded-2xl" aria-labelledby="queue-title">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/35 px-5 py-5 sm:px-6"><div><div className="flex items-center gap-2"><h2 id="queue-title" className="text-base font-semibold text-slate-100">Live triage queue</h2><span className="rounded-full bg-teal-500/10 px-2 py-0.5 font-mono text-[10px] text-teal-300">{results.length} active</span></div><p className="mt-1 text-xs text-slate-500">Prioritized by AI risk signal and waiting time.</p></div><button type="button" data-testid="button-refresh-queue" className="flex items-center gap-2 rounded-lg border border-slate-700/60 px-3 py-2 text-[11px] font-medium text-slate-400 hover:border-slate-600 hover:text-slate-200"><Activity size={14} />Live updates</button></div>
     {results.length === 0 ? <div className="px-5 py-16 text-center"><Search className="mx-auto mb-3 text-slate-600" size={24} /><p className="text-sm text-slate-300">No patients match your search</p><p className="mt-1 text-xs text-slate-600">Try a name, complaint, or biomarker.</p></div> : <div className="pulseai-scroll overflow-x-auto"><table className="w-full min-w-[820px] text-left"><thead className="bg-slate-900/35 text-[10px] uppercase tracking-[.12em] text-slate-600"><tr><th className="px-5 py-3 font-semibold sm:px-6">Patient name</th><th className="px-3 py-3 font-semibold">Age / sex</th><th className="px-3 py-3 font-semibold">Chief complaint</th><th className="px-3 py-3 font-semibold">Risk level</th><th className="px-3 py-3 font-semibold">Key flagged biomarker</th><th className="px-3 py-3 font-semibold">Wait time</th><th className="px-5 py-3 text-right font-semibold sm:px-6">Action</th></tr></thead><tbody className="divide-y divide-slate-700/25">{results.map((patient) => <tr key={patient.id} data-testid={`row-patient-${patient.id}`} tabIndex={0} role="button" aria-label={`Review patient file for ${patient.name}`} onClick={() => onReview(patient)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onReview(patient); } }} className="group cursor-pointer transition-colors hover:bg-slate-800/30 focus:bg-slate-800/40 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-teal-400/50"><td className="px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><div className={`flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-bold ${patient.risk === 'CRITICAL' ? 'bg-red-500/10 text-red-300' : 'bg-slate-800 text-slate-300'}`}>{patient.initials}</div><div><div data-testid={`text-patient-${patient.id}`} className="text-xs font-semibold text-slate-200">{patient.name}</div><div className="mt-0.5 text-[10px] text-slate-600">Synthetic case</div></div></div></td><td className="px-3 py-4 text-xs text-slate-400">{patient.age} <span className="text-slate-700">/</span> {patient.sex}</td><td className="px-3 py-4 text-xs text-slate-400">{patient.complaint}</td><td className="px-3 py-4"><RiskBadge risk={patient.risk} /></td><td className="px-3 py-4 text-xs font-medium text-slate-300">{patient.biomarker === 'None' ? <span className="text-slate-600">None flagged</span> : patient.biomarker}</td><td className="px-3 py-4"><span className={`font-mono text-xs ${patient.wait === '04 min' ? 'text-red-300' : 'text-slate-400'}`}>{patient.wait}</span></td><td className="px-5 py-4 text-right sm:px-6"><button type="button" data-testid={`button-review-${patient.id}`} onClick={(event) => { event.stopPropagation(); onReview(patient); }} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/60 px-3 py-2 text-[10px] font-bold text-slate-300 transition-colors hover:border-teal-400/40 hover:bg-teal-500/10 hover:text-teal-300">Review file <ArrowRight size={13} /></button></td></tr>)}</tbody></table></div>}
  </section>;
}

function PatientDetail({ patient, onClose, onFeedback }: { patient: Patient; onClose: () => void; onFeedback: (message: string) => void }) {
  const [mode, setMode] = useState<'clinical' | 'technical' | 'patient'>('clinical');
  const [action, setAction] = useState<string | null>(null);
  const doAction = (message: string) => { setAction(message); onFeedback(message); window.setTimeout(() => setAction(null), 3500); };
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/75 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="patient-detail-title">
    <div className="pulseai-glass pulseai-scroll max-h-[94dvh] w-full max-w-[1120px] overflow-y-auto rounded-t-3xl border-slate-600/30 sm:rounded-3xl">
      <div className="sticky top-0 z-10 flex items-start justify-between gap-5 border-b border-slate-700/35 bg-[#111a28]/95 px-5 py-5 backdrop-blur-xl sm:px-7"><div className="flex items-start gap-3"><div className={`mt-1 flex h-11 w-11 items-center justify-center rounded-xl ${patient.risk === 'CRITICAL' ? 'bg-red-500/12 text-red-300' : 'bg-blue-500/12 text-blue-300'}`}><UserRound size={20} /></div><div><div className="mb-1 flex flex-wrap items-center gap-2"><h2 id="patient-detail-title" className="text-xl font-semibold tracking-tight text-slate-100">{patient.name}</h2><span className="rounded border border-slate-700 px-2 py-0.5 font-mono text-[9px] text-slate-500">CASE-{patient.id.slice(0, 4).toUpperCase()}</span></div><p className="text-xs text-slate-500">{patient.age} years · {patient.sex} · {patient.complaint}</p></div></div><button type="button" data-testid="button-close-patient-detail" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-slate-200" aria-label="Close patient detail"><X size={19} /></button></div>
      <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[1fr_285px]">
        <div>
          <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-700/35 pb-3"><button type="button" data-testid="tab-clinical" onClick={() => setMode('clinical')} className={`border-b-2 px-3 pb-2 text-xs font-semibold ${mode === 'clinical' ? 'border-teal-400 text-teal-300' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Clinical</button><button type="button" data-testid="tab-technical" onClick={() => setMode('technical')} className={`border-b-2 px-3 pb-2 text-xs font-semibold ${mode === 'technical' ? 'border-blue-400 text-blue-300' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Technical</button><button type="button" data-testid="tab-patient-explanation" onClick={() => setMode('patient')} className={`border-b-2 px-3 pb-2 text-xs font-semibold ${mode === 'patient' ? 'border-amber-400 text-amber-300' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Patient Explanation</button></div>
          {mode === 'patient' ? <PatientExplanation patient={patient} /> : mode === 'technical' ? <TechnicalView patient={patient} /> : <ClinicalView patient={patient} />}
        </div>
        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-700/40 bg-slate-900/35 p-4"><div className="mb-3 flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[.13em] text-slate-600">Case status</span><span className="flex items-center gap-1.5 text-[10px] text-teal-300"><span className="h-1.5 w-1.5 rounded-full bg-teal-400" />Open</span></div><div className="flex items-center justify-between"><span className="text-xs text-slate-400">Risk signal</span><RiskBadge risk={patient.risk} /></div><div className="mt-3 flex items-center justify-between border-t border-slate-700/30 pt-3"><span className="text-xs text-slate-400">Queue wait</span><span className="font-mono text-xs text-slate-200">{patient.wait}</span></div></div>
          <div className="rounded-2xl border border-slate-700/40 bg-slate-900/35 p-4"><div className="mb-3 text-[10px] font-bold uppercase tracking-[.13em] text-slate-600">Clinician actions</div><button type="button" data-testid="button-generate-referral" onClick={() => doAction('Referral note drafted in demo mode. Please review before sharing.')} className="mb-2 flex w-full items-center justify-between rounded-xl bg-blue-600 px-3.5 py-3 text-left text-[11px] font-bold text-white transition-colors hover:bg-blue-500"><span className="flex items-center gap-2"><MessageSquareText size={15} />Generate Referral Note</span><ArrowRight size={14} /></button><button type="button" data-testid="button-emergency-alert" onClick={() => doAction('Emergency alert prepared. Confirm escalation through your clinical protocol.')} className="flex w-full items-center justify-between rounded-xl border border-red-400/30 bg-red-500/10 px-3.5 py-3 text-left text-[11px] font-bold text-red-300 transition-colors hover:bg-red-500/20"><span className="flex items-center gap-2"><AlertTriangle size={15} />Emergency Alert</span><Zap size={14} /></button>{action && <div className="mt-3 rounded-lg border border-teal-400/20 bg-teal-500/[.06] p-2.5 text-[10px] leading-relaxed text-teal-200" role="status"><Check size={13} className="mr-1 inline" />{action}</div>}</div>
          <div className="rounded-2xl border border-teal-400/15 bg-teal-500/[.05] p-4"><div className="flex gap-2 text-[10px] font-bold uppercase tracking-[.12em] text-teal-300"><ShieldCheck size={14} /> Clinician accountability</div><p className="mt-2 text-[11px] leading-relaxed text-slate-500">PulseAI provides decision support only. Verify evidence and use clinical judgment before acting.</p></div>
        </aside>
      </div>
    </div>
  </div>;
}

function ClinicalView({ patient }: { patient: Patient }) {
  return <div className="space-y-6"><div><SectionLabel icon={<Activity size={14} />} label="AI risk assessment" /><div className="mt-3 rounded-2xl border border-red-400/15 bg-red-500/[.06] p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-4"><div><div className="text-xs font-bold text-red-200">Priority review recommended</div><p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-400">{patient.summary}</p></div><RiskBadge risk={patient.risk} /></div><div className="mt-4 grid grid-cols-3 gap-2 border-t border-red-400/10 pt-4 text-center"><div><div className="font-mono text-sm text-red-200">{patient.risk === 'CRITICAL' ? '0.94' : '0.78'}</div><div className="mt-1 text-[9px] uppercase tracking-[.1em] text-slate-600">Risk score</div></div><div><div className="font-mono text-sm text-slate-200">2 / 3</div><div className="mt-1 text-[9px] uppercase tracking-[.1em] text-slate-600">Signals</div></div><div><div className="font-mono text-sm text-slate-200">High</div><div className="mt-1 text-[9px] uppercase tracking-[.1em] text-slate-600">Confidence</div></div></div></div></div>
  <div><SectionLabel icon={<FlaskConical size={14} />} label="Biomarker anomaly table" /><div className="mt-3 overflow-hidden rounded-xl border border-slate-700/40"><table className="w-full text-left text-xs"><thead className="bg-slate-900/50 text-[9px] uppercase tracking-[.12em] text-slate-600"><tr><th className="px-4 py-3">Biomarker</th><th className="px-4 py-3">Result</th><th className="px-4 py-3">Reference</th><th className="px-4 py-3">Signal</th></tr></thead><tbody className="divide-y divide-slate-700/30"><tr><td className="px-4 py-3 font-medium text-slate-300">{patient.biomarker === 'None' ? 'Potassium' : 'Potassium'}</td><td className="px-4 py-3 font-mono text-red-300">{patient.risk === 'CRITICAL' ? '6.2 mEq/L' : patient.risk === 'HIGH' ? '4.3 mEq/L' : '4.1 mEq/L'}</td><td className="px-4 py-3 text-slate-500">3.5–5.1</td><td className="px-4 py-3"><span className="text-[10px] font-bold uppercase tracking-[.1em] text-red-300">{patient.risk === 'STABLE' ? 'Within range' : 'Flagged high'}</span></td></tr><tr><td className="px-4 py-3 font-medium text-slate-300">Troponin I</td><td className="px-4 py-3 font-mono text-orange-300">{patient.risk === 'HIGH' ? '0.09 ng/mL' : '0.02 ng/mL'}</td><td className="px-4 py-3 text-slate-500">&lt;0.04</td><td className="px-4 py-3"><span className={`text-[10px] font-bold uppercase tracking-[.1em] ${patient.risk === 'HIGH' ? 'text-orange-300' : 'text-slate-600'}`}>{patient.risk === 'HIGH' ? 'Elevated' : 'Within range'}</span></td></tr></tbody></table></div></div>
  <div><SectionLabel icon={<ClipboardList size={14} />} label="SOAP note" /><div className="mt-3 grid gap-2 sm:grid-cols-2"><SoapBlock title="Subjective" text={`${patient.complaint}. Intake captured by triage team; symptoms require clinician correlation.`} /><SoapBlock title="Objective" text={`AI-extracted labs reviewed. Flagged result: ${patient.biomarker}. No physical examination data in this demo record.`} /><SoapBlock title="Assessment" text={`${patient.risk} priority signal based on symptom context and available biomarker evidence. This is not a diagnosis.`} /><SoapBlock title="Plan" text="Review source report, confirm findings with appropriate testing, and determine escalation using local clinical protocol." /></div></div></div>;
}

function TechnicalView({ patient }: { patient: Patient }) {
  return <div className="space-y-5"><SectionLabel icon={<Zap size={14} />} label="Technical trace" /><div className="rounded-2xl border border-blue-400/15 bg-blue-500/[.045] p-5"><div className="grid gap-4 text-xs sm:grid-cols-2"><div><div className="text-[9px] uppercase tracking-[.13em] text-slate-600">Model route</div><div className="mt-1 font-mono text-blue-200">triage-risk-v2.4</div></div><div><div className="text-[9px] uppercase tracking-[.13em] text-slate-600">Analysis completed</div><div className="mt-1 font-mono text-slate-300">Today, 09:42:18 UTC</div></div><div><div className="text-[9px] uppercase tracking-[.13em] text-slate-600">Inputs evaluated</div><div className="mt-1 font-mono text-slate-300">Symptoms · Lab values · Age · Sex</div></div><div><div className="text-[9px] uppercase tracking-[.13em] text-slate-600">Case confidence</div><div className="mt-1 font-mono text-teal-300">{patient.risk === 'CRITICAL' ? '94.1%' : '78.6%'}</div></div></div></div><div><div className="mb-3 text-[10px] font-bold uppercase tracking-[.14em] text-slate-500">Evidence contribution</div><div className="space-y-3">{[['Biomarker pattern', patient.risk === 'CRITICAL' ? '88%' : '44%', 'bg-red-400'], ['Symptom context', '61%', 'bg-blue-400'], ['Demographic context', '18%', 'bg-slate-500']].map(([label, width, color]) => <div key={label}><div className="mb-1 flex justify-between text-[10px] text-slate-400"><span>{label}</span><span className="font-mono">{width}</span></div><div className="h-1.5 rounded-full bg-slate-800"><div className={`h-full rounded-full ${color}`} style={{ width }} /></div></div>)}</div></div><div className="rounded-xl border border-amber-400/15 bg-amber-400/[.05] p-4 text-xs leading-relaxed text-amber-100/70"><AlertCircle className="mr-2 inline text-amber-300" size={14} />Technical output explains model behavior; it does not establish clinical truth or replace source evidence.</div></div>;
}

function PatientExplanation({ patient }: { patient: Patient }) {
  return <div className="space-y-5"><div className="rounded-2xl border border-amber-400/25 bg-amber-400/[.07] p-4 text-xs leading-relaxed text-amber-100/80"><AlertTriangle className="mr-2 inline text-amber-300" size={15} /><strong className="text-amber-200">AI-generated explanation.</strong> A clinician must review this information before it is shared or used for care decisions.</div><div><SectionLabel icon={<HeartPulse size={14} />} label="In plain English" /><div className="mt-3 rounded-2xl border border-slate-700/40 bg-slate-900/30 p-5"><p className="text-sm leading-7 text-slate-300">{patient.risk === 'CRITICAL' ? 'One of your blood test results, potassium, is higher than the usual range. This can sometimes affect how the heart beats. Your care team should review this result promptly and decide what to do next.' : patient.risk === 'HIGH' ? 'A blood test related to the heart is above the usual range. This result can have several causes, so your clinician will look at it alongside your symptoms and may order more tests.' : 'The information currently available does not show an urgent concern. Your clinician will still review your results and discuss any next steps with you.'}</p><p className="mt-4 border-t border-slate-700/30 pt-4 text-xs leading-relaxed text-slate-500">This summary is an aid for communication, not a diagnosis. Please ask your care team if anything is unclear.</p></div></div><div><SectionLabel icon={<MessageSquareText size={14} />} label="Suggested questions" /><ul className="mt-3 space-y-2 text-xs text-slate-400"><li className="rounded-lg border border-slate-700/35 bg-slate-900/25 px-3 py-2">What does this result mean for me?</li><li className="rounded-lg border border-slate-700/35 bg-slate-900/25 px-3 py-2">Do we need to repeat the test?</li><li className="rounded-lg border border-slate-700/35 bg-slate-900/25 px-3 py-2">What should I watch for while waiting?</li></ul></div></div>;
}

function SectionLabel({ icon, label }: { icon: ReactNode; label: string }) { return <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.15em] text-slate-500">{icon}<span>{label}</span></div>; }
function SoapBlock({ title, text }: { title: string; text: string }) { return <div className="rounded-xl border border-slate-700/35 bg-slate-900/25 p-4"><div className="mb-2 text-[10px] font-bold uppercase tracking-[.12em] text-teal-300">{title}</div><p className="text-xs leading-relaxed text-slate-400">{text}</p></div>; }

function LabAnalyzerWorkspace({
  selectedPatientId,
  onPatientSelect,
  onFeedback,
}: {
  selectedPatientId: string | null;
  onPatientSelect: (patient: Patient | null) => void;
  onFeedback: (message: string) => void;
}) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<ApiLabReport | null>(null);
  const [status, setStatus] = useState<'idle' | 'ready' | 'analyzing' | 'complete' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const johnDoe = patients[0];
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.csv'];

  const chooseFile = (candidate: File) => {
    const extension = `.${candidate.name.split('.').pop()?.toLowerCase() ?? ''}`;
    if (!allowedExtensions.includes(extension)) {
      setFileName(null);
      setSelectedFile(null);
      setAnalysis(null);
      setStatus('error');
      setError('Choose a PDF, DOC, DOCX, TXT, or CSV medical report.');
      return;
    }
    if (candidate.size > 10 * 1024 * 1024) {
      setFileName(null);
      setSelectedFile(null);
      setAnalysis(null);
      setStatus('error');
      setError('That file is larger than the 10 MB demo limit.');
      return;
    }
    setFileName(candidate.name);
    setSelectedFile(candidate);
    setAnalysis(null);
    setError(null);
    setStatus('ready');
  };

  const analyzeReport = async () => {
    if (!selectedFile) return;
    setStatus('analyzing');
    setError(null);
    try {
      const result = await analyzeLabReport({
        file: selectedFile,
        patient_id: selectedPatientId ?? johnDoe.id,
      });
      setAnalysis(result);
      setStatus('complete');
      onPatientSelect(patients.find((patient) => patient.id === result.patient_id) ?? johnDoe);
      onFeedback('Lab report analysis saved. Clinician review is required.');
    } catch (requestError) {
      setStatus('error');
      setError(requestError instanceof Error ? requestError.message : 'The analysis service could not process this report.');
    }
  };

  const resetAnalyzer = () => {
    setFileName(null);
    setSelectedFile(null);
    setAnalysis(null);
    setError(null);
    setStatus('idle');
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) chooseFile(dropped);
  };

  return <><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.17em] text-teal-300"><span className="h-px w-5 bg-teal-400" />Evidence intake</div><h1 className="text-[clamp(1.75rem,4vw,2.4rem)] font-semibold tracking-[-.035em] text-slate-100">Lab Report Analyzer</h1><p className="mt-2 text-sm text-slate-500">Upload a laboratory report for AI-assisted clinical triage.</p></div><span className="rounded-full border border-amber-400/20 bg-amber-400/[.05] px-3 py-2 text-[10px] font-bold uppercase tracking-[.13em] text-amber-200">Backend connected</span></div><div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,.65fr)]"><section className="pulseai-glass rounded-2xl p-5 sm:p-6" aria-labelledby="analyzer-upload-title"><div className="mb-5 flex items-start justify-between gap-4"><div><div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-teal-300"><FlaskConical size={14} /> Evidence intake</div><h2 id="analyzer-upload-title" className="text-base font-semibold text-slate-100">Upload a laboratory report</h2><p className="mt-1 text-xs text-slate-500">Choose a report, then run the backend analysis.</p></div><span className="rounded-full border border-slate-700/70 px-2.5 py-1 text-[10px] text-slate-500">LOCAL API</span></div><div onDragOver={(event) => event.preventDefault()} onDrop={handleDrop} className={`rounded-xl border border-dashed ${status === 'error' ? 'border-red-400/40 bg-red-500/[.05]' : status === 'complete' ? 'border-teal-400/40 bg-teal-500/[.05]' : 'border-slate-600/60 bg-slate-900/25'} px-4 py-9 text-center transition-colors`}>{status === 'analyzing' ? <><div className="mx-auto mb-3 h-9 w-9 animate-pulse rounded-xl bg-teal-400/15 p-2.5 text-teal-300"><FileText size={16} /></div><p className="text-xs font-medium text-slate-200">Analyzing report</p><p className="mt-1 text-[10px] text-slate-500">Sending the file to the protected PulseAI backend...</p><div className="mx-auto mt-4 h-1 max-w-[210px] overflow-hidden rounded-full bg-slate-700"><div className="h-full w-2/3 animate-pulse rounded-full bg-teal-400" /></div></> : status === 'error' ? <><div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-red-400/10 text-red-300"><AlertCircle size={17} /></div><p className="text-xs font-medium text-red-200">Report analysis failed</p><p className="mt-1 text-[10px] leading-relaxed text-red-200/70">{error}</p><button type="button" onClick={resetAnalyzer} className="mt-3 text-[10px] text-slate-400 underline-offset-2 hover:text-slate-200 hover:underline">Try another file</button></> : fileName ? <><div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-teal-400/15 text-teal-300"><FileCheck2 size={17} /></div><p className="text-xs font-medium text-slate-200">{fileName}</p><p className="mt-1 text-[10px] text-slate-500">{status === 'complete' ? 'Analysis saved to SQLite' : 'Report selected and ready'}</p><div className="mt-4 flex flex-wrap justify-center gap-2"><button type="button" data-testid="button-analyze-report" onClick={analyzeReport} disabled={status === 'complete'} className="inline-flex items-center gap-2 rounded-lg bg-teal-500 px-3.5 py-2 text-[11px] font-bold text-slate-950 transition-colors hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-50"><FlaskConical size={14} />{status === 'complete' ? 'Analysis Complete' : 'Analyze Report'}</button><button type="button" onClick={resetAnalyzer} className="rounded-lg border border-slate-700/60 px-3.5 py-2 text-[11px] font-medium text-slate-400 transition-colors hover:border-slate-500 hover:text-slate-200">Choose another</button></div></> : <><div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-400"><UploadCloud size={17} /></div><p className="text-xs font-medium text-slate-300">Drag and drop a lab report here</p><p className="mt-1 text-[10px] text-slate-600">PDF or common medical report, max 10 MB</p><button type="button" data-testid="button-choose-lab-report" onClick={() => inputRef.current?.click()} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-500 px-3.5 py-2 text-[11px] font-bold text-slate-950 transition-colors hover:bg-teal-400"><UploadCloud size={14} />Choose Lab Report</button><input ref={inputRef} type="file" accept=".pdf,.doc,.docx,.txt,.csv" className="hidden" onChange={(event) => { const selected = event.target.files?.[0]; if (selected) chooseFile(selected); }} /></>}</div><div className="mt-4 flex items-center gap-3"><div className="h-px flex-1 bg-slate-700/50" /><span className="text-[10px] uppercase tracking-[.12em] text-slate-600">or</span><div className="h-px flex-1 bg-slate-700/50" /></div><label className="mt-4 block text-[10px] font-semibold uppercase tracking-[.12em] text-slate-500">Select existing patient<select data-testid="select-analyzer-patient" value={selectedPatientId ?? johnDoe.id} onChange={(event) => onPatientSelect(patients.find((patient) => patient.id === event.target.value) ?? johnDoe)} className="mt-2 h-10 w-full rounded-lg border border-slate-700/60 bg-slate-900/50 px-3 text-xs font-normal text-slate-300 outline-none focus:border-teal-400/50"><option value={johnDoe.id}>John Doe · CRITICAL</option>{patients.slice(1).map((patient) => <option value={patient.id} key={patient.id}>{patient.name} · {patient.risk}</option>)}</select></label></section><div className="space-y-5"><div className="pulseai-glass rounded-2xl p-5 sm:p-6"><SectionLabel icon={<ShieldCheck size={14} />} label="Analysis status" /><h2 className="mt-3 text-base font-semibold text-slate-100">Backend workflow</h2><div className="mt-4 rounded-xl border border-amber-400/15 bg-amber-400/[.05] p-4 text-xs leading-relaxed text-amber-100/75"><AlertCircle className="mr-2 inline text-amber-300" size={14} />The uploaded file is sent to the local API. Gemini is optional; without a key, the backend returns a clearly labelled demo fallback.</div><div className="mt-5 space-y-3 text-xs text-slate-500"><div className="flex items-center gap-2"><Check size={14} className="text-teal-300" />File type and size checked locally</div><div className="flex items-center gap-2"><Check size={14} className="text-teal-300" />Analysis persisted in SQLite</div><div className="flex items-center gap-2"><X size={14} className="text-slate-600" />Gemini key stays on the backend</div></div></div>{status === 'complete' && analysis && <div className="pulseai-glass rounded-2xl p-5 sm:p-6"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><SectionLabel icon={<AlertTriangle size={14} />} label="Analysis result" /><span className="rounded-full border border-amber-400/25 bg-amber-400/[.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-amber-200">{analysis.analysis_mode}</span></div><div className="mb-4 flex items-center justify-between gap-3"><span className="text-xs text-slate-400">Risk Level</span><RiskBadge risk={analysis.risk_level} /></div><div className="overflow-hidden rounded-xl border border-slate-700/40"><div className="grid grid-cols-4 bg-slate-900/50 px-4 py-3 text-[9px] uppercase tracking-[.12em] text-slate-600"><span>Biomarker</span><span>Result</span><span>Reference</span><span>Status</span></div>{analysis.biomarkers.map((biomarker) => <div className="grid grid-cols-4 border-t border-slate-700/30 px-4 py-3 text-xs" key={`${biomarker.name}-${biomarker.value}`}><span className="font-medium text-slate-300">{biomarker.name}</span><span className="font-mono text-red-300">{biomarker.value}</span><span className="text-slate-500">{biomarker.normal_range}</span><span className="font-bold uppercase tracking-[.08em] text-red-300">{biomarker.status}</span></div>)}</div><div className="mt-4 rounded-xl border border-slate-700/35 bg-slate-900/25 p-4"><div className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-600">Summary</div><p className="mt-2 text-xs leading-relaxed text-slate-300">{analysis.overall_summary}</p></div><div className="mt-4"><div className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-600">SOAP note</div><div className="mt-2 grid gap-2 sm:grid-cols-2">{Object.entries(analysis.soap_note).map(([section, text]) => <SoapBlock key={section} title={section} text={text} />)}</div></div><div className="mt-4 rounded-xl border border-blue-400/15 bg-blue-500/[.05] p-4"><div className="text-[10px] font-bold uppercase tracking-[.12em] text-blue-200">Patient explanation</div><p className="mt-2 text-xs leading-relaxed text-slate-300">{analysis.patient_explanation}</p></div><div className="mt-4 rounded-xl border border-red-400/15 bg-red-500/[.05] p-3 text-xs text-red-200">Clinician review required.</div></div>}</div></div></>;
}

function ReferralDrafter({
  selectedPatientId,
  onPatientSelect,
  onFeedback,
}: {
  selectedPatientId: string | null;
  onPatientSelect: (patient: Patient | null) => void;
  onFeedback: (message: string) => void;
}) {
  const patient = patients.find((candidate) => candidate.id === selectedPatientId) ?? null;
  const [draft, setDraft] = useState<string | null>(null);
  const [draftMode, setDraftMode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);

  const generateDraft = async () => {
    if (!patient) return;
    setGenerating(true);
    setDraft(null);
    setDraftMode(null);
    setDraftError(null);
    try {
      const result = await generateReferral({ patient_id: patient.id });
      setDraft(result.referral_text);
      setDraftMode(result.analysis_mode);
      setGenerating(false);
      onFeedback('Referral draft saved. Review and edit before sharing.');
    } catch (requestError) {
      setGenerating(false);
      setDraftError(requestError instanceof Error ? requestError.message : 'The referral service could not create a draft.');
    }
  };

  const copyDraft = async () => {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft);
      onFeedback('Referral draft copied to the clipboard.');
    } catch {
      onFeedback('Copy is unavailable in this browser. Select the draft text manually.');
    }
  };

  const downloadDraft = () => {
    if (!draft) return;
    const blob = new Blob([draft], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${patient?.id ?? 'pulseai'}-demo-referral.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    onFeedback('Demo referral downloaded as a text file.');
  };

  return <><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.17em] text-blue-300"><span className="h-px w-5 bg-blue-400" />Clinical communication</div><h1 className="text-[clamp(1.75rem,4vw,2.4rem)] font-semibold tracking-[-.035em] text-slate-100">AI Referral Drafter</h1><p className="mt-2 text-sm text-slate-500">Generate a structured referral draft from triage information.</p></div><span className="rounded-full border border-blue-400/20 bg-blue-500/[.06] px-3 py-2 text-[10px] font-bold uppercase tracking-[.13em] text-blue-200">Backend connected</span></div><div className="pulseai-glass rounded-2xl p-5 sm:p-6"><label className="block text-[10px] font-semibold uppercase tracking-[.12em] text-slate-500">Select patient<select data-testid="select-referral-patient" value={selectedPatientId ?? ''} onChange={(event) => { setDraft(null); setDraftMode(null); setDraftError(null); onPatientSelect(patients.find((candidate) => candidate.id === event.target.value) ?? null); }} className="mt-2 h-10 w-full max-w-xl rounded-lg border border-slate-700/60 bg-slate-900/50 px-3 text-xs font-normal text-slate-300 outline-none focus:border-blue-400/50"><option value="">Choose a patient record</option>{patients.map((candidate) => <option value={candidate.id} key={candidate.id}>{candidate.name} · {candidate.risk}</option>)}</select></label></div>{patient ? <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,.72fr)_minmax(0,1fr)]"><div className="space-y-5"><div className="pulseai-glass rounded-2xl p-5 sm:p-6"><div className="mb-4 flex items-start justify-between gap-3"><div><SectionLabel icon={<UserRound size={14} />} label="Patient information" /><h2 className="mt-2 text-lg font-semibold text-slate-100">{patient.name}</h2></div><RiskBadge risk={patient.risk} /></div><div className="grid grid-cols-2 gap-3 text-xs"><div className="rounded-xl border border-slate-700/35 bg-slate-900/25 p-3"><div className="text-[9px] uppercase tracking-[.12em] text-slate-600">Age</div><div className="mt-1 text-slate-300">{patient.age}</div></div><div className="rounded-xl border border-slate-700/35 bg-slate-900/25 p-3"><div className="text-[9px] uppercase tracking-[.12em] text-slate-600">Sex</div><div className="mt-1 text-slate-300">{patient.sex}</div></div></div><div className="mt-3 rounded-xl border border-slate-700/35 bg-slate-900/25 p-3"><div className="text-[9px] uppercase tracking-[.12em] text-slate-600">Chief complaint</div><div className="mt-1 text-xs text-slate-300">{patient.complaint}</div></div><div className="mt-3 rounded-xl border border-slate-700/35 bg-slate-900/25 p-3"><div className="text-[9px] uppercase tracking-[.12em] text-slate-600">Key clinical finding</div><div className="mt-1 text-xs text-slate-300">{patient.biomarker}</div></div></div><div className="pulseai-glass rounded-2xl p-5 sm:p-6"><SectionLabel icon={<ClipboardList size={14} />} label="Clinical summary" /><p className="mt-3 text-sm leading-7 text-slate-300">{patient.summary}</p><p className="mt-4 border-t border-slate-700/30 pt-4 text-[11px] leading-relaxed text-slate-500">Summary is synthetic demo content and requires clinician review.</p></div></div><div className="pulseai-glass rounded-2xl p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><SectionLabel icon={<MessageSquareText size={14} />} label="Referral draft" /><h2 className="mt-2 text-lg font-semibold text-slate-100">Draft a referral note</h2></div><button type="button" data-testid="button-generate-referral-draft" onClick={generateDraft} disabled={generating} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2.5 text-[11px] font-bold text-white transition-colors hover:bg-blue-500 disabled:cursor-wait disabled:opacity-60">{generating ? <><Activity size={14} className="animate-pulse" />Generating referral...</> : <><MessageSquareText size={14} />Generate Referral Note</>}</button></div>{generating ? <div className="mt-8 rounded-xl border border-blue-400/15 bg-blue-500/[.05] p-5 text-center"><div className="mx-auto mb-3 h-8 w-8 animate-pulse rounded-lg bg-blue-400/15 p-2 text-blue-300"><FileText size={16} /></div><p className="text-xs text-slate-300">Preparing a structured referral draft</p><p className="mt-1 text-[10px] text-slate-500">Calling the protected PulseAI backend...</p></div> : draftError ? <div className="mt-5 rounded-xl border border-red-400/25 bg-red-500/[.06] p-5"><div className="flex items-center gap-2 text-xs font-semibold text-red-200"><AlertCircle size={15} />Referral generation failed</div><p className="mt-2 text-[11px] leading-relaxed text-red-200/70">{draftError}</p></div> : draft ? <div className="mt-5"><div className="mb-2 flex flex-wrap items-center justify-between gap-3"><span className="rounded-full border border-amber-400/25 bg-amber-400/[.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-amber-200">AI-ASSISTED DRAFT — CLINICIAN REVIEW REQUIRED</span><span className="text-[10px] text-slate-600">{draftMode ?? 'Backend generated'}</span></div><textarea data-testid="textarea-referral-draft" value={draft} readOnly className="min-h-[330px] w-full resize-y rounded-xl border border-slate-700/50 bg-slate-950/35 p-4 font-mono text-xs leading-relaxed text-slate-300 outline-none" /><div className="mt-3 flex flex-wrap gap-2"><button type="button" data-testid="button-copy-referral" onClick={copyDraft} className="inline-flex items-center gap-2 rounded-lg border border-slate-700/60 px-3 py-2 text-[11px] font-semibold text-slate-300 transition-colors hover:border-teal-400/40 hover:bg-teal-500/10 hover:text-teal-200"><Copy size={14} />Copy Referral Note</button><button type="button" data-testid="button-download-referral" onClick={downloadDraft} className="inline-flex items-center gap-2 rounded-lg border border-slate-700/60 px-3 py-2 text-[11px] font-semibold text-slate-300 transition-colors hover:border-blue-400/40 hover:bg-blue-500/10 hover:text-blue-200"><Download size={14} />Download Referral</button></div></div> : <div className="mt-5 flex min-h-[330px] items-center justify-center rounded-xl border border-dashed border-slate-700/50 bg-slate-900/25 p-6 text-center"><div><FileText className="mx-auto mb-3 text-slate-600" size={25} /><p className="text-sm text-slate-300">No draft generated yet</p><p className="mt-1 text-xs leading-relaxed text-slate-600">Generate a backend referral note to review the selected patient data.</p></div></div>}</div></div> : <div className="pulseai-glass mt-5 flex min-h-[360px] items-center justify-center rounded-2xl p-8 text-center"><div className="max-w-md"><UsersRound className="mx-auto mb-4 text-slate-600" size={28} /><h2 className="text-lg font-semibold text-slate-100">Choose a demo patient</h2><p className="mt-2 text-sm leading-relaxed text-slate-500">Select John Doe, Jane Smith, or Alex Johnson above to populate the referral workspace.</p></div></div>}</>;
}

function Workspace({ active, search, selectedPatientId, onPatientSelect, onReview, onFeedback }: { active: string; search: string; selectedPatientId: string | null; onPatientSelect: (patient: Patient | null) => void; onReview: (patient: Patient) => void; onFeedback: (message: string) => void }) {
  const filtered = useMemo(() => patients.filter((patient) => `${patient.name} ${patient.complaint} ${patient.biomarker} ${patient.risk}`.toLowerCase().includes(search.toLowerCase())), [search]);
  if (active === 'Lab Report Analyzer') return <LabAnalyzerWorkspace selectedPatientId={selectedPatientId} onPatientSelect={onPatientSelect} onFeedback={onFeedback} />;
  if (active === 'AI Referral Drafter') return <ReferralDrafter selectedPatientId={selectedPatientId} onPatientSelect={onPatientSelect} onFeedback={onFeedback} />;
  if (active !== 'Triage Queue') {
    const moduleIcons = { 'Patient Records': UsersRound, 'Lab Report Analyzer': FlaskConical, 'AI Referral Drafter': MessageSquareText, Settings };
    const ActiveIcon = moduleIcons[active as keyof typeof moduleIcons] ?? Settings;
    return <div className="pulseai-glass pulseai-reveal flex min-h-[510px] items-center justify-center rounded-2xl p-8 text-center"><div className="max-w-md"><div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-300"><ActiveIcon size={24} /></div><h2 className="text-xl font-semibold text-slate-100">{active}</h2><p className="mt-2 text-sm leading-relaxed text-slate-500">This workspace is ready for the next demo workflow. Navigate back to the Triage Queue to review synthetic patient cases.</p><span className="mt-5 inline-flex rounded-full border border-teal-400/20 bg-teal-500/[.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.13em] text-teal-300">Demo module</span></div></div>;
  }
  return <><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.17em] text-teal-300"><span className="h-px w-5 bg-teal-400" />Operations overview</div><h1 className="text-[clamp(1.75rem,4vw,2.4rem)] font-semibold tracking-[-.035em] text-slate-100">Clinical Triage Dashboard</h1><p className="mt-2 text-sm text-slate-500">AI-assisted clinical decision support <span className="text-slate-700">—</span> clinician review required.</p></div><div className="flex items-center gap-2 rounded-lg border border-slate-700/40 bg-slate-900/30 px-3 py-2 text-[10px] text-slate-500"><Clock3 size={13} className="text-teal-400" />Last sync <span className="font-mono text-slate-300">09:42:18</span></div></div><div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4"><MetricCard label="Patients in Queue" value="03" detail="2 require review now" icon={UsersRound} tone="bg-blue-500/12 text-blue-300" /><MetricCard label="High Risk / Critical" value="02" detail="Prioritized automatically" icon={AlertTriangle} tone="bg-red-500/12 text-red-300" /><MetricCard label="Average Triage Time" value="08m" detail="12% faster this shift" icon={Clock3} tone="bg-teal-500/12 text-teal-300" /><MetricCard label="Reports Processed" value="147" detail="Today · demo workspace" icon={FileCheck2} tone="bg-amber-400/12 text-amber-300" /></div><div className="mb-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,.72fr)]"><UploadPanel selectedPatientId={selectedPatientId} onPatientSelect={onPatientSelect} onFeedback={onFeedback} /><div className="pulseai-glass pulseai-grid pulseai-reveal pulseai-reveal-delay-1 rounded-2xl p-5 sm:p-6"><div className="flex items-center justify-between"><div><div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-blue-300"><Zap size={14} />Attention signals</div><h2 className="text-base font-semibold text-slate-100">Queue pulse</h2></div><span className="font-mono text-[10px] text-slate-600">LIVE</span></div><div className="mt-7 flex items-end gap-1.5"><div className="h-10 flex-1 rounded-t bg-blue-400/25" /><div className="h-14 flex-1 rounded-t bg-blue-400/30" /><div className="h-8 flex-1 rounded-t bg-teal-400/40" /><div className="h-20 flex-1 rounded-t bg-red-400/65" /><div className="h-11 flex-1 rounded-t bg-orange-400/45" /><div className="h-16 flex-1 rounded-t bg-red-400/45" /><div className="h-24 flex-1 rounded-t bg-red-400/70" /><div className="h-12 flex-1 rounded-t bg-teal-400/35" /><div className="h-7 flex-1 rounded-t bg-blue-400/25" /></div><div className="mt-2 flex justify-between text-[9px] uppercase tracking-[.1em] text-slate-600"><span>07:00</span><span>Now</span></div><div className="mt-5 flex items-start gap-2 border-t border-slate-700/35 pt-4 text-[11px] leading-relaxed text-slate-500"><AlertCircle size={14} className="mt-0.5 shrink-0 text-red-300" />Two cases have new risk signals since the last review checkpoint.</div></div></div><QueueTable results={filtered} onReview={onReview} /></>;
}

function Home() {
  const [active, setActive] = useState('Triage Queue');
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Patient | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const handlePatientSelect = (patient: Patient | null) => setSelectedPatientId(patient?.id ?? null);
  const handleReview = (patient: Patient) => {
    setSelectedPatientId(patient.id);
    setSelected(patient);
  };
  return <div className="pulseai-shell min-h-[100dvh] text-slate-100"><Sidebar active={active} onNavigate={setActive} collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} /><div className={`transition-[padding] duration-300 ${collapsed ? 'pl-[76px]' : 'pl-[76px] md:pl-[252px]'}`}><Topbar search={search} onSearch={setSearch} onMenu={() => setCollapsed((value) => !value)} /><main className="pulseai-scroll mx-auto max-w-[1600px] p-5 md:p-8"><Workspace active={active} search={search} selectedPatientId={selectedPatientId} onPatientSelect={handlePatientSelect} onReview={handleReview} onFeedback={setFeedback} /><footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-700/25 py-5 text-[10px] leading-relaxed text-slate-600"><span className="flex items-center gap-2"><ShieldCheck size={13} className="text-teal-400/70" />PulseAI demonstration system · Synthetic data only</span><span>AI outputs require clinician review and do not diagnose, treat, or replace a doctor.</span></footer></main></div>{selected && <PatientDetail patient={selected} onClose={() => setSelected(null)} onFeedback={setFeedback} />}{feedback && <div className="fixed bottom-5 right-5 z-[60] flex max-w-[340px] items-start gap-3 rounded-xl border border-teal-400/25 bg-[#14242b] px-4 py-3 text-xs text-teal-100 shadow-2xl" role="status"><Check size={15} className="mt-0.5 shrink-0 text-teal-300" />{feedback}<button type="button" data-testid="button-dismiss-feedback" onClick={() => setFeedback(null)} className="ml-2 text-teal-300/60 hover:text-teal-200" aria-label="Dismiss message"><X size={14} /></button></div>}</div>;
}

function Router() {
  return <ErrorBoundary resetKey={useLocation()[0]}><Switch><Route path="/" component={Home} /><Route component={Home} /></Switch></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;
