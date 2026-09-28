import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { GlobalSearch } from './components/GlobalSearch';
import { DashboardPage } from './pages/DashboardPage';
import { CSEListPage } from './pages/CSEListPage';
import { CSEDetailPage } from './pages/CSEDetailPage';
import { FindingsListPage } from './pages/FindingsListPage';
import { FindingDetailPage } from './pages/FindingDetailPage';
import { CasesListPage } from './pages/CasesListPage';
import { CaseDetailPage } from './pages/CaseDetailPage';
import { NegativeSpacePage } from './pages/NegativeSpacePage';
import { KPIContradictionsPage } from './pages/KPIContradictionsPage';
import { KPIContradictionDetailPage } from './pages/KPIContradictionDetailPage';
import { BenchmarkingPage } from './pages/BenchmarkingPage';
import { TrendsPage } from './pages/TrendsPage';
import { IngestionPage } from './pages/IngestionPage';
import { ReportsPage } from './pages/ReportsPage';
import { AnalyticsExplainabilityPage } from './pages/AnalyticsExplainabilityPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { api } from './api';

import { ThemeProvider } from './context/ThemeContext';

export function App() {
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    return window.location.pathname || '/dashboard';
  });

  const [currentUser, setCurrentUser] = useState<any>(() => {
    const saved = localStorage.getItem('soclens_user') || localStorage.getItem('sat_sa_user');
    return saved ? JSON.parse(saved) : {
      username: 'supervisor',
      name: 'NCIIPC Senior Supervisor',
      role: 'SUPERVISOR',
      email: 'teamaether111@gmail.com'
    };
  });

  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync route with browser history
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname || '/dashboard');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (route: string) => {
    window.history.pushState({}, '', route);
    setCurrentRoute(route);
    window.scrollTo(0, 0);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load Dashboard Stats
  const loadDashboardStats = async () => {
    try {
      const stats = await api.getDashboardStats();
      setDashboardStats(stats);
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    }
  };

  useEffect(() => {
    loadDashboardStats();
  }, [currentRoute]);

  // Demo Data Generator Action (Step 2 in Demo Flow)
  const handleGenerateDemoData = async () => {
    setIsProcessing(true);
    try {
      const res = await api.generateDemoData();
      showToast(`Synthetic dataset generated: 20 CSEs, ${res.counts.assets} assets, ${res.counts.alerts} alerts, ${res.counts.cases} cases, and planted contradictions.`);
      await loadDashboardStats();
    } catch (err: any) {
      alert(`Demo generation failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Run Supervisory Assessment Action (Step 4 in Demo Flow)
  const handleRunAssessment = async () => {
    setIsProcessing(true);
    try {
      const res = await api.runAssessment();
      showToast(`Assessment complete: ${res.result.totalFindings} findings, ${res.result.kpiContradictionsCount} KPI contradictions, ${res.result.negativeSpaceGapsCount} negative-space gaps.`);
      await loadDashboardStats();
    } catch (err: any) {
      alert(`Assessment execution failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Login Handling
  if (currentRoute === '/login') {
    return (
      <LoginPage
        onLoginSuccess={(user, token) => {
          setCurrentUser(user);
          navigate('/dashboard');
        }}
      />
    );
  }

  // Routing Logic
  const renderCurrentPage = () => {
    // 1. Dashboard
    if (currentRoute === '/' || currentRoute === '/dashboard') {
      return (
        <DashboardPage
          stats={dashboardStats}
          onNavigate={navigate}
          onRefresh={loadDashboardStats}
        />
      );
    }

    // 2. CSE routes: /cse/:id or /cse
    if (currentRoute.startsWith('/cse/')) {
      const id = currentRoute.replace('/cse/', '');
      return <CSEDetailPage cseId={id} onNavigate={navigate} />;
    }
    if (currentRoute === '/cse') {
      return <CSEListPage onNavigate={navigate} />;
    }

    // 3. Findings routes: /findings/:id or /findings
    if (currentRoute.startsWith('/findings/')) {
      const id = currentRoute.replace('/findings/', '');
      return <FindingDetailPage findingId={id} onNavigate={navigate} onFindingReviewed={loadDashboardStats} />;
    }
    if (currentRoute.startsWith('/findings')) {
      const url = new URL(window.location.href);
      const cseFilter = url.searchParams.get('cseId') || undefined;
      return <FindingsListPage onNavigate={navigate} initialCseFilter={cseFilter} />;
    }

    // 4. Cases routes: /cases/:id or /cases
    if (currentRoute.startsWith('/cases/')) {
      const id = currentRoute.replace('/cases/', '');
      return <CaseDetailPage caseId={id} onNavigate={navigate} />;
    }
    if (currentRoute.startsWith('/cases')) {
      return <CasesListPage onNavigate={navigate} />;
    }

    // 5. Negative Space: /negative-space
    if (currentRoute === '/negative-space') {
      return <NegativeSpacePage onNavigate={navigate} />;
    }

    // 6. KPI-Evidence Contradictions: /kpi-evidence/:id or /kpi-evidence
    if (currentRoute.startsWith('/kpi-evidence/')) {
      const id = currentRoute.replace('/kpi-evidence/', '');
      return <KPIContradictionDetailPage contradictionId={id} onNavigate={navigate} onReviewed={loadDashboardStats} />;
    }
    if (currentRoute === '/kpi-evidence') {
      return <KPIContradictionsPage onNavigate={navigate} />;
    }

    // 7. Peer Benchmarking: /benchmarking
    if (currentRoute === '/benchmarking') {
      return <BenchmarkingPage onNavigate={navigate} />;
    }

    // 8. Trends: /trends
    if (currentRoute === '/trends') {
      return <TrendsPage onNavigate={navigate} />;
    }

    // 9. Ingestion: /ingestion
    if (currentRoute === '/ingestion') {
      return (
        <IngestionPage
          onNavigate={navigate}
          onDataIngested={loadDashboardStats}
          onGenerateDemo={handleGenerateDemoData}
        />
      );
    }

    // 10. Reports: /reports
    if (currentRoute === '/reports') {
      return <ReportsPage />;
    }

    // 11. Analytics Explainability: /analytics
    if (currentRoute === '/analytics') {
      return <AnalyticsExplainabilityPage />;
    }

    // 12. Audit Log: /audit
    if (currentRoute === '/audit') {
      return <AuditLogPage />;
    }

    // 13. Settings: /settings
    if (currentRoute === '/settings') {
      return <SettingsPage />;
    }

    // Fallback to Dashboard
    return (
      <DashboardPage
        stats={dashboardStats}
        onNavigate={navigate}
        onRefresh={loadDashboardStats}
      />
    );
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 transition-colors">
        {/* Top Navbar */}
        <Navbar
          onOpenSearch={() => setIsSearchOpen(true)}
          onRunAssessment={handleRunAssessment}
          isProcessing={isProcessing}
          currentUser={currentUser}
          lastAnalyzed={dashboardStats?.lastAnalyzed}
        />

        {/* Main Body with Sidebar & Content */}
        <div className="flex flex-1">
          <Sidebar
            currentRoute={currentRoute}
            onNavigate={navigate}
            stats={{
              highAttentionCses: dashboardStats?.csesRequiringAttention || 4,
              contradictions: dashboardStats?.kpiEvidenceContradictions || 3,
              reviewCases: dashboardStats?.casesRecommendedForReview || 12
            }}
          />

          <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
            {renderCurrentPage()}
          </main>
        </div>

        {/* Global Search Modal (Ctrl+K) */}
        <GlobalSearch
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onNavigate={navigate}
        />

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-cyan-500/60 text-slate-100 px-4 py-3 rounded-lg shadow-2xl font-mono text-xs max-w-md flex items-center gap-3 animate-in slide-in-from-bottom-5">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
