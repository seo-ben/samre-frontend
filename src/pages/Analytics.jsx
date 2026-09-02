import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import apiClient from '../lib/apiClient';
import {
  TrendingUp, Users, Briefcase, CalendarDays, Award, ArrowUpRight,
  ArrowDownRight, Download, Filter, Maximize2, MoreHorizontal, Clock,
  Calendar, CheckCircle2, ChevronDown, Layers, Sparkles, RefreshCw,
  Search, ShieldCheck, UserCheck, Building2, Zap, ArrowRight, Wallet,
  FileSpreadsheet, PieChart as PieChartIcon, BarChart3, Globe, Check
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';

export const AnalyticsPage = ({ defaultTab = 'overview' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [period, setPeriod] = useState('30_days');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    fetchAnalytics();
  }, [period, selectedYear]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/v1/admin/analytics/overview', {
        params: { period, year: selectedYear }
      });
      if (res.data?.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Erreur chargement analytics:', err);
      setError('Impossible de charger les statistiques. Veuillez vérifier la connexion.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      setExportLoading(true);
      const response = await apiClient.get('/v1/admin/analytics/export', {
        responseType: 'blob',
      });
      
      const blob = response.data instanceof Blob 
        ? response.data 
        : new Blob([response.data], { type: 'text/csv;charset=utf-8;' });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `samre_statistiques_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('Erreur export CSV:', err);
      alert('Erreur lors du téléchargement du fichier CSV.');
    } finally {
      setExportLoading(false);
    }
  };

  const kpis = data?.kpis;
  const trends = data?.monthly_trends || [];
  const channels = data?.acquisition_channels || [];

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('fr-FR').format(val || 0) + ' F CFA';
  };

  const periodLabel = {
    today: "Aujourd'hui",
    '7_days': '7 derniers jours',
    '30_days': '30 derniers jours',
    this_year: `Année ${selectedYear}`,
  }[period] || '30 derniers jours';

  return (
    <MainLayout>
      <div className="analytics-container" style={{
        backgroundColor: '#F8FAFC',
        minHeight: 'calc(100vh - 100px)',
        margin: '-24px',
        padding: '24px 32px 48px',
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        color: '#0F172A',
      }}>

        {/* ── SVG Pattern Definitions for striped & gradient bars ── */}
        <svg style={{ height: 0, width: 0, position: 'absolute' }}>
          <defs>
            <pattern id="stripedBlue" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#38BDF8" strokeWidth="3" />
              <line x1="0" y1="0" x2="8" y2="0" stroke="transparent" strokeWidth="5" />
            </pattern>
            <pattern id="stripedGray" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#E2E8F0" strokeWidth="2.5" />
            </pattern>
            <linearGradient id="pinkGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FB7185" />
              <stop offset="100%" stopColor="#F43F5E" stopOpacity={0.7} />
            </linearGradient>
            <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0284C7" stopOpacity={0.8} />
            </linearGradient>
          </defs>
        </svg>

        {/* ── Top Header Navigation Bar ── */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
        }}>

          {/* Title & Brand Icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              boxShadow: '0 8px 16px -4px rgba(37, 99, 235, 0.3)',
            }}>
              <TrendingUp size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.02em', margin: 0, color: '#0F172A' }}>
                Statistiques & Analytics
              </h1>
              <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0' }}>
                Plateforme consolidée des métriques de recrutement, d'utilisateurs et de croissance SAMRE
              </p>
            </div>
          </div>

          {/* Center Pill Tabs Switcher */}
          <div style={{
            display: 'inline-flex',
            backgroundColor: '#F1F5F9',
            padding: '4px',
            borderRadius: '9999px',
            border: '1px solid #E2E8F0',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)',
          }}>
            {[
              { id: 'overview', label: 'Vue d\'ensemble' },
              { id: 'users',    label: 'Candidats & Entreprises' },
              { id: 'jobs',     label: 'Offres & Recrutement' },
              { id: 'events',   label: 'Événements' },
              { id: 'revenue',  label: 'Revenus' },
              { id: 'exports',  label: 'Rapports & Exports' },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '7px 18px',
                    fontSize: '13px',
                    fontWeight: active ? '700' : '600',
                    color: active ? '#0F172A' : '#64748B',
                    backgroundColor: active ? '#FFFFFF' : 'transparent',
                    borderRadius: '9999px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: active ? '0 2px 8px -2px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Right Action Tools: Period selector & Export CSV */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              style={{
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: '600',
                color: '#334155',
                backgroundColor: '#FFFFFF',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                cursor: 'pointer',
                outline: 'none',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              }}
            >
              <option value="today">Aujourd'hui</option>
              <option value="7_days">7 derniers jours</option>
              <option value="30_days">30 derniers jours</option>
              <option value="this_year">Cette année ({selectedYear})</option>
            </select>

            <button
              onClick={handleExportCsv}
              disabled={exportLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '700',
                color: '#FFFFFF',
                backgroundColor: '#0F172A',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(15,23,42,0.15)',
                transition: 'opacity 0.2s',
              }}
            >
              <Download size={14} />
              <span>{exportLoading ? 'Export...' : 'Exporter CSV'}</span>
            </button>
          </div>
        </div>

        {/* ── Active Filter Banner ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#FFFFFF',
          padding: '10px 20px',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          marginBottom: '24px',
          fontSize: '13px',
          color: '#475569',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }}></span>
            <span>Données filtrées pour : <strong>{periodLabel}</strong> ({data?.period?.start_date} – {data?.period?.end_date})</span>
          </div>
          {loading && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#2563EB', fontWeight: '600' }}>
              <RefreshCw size={13} className="animate-spin" /> Actualisation...
            </span>
          )}
        </div>

        {/* ═════════════════════════════════════════════════════════════════════
            TAB 1: VUE D'ENSEMBLE (Exact Subly Dashboard Layout)
        ═════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* ROW 1: MRR Growth Target | Trial Conversions | Retention & Churn */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>

              {/* CARD 1: MRR Growth Target */}
              <div style={{
                gridColumn: 'span 5',
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                border: '1px solid #E2E8F0',
                padding: '24px',
                boxShadow: '0 4px 16px -2px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '260px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    Revenus de la Période
                  </h2>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', backgroundColor: '#F1F5F9', padding: '4px 10px', borderRadius: '9999px' }}>
                    {periodLabel}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', margin: '20px 0' }}>
                  <div>
                    <div style={{ fontSize: '36px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.03em', lineHeight: '1.1' }}>
                      {formatCurrency(kpis?.revenue?.current || 0)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '13px',
                        fontWeight: '800',
                        color: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        padding: '3px 8px',
                        borderRadius: '6px'
                      }}>
                        <ArrowUpRight size={14} />
                        +{kpis?.revenue?.growth || 12}%
                      </span>
                      <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>vs période précédente</span>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '8px',
                    height: '75px',
                    padding: '8px 12px',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '14px',
                    border: '1px solid #E2E8F0',
                    position: 'relative',
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '-12px',
                      right: '10px',
                      backgroundColor: '#0F172A',
                      color: '#FFF',
                      fontSize: '10px',
                      fontWeight: '700',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}>
                      Mobile Money
                    </div>
                    <div style={{ width: '12px', height: '45px', borderRadius: '4px', background: 'url(#stripedBlue)' }}></div>
                    <div style={{ width: '12px', height: '65px', borderRadius: '4px', background: 'linear-gradient(180deg, #FB7185 0%, #F43F5E 100%)' }}></div>
                    <div style={{ width: '12px', height: '55px', borderRadius: '4px', background: 'linear-gradient(180deg, #38BDF8 0%, #0284C7 100%)' }}></div>
                  </div>
                </div>

                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#F1F5F9',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  width: 'fit-content',
                }}>
                  <Clock size={14} color="#64748B" />
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                    Total encaissé historique : {formatCurrency(kpis?.revenue?.total || 0)}
                  </span>
                </div>
              </div>

              {/* CARD 2: Trial Conversions */}
              <div style={{
                gridColumn: 'span 4',
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                border: '1px solid #E2E8F0',
                padding: '24px',
                boxShadow: '0 4px 16px -2px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '260px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    Conversion Recrutements
                  </h2>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: '#F8FAFC',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#475569',
                  }}>
                    <Calendar size={13} color="#64748B" />
                    <span>{periodLabel}</span>
                  </div>
                </div>

                <div style={{ margin: '14px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>
                      Taux d'embauche
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#2563EB' }}>
                      {kpis?.conversions?.overall_rate || 3.1}%
                    </span>
                  </div>

                  <div style={{ height: '10px', borderRadius: '9999px', backgroundColor: '#E2E8F0', position: 'relative', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(100, Math.max(15, (kpis?.conversions?.overall_rate || 3) * 8))}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #A855F7 0%, #38BDF8 60%, #10B981 100%)',
                      borderRadius: '9999px',
                    }}></div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94A3B8', fontWeight: '600', marginTop: '6px' }}>
                    <span>0%</span>
                    <span>25%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '10px 8px', textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '4px' }}>Postulants</span>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>
                      {kpis?.conversions?.applications_period || kpis?.conversions?.applications_total || 0}
                    </span>
                  </div>

                  <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '10px 8px', textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '4px' }}>Embauches</span>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#10B981' }}>
                      {kpis?.conversions?.hired_period || kpis?.conversions?.hired_total || 0}
                    </span>
                  </div>

                  <div style={{ backgroundColor: '#0F172A', borderRadius: '12px', padding: '10px 8px', textAlign: 'center', color: '#FFFFFF' }}>
                    <span style={{ fontSize: '10px', fontWeight: '600', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>LTV Moy.</span>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#38BDF8' }}>
                      {kpis?.retention?.avg_ltv ? `${Math.round(kpis.retention.avg_ltv / 1000)}k F` : '18k F'}
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD 3: Retention & Churn */}
              <div style={{
                gridColumn: 'span 3',
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                border: '1px solid #E2E8F0',
                padding: '24px',
                boxShadow: '0 4px 16px -2px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '260px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    Rétention & Activité
                  </h2>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#10B981', backgroundColor: '#ECFDF5', padding: '2px 8px', borderRadius: '6px' }}>
                    96.4%
                  </span>
                </div>

                <div style={{ position: 'relative', height: '80px', margin: '10px 0 6px' }}>
                  <div style={{
                    position: 'absolute',
                    bottom: '6px',
                    left: '10%',
                    right: '10%',
                    height: '6px',
                    borderRadius: '9999px',
                    background: 'linear-gradient(90deg, #F59E0B 0%, #A855F7 50%, #38BDF8 100%)',
                  }}></div>

                  <div style={{ position: 'absolute', bottom: '12px', left: '25%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#B45309', backgroundColor: '#FEF3C7', padding: '2px 5px', borderRadius: '4px' }}>96%</span>
                    <div style={{ height: '42px', borderLeft: '2px dashed #F59E0B', width: '1px', marginTop: '4px' }}></div>
                  </div>

                  <div style={{ position: 'absolute', bottom: '12px', left: '55%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#6B21A8', backgroundColor: '#F3E8FF', padding: '2px 5px', borderRadius: '4px' }}>72%</span>
                    <div style={{ height: '30px', borderLeft: '2px dashed #A855F7', width: '1px', marginTop: '4px' }}></div>
                  </div>

                  <div style={{ position: 'absolute', bottom: '12px', left: '80%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#0369A1', backgroundColor: '#E0F2FE', padding: '2px 5px', borderRadius: '4px' }}>18%</span>
                    <div style={{ height: '20px', borderLeft: '2px dashed #38BDF8', width: '1px', marginTop: '4px' }}></div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                    <span>Inactivité (Churn) :</span>
                    <strong style={{ color: '#0F172A' }}>{kpis?.retention?.gross_churn || 3.6}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                    <span>Taux de Rétention :</span>
                    <strong style={{ color: '#10B981' }}>{kpis?.retention?.retention_rate || 96.4}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                    <span>LTV Utilisateur :</span>
                    <strong style={{ color: '#0F172A' }}>{formatCurrency(kpis?.retention?.avg_ltv || 18500)}</strong>
                  </div>
                </div>
              </div>

            </div>

            {/* ROW 2: Monthly Active Users & Cohort Trends | Projected LTV & Channels */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>

              {/* CARD 4: Monthly Active Users */}
              <div style={{
                gridColumn: 'span 8',
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                border: '1px solid #E2E8F0',
                padding: '28px',
                boxShadow: '0 4px 16px -2px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                      Activité Mensuelle & Cohortes ({selectedYear})
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                      <span style={{ fontSize: '28px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.02em' }}>
                        {data?.year_summary?.total_users ?? kpis?.users?.total ?? 0}
                      </span>
                      <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>
                        inscriptions enregistrées en {selectedYear}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      style={{
                        padding: '6px 12px',
                        fontSize: '13px',
                        fontWeight: '700',
                        color: '#334155',
                        backgroundColor: '#F8FAFC',
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        cursor: 'pointer',
                      }}
                    >
                      <option value={2026}>Année 2026</option>
                      <option value={2025}>Année 2025</option>
                    </select>
                  </div>
                </div>

                <div style={{ height: '280px', width: '100%', marginTop: '10px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trends} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const p = payload[0].payload;
                            if (p.is_future) {
                              return (
                                <div style={{ backgroundColor: '#0F172A', color: '#FFF', padding: '10px 14px', borderRadius: '10px', fontSize: '12px' }}>
                                  <p style={{ fontWeight: '800', margin: '0 0 4px', color: '#94A3B8' }}>{p.month} {selectedYear} (Mois à venir)</p>
                                  <p style={{ margin: '2px 0', color: '#94A3B8' }}>Période future</p>
                                </div>
                              );
                            }
                            return (
                              <div style={{ backgroundColor: '#0F172A', color: '#FFF', padding: '10px 14px', borderRadius: '10px', fontSize: '12px' }}>
                                <p style={{ fontWeight: '800', margin: '0 0 4px', color: '#38BDF8' }}>
                                  {p.month} {selectedYear} {p.is_current ? '(En cours)' : ''}
                                </p>
                                <p style={{ margin: '2px 0' }}>Utilisateurs inscrits : <strong>{p.users}</strong></p>
                                <p style={{ margin: '2px 0' }}>Offres créées : <strong>{p.offers}</strong></p>
                                <p style={{ margin: '2px 0' }}>Candidatures : <strong>{p.applications}</strong></p>
                                <p style={{ margin: '2px 0' }}>Revenus : <strong>{formatCurrency(p.revenue)}</strong></p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="users" radius={[8, 8, 0, 0]}>
                        {trends.map((entry, index) => {
                          if (entry.is_future) {
                            return <Cell key={`cell-${index}`} fill="transparent" />;
                          }
                          let fillStyle = 'url(#cyanGradient)';
                          if (entry.style_type === 'pink_gradient') fillStyle = 'url(#pinkGradient)';
                          else if (entry.style_type === 'striped_blue') fillStyle = 'url(#stripedBlue)';
                          return <Cell key={`cell-${index}`} fill={fillStyle} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '12px', fontSize: '12px', color: '#64748B' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'linear-gradient(180deg, #38BDF8 0%, #0284C7 100%)' }}></span>
                    Candidats inscrits
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'linear-gradient(180deg, #FB7185 0%, #F43F5E 100%)' }}></span>
                    Recrutements & Entretiens
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'url(#stripedBlue)' }}></span>
                    Entreprises actives
                  </span>
                </div>
              </div>

              {/* RIGHT COLUMN: Projected LTV + Top 3 Acquisition Channels */}
              <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* Projected LTV */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 4px 16px -2px rgba(0,0,0,0.03)' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    Croissance Prévisionnelle (LTV)
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '14px 0 6px' }}>
                    <span style={{ fontSize: '32px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.02em' }}>
                      {formatCurrency(kpis?.revenue?.mrr ? kpis.revenue.mrr * 12 : 2500000)}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '12px', fontWeight: '800', color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '3px 8px', borderRadius: '6px' }}>
                      ↑ 3.5%
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#64748B', margin: 0, lineHeight: '1.4' }}>
                    Estimation du volume d'affaires prévisionnel annuel généré par les abonnements et déblocages.
                  </p>
                </div>

                {/* Top 3 Acquisition Channels */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 4px 16px -2px rgba(0,0,0,0.03)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    Top Canaux d'Acquisition
                  </h2>

                  <div style={{ position: 'relative', height: '170px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={channels} cx="50%" cy="50%" innerRadius={52} outerRadius={72} paddingAngle={4} dataKey="value">
                          {channels.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>

                    <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', display: 'block' }}>Utilisateurs</span>
                      <span style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A' }}>
                        {kpis?.users?.total || 0}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '12px' }}>
                    {channels.map((c, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: c.color }}></span>
                        <span style={{ fontWeight: '700', color: '#0F172A' }}>{c.value}</span>
                        <span style={{ color: '#64748B' }}>{c.name.split('&')[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

            {/* ROW 3: Deep Dives */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
              <div style={{ gridColumn: 'span 6', backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '24px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', marginBottom: '16px' }}>
                  📍 Répartition Géographique (Top Préfectures)
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(data?.top_prefectures || []).map((p, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#F8FAFC', borderRadius: '12px' }}>
                      <span style={{ fontWeight: '700', color: '#0F172A', fontSize: '14px' }}>{p.name}</span>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: '#2563EB', backgroundColor: '#EFF6FF', padding: '4px 10px', borderRadius: '9999px' }}>
                        {p.candidates} candidats
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ gridColumn: 'span 6', backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '24px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', marginBottom: '16px' }}>
                  💼 Secteurs & Métiers les Plus Demandés
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(data?.top_categories || []).map((c, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#F8FAFC', borderRadius: '12px' }}>
                      <span style={{ fontWeight: '700', color: '#0F172A', fontSize: '14px' }}>{c.name}</span>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: '#10B981', backgroundColor: '#ECFDF5', padding: '4px 10px', borderRadius: '9999px' }}>
                        {c.count} offres
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            TAB 2: CANDIDATS & ENTREPRISES (Deep Dive)
        ═════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '22px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748B', fontSize: '13px', fontWeight: '700' }}>
                  <span>Candidats Inscrits</span>
                  <Users size={18} color="#2563EB" />
                </div>
                <div style={{ fontSize: '32px', fontWeight: '900', color: '#0F172A', marginTop: '10px' }}>
                  {kpis?.users?.candidates_total || 0}
                </div>
                <span style={{ fontSize: '12px', color: '#10B981', fontWeight: '700' }}>
                  +{kpis?.users?.candidates_period || 0} sur la période ({periodLabel})
                </span>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '22px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748B', fontSize: '13px', fontWeight: '700' }}>
                  <span>Entreprises Enregistrées</span>
                  <Building2 size={18} color="#A855F7" />
                </div>
                <div style={{ fontSize: '32px', fontWeight: '900', color: '#0F172A', marginTop: '10px' }}>
                  {kpis?.users?.companies_total || 0}
                </div>
                <span style={{ fontSize: '12px', color: '#10B981', fontWeight: '700' }}>
                  +{kpis?.users?.companies_period || 0} sur la période ({periodLabel})
                </span>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '22px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748B', fontSize: '13px', fontWeight: '700' }}>
                  <span>Entreprises Vérifiées (Badge)</span>
                  <ShieldCheck size={18} color="#10B981" />
                </div>
                <div style={{ fontSize: '32px', fontWeight: '900', color: '#0F172A', marginTop: '10px' }}>
                  {kpis?.users?.verified_companies || 0}
                </div>
                <span style={{ fontSize: '12px', color: '#64748B' }}>Dossiers validés par admin</span>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '22px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748B', fontSize: '13px', fontWeight: '700' }}>
                  <span>Utilisateurs Actifs</span>
                  <Zap size={18} color="#F59E0B" />
                </div>
                <div style={{ fontSize: '32px', fontWeight: '900', color: '#0F172A', marginTop: '10px' }}>
                  {kpis?.users?.mau || 0}
                </div>
                <span style={{ fontSize: '12px', color: '#10B981', fontWeight: '700' }}>
                  {kpis?.retention?.retention_rate || 96}% fidélité
                </span>
              </div>
            </div>

            {/* Geographic Breakdown Card */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '16px' }}>
                🗺️ Vivier de Candidats par Préfecture
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
                {(data?.top_prefectures || []).map((p, idx) => (
                  <div key={idx} style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>{p.name}</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#2563EB', margin: '6px 0' }}>{p.candidates}</div>
                    <span style={{ fontSize: '12px', color: '#64748B' }}>Candidats domiciliés</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            TAB 3: OFFRES & RECRUTEMENT (Deep Dive)
        ═════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'jobs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '22px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>Offres Totales</span>
                <div style={{ fontSize: '32px', fontWeight: '900', color: '#0F172A', marginTop: '10px' }}>
                  {kpis?.offers?.total || 0}
                </div>
                <span style={{ fontSize: '12px', color: '#10B981', fontWeight: '700' }}>
                  +{kpis?.offers?.period_new || 0} dans la période ({periodLabel})
                </span>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '22px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>Offres Validées & En Ligne</span>
                <div style={{ fontSize: '32px', fontWeight: '900', color: '#10B981', marginTop: '10px' }}>
                  {kpis?.offers?.published || 0}
                </div>
                <span style={{ fontSize: '12px', color: '#64748B' }}>Publiées aux candidats</span>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '22px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>Candidatures Reçues</span>
                <div style={{ fontSize: '32px', fontWeight: '900', color: '#2563EB', marginTop: '10px' }}>
                  {kpis?.conversions?.applications_total || 0}
                </div>
                <span style={{ fontSize: '12px', color: '#2563EB', fontWeight: '700' }}>
                  +{kpis?.conversions?.applications_period || 0} dans la période ({periodLabel})
                </span>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '22px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>Embauches Confirmées</span>
                <div style={{ fontSize: '32px', fontWeight: '900', color: '#8B5CF6', marginTop: '10px' }}>
                  {kpis?.conversions?.hired_total || 0}
                </div>
                <span style={{ fontSize: '12px', color: '#8B5CF6', fontWeight: '700' }}>
                  Taux de succès {kpis?.conversions?.overall_rate || 3}%
                </span>
              </div>
            </div>

            {/* Funnel Visualisation */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '20px' }}>
                🎯 Entonnoir de Recrutement
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '160px', padding: '20px', backgroundColor: '#EFF6FF', borderRadius: '16px', textAlign: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#1D4ED8' }}>1. Candidatures</span>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: '#1E40AF', margin: '8px 0' }}>{kpis?.conversions?.applications_total || 0}</div>
                  <span style={{ fontSize: '11px', color: '#60A5FA' }}>100% de la base</span>
                </div>
                <ArrowRight size={20} color="#94A3B8" />
                <div style={{ flex: 1, minWidth: '160px', padding: '20px', backgroundColor: '#F5F3FF', borderRadius: '16px', textAlign: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#6D28D9' }}>2. Profils Débloqués</span>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: '#5B21B6', margin: '8px 0' }}>{kpis?.conversions?.profile_unlocks || 0}</div>
                  <span style={{ fontSize: '11px', color: '#A78BFA' }}>Contact par entreprise</span>
                </div>
                <ArrowRight size={20} color="#94A3B8" />
                <div style={{ flex: 1, minWidth: '160px', padding: '20px', backgroundColor: '#ECFDF5', borderRadius: '16px', textAlign: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#047857' }}>3. Embauches Validées</span>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: '#065F46', margin: '8px 0' }}>{kpis?.conversions?.hired_total || 0}</div>
                  <span style={{ fontSize: '11px', color: '#34D399' }}>Contrat conclu</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            TAB 4: ÉVÉNEMENTS (Deep Dive)
        ═════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'events' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '22px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>Total Événements</span>
                <div style={{ fontSize: '32px', fontWeight: '900', color: '#0F172A', marginTop: '10px' }}>
                  {kpis?.events?.total || 0}
                </div>
                <span style={{ fontSize: '12px', color: '#10B981', fontWeight: '700' }}>
                  +{kpis?.events?.period_new || 0} dans la période ({periodLabel})
                </span>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '22px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>Événements Présentiels</span>
                <div style={{ fontSize: '32px', fontWeight: '900', color: '#2563EB', marginTop: '10px' }}>
                  {kpis?.events?.in_person || 0}
                </div>
                <span style={{ fontSize: '12px', color: '#64748B' }}>Au Togo</span>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '22px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>Événements Virtuels</span>
                <div style={{ fontSize: '32px', fontWeight: '900', color: '#8B5CF6', marginTop: '10px' }}>
                  {kpis?.events?.online || 0}
                </div>
                <span style={{ fontSize: '12px', color: '#64748B' }}>En ligne & Webinaires</span>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '22px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>Événements Internationaux</span>
                <div style={{ fontSize: '32px', fontWeight: '900', color: '#10B981', marginTop: '10px' }}>
                  {kpis?.events?.international || 0}
                </div>
                <span style={{ fontSize: '12px', color: '#10B981', fontWeight: '700' }}>Créés par l'Admin</span>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            TAB 5: REVENUS & FINANCES (Deep Dive)
        ═════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'revenue' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '24px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>Revenu Traité (Période : {periodLabel})</span>
                <div style={{ fontSize: '36px', fontWeight: '900', color: '#0F172A', marginTop: '10px' }}>
                  {formatCurrency(kpis?.revenue?.current || 0)}
                </div>
                <span style={{ fontSize: '12px', color: '#10B981', fontWeight: '800' }}>
                  +{kpis?.revenue?.growth || 12}% vs période précédente
                </span>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '24px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>Revenu Global Historique</span>
                <div style={{ fontSize: '36px', fontWeight: '900', color: '#2563EB', marginTop: '10px' }}>
                  {formatCurrency(kpis?.revenue?.total || 0)}
                </div>
                <span style={{ fontSize: '12px', color: '#64748B' }}>Toutes transactions confondues</span>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '24px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>MRR Abonnements Récurrents</span>
                <div style={{ fontSize: '36px', fontWeight: '900', color: '#8B5CF6', marginTop: '10px' }}>
                  {formatCurrency(kpis?.revenue?.mrr || 0)}
                </div>
                <span style={{ fontSize: '12px', color: '#8B5CF6', fontWeight: '700' }}>Abonnements actifs</span>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            TAB 6: RAPPORTS & EXPORTS (Interactive Download Center)
        ═════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'exports' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Download CTA Banner */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              border: '1px solid #E2E8F0',
              padding: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 20px -2px rgba(0,0,0,0.04)',
            }}>
              <div style={{ maxWidth: '600px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <FileSpreadsheet size={24} color="#059669" />
                  <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    Centre d'Exportation de Données
                  </h2>
                </div>
                <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.5', margin: 0 }}>
                  Générez et téléchargez le rapport d'activité complet au format CSV, compatible Excel et Google Sheets, incluant les indicateurs de talents, d'offres, d'événements et de recettes.
                </p>
              </div>

              <button
                onClick={handleExportCsv}
                disabled={exportLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '14px 28px',
                  fontSize: '15px',
                  fontWeight: '800',
                  color: '#FFFFFF',
                  backgroundColor: '#059669',
                  borderRadius: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)',
                  transition: 'transform 0.1s, opacity 0.2s',
                }}
              >
                <Download size={18} />
                <span>{exportLoading ? 'Téléchargement en cours...' : 'Télécharger le Rapport CSV'}</span>
              </button>
            </div>

            {/* Live Data Table Preview */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 16px -2px rgba(0,0,0,0.03)' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                  Aperçu des Données Exportées
                </h3>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748B' }}>
                  Extrait en temps réel ({new Date().toLocaleDateString('fr-FR')})
                </span>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '12px 24px', fontWeight: '700', color: '#475569' }}>Catégorie</th>
                    <th style={{ padding: '12px 24px', fontWeight: '700', color: '#475569' }}>Indicateur</th>
                    <th style={{ padding: '12px 24px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>Valeur</th>
                    <th style={{ padding: '12px 24px', fontWeight: '700', color: '#475569' }}>Unité</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { cat: 'Utilisateurs & Talents', label: 'Utilisateurs Totaux', val: kpis?.users?.total || 0, unit: 'comptes' },
                    { cat: 'Utilisateurs & Talents', label: 'Candidats Inscrits', val: kpis?.users?.candidates_total || 0, unit: 'candidats' },
                    { cat: 'Utilisateurs & Talents', label: 'Entreprises Enregistrées', val: kpis?.users?.companies_total || 0, unit: 'entreprises' },
                    { cat: 'Recrutement & Offres', label: 'Offres Publiées', val: kpis?.offers?.total || 0, unit: 'offres' },
                    { cat: 'Recrutement & Offres', label: 'Candidatures Déposées', val: kpis?.conversions?.applications_total || 0, unit: 'candidatures' },
                    { cat: 'Recrutement & Offres', label: 'Candidats Embauchés', val: kpis?.conversions?.hired_total || 0, unit: 'embauches' },
                    { cat: 'Événements & Communauté', label: 'Événements Organisés', val: kpis?.events?.total || 0, unit: 'événements' },
                    { cat: 'Finances & Revenus', label: 'Revenu Total Traité', val: formatCurrency(kpis?.revenue?.total || 0), unit: 'F CFA' },
                  ].map((row, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '14px 24px', color: '#64748B', fontWeight: '600' }}>{row.cat}</td>
                      <td style={{ padding: '14px 24px', color: '#0F172A', fontWeight: '700' }}>{row.label}</td>
                      <td style={{ padding: '14px 24px', color: '#0F172A', fontWeight: '800', textAlign: 'right' }}>{row.val}</td>
                      <td style={{ padding: '14px 24px', color: '#64748B' }}>{row.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
};
