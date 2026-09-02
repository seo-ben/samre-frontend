import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import apiClient from '../lib/apiClient';
import {
  TrendingUp, Users, Briefcase, CalendarDays, Award, ArrowUpRight,
  ArrowDownRight, Download, Filter, Maximize2, MoreHorizontal, Clock,
  Calendar, CheckCircle2, ChevronDown, Layers, Sparkles, RefreshCw,
  Search, ShieldCheck, UserCheck, Building2, Zap, ArrowRight, Wallet
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
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `samre_analytics_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Erreur export CSV:', err);
      alert('Erreur lors de l\'export du fichier CSV.');
    } finally {
      setExportLoading(false);
    }
  };

  const kpis = data?.kpis;
  const trends = data?.monthly_trends || [];
  const channels = data?.acquisition_channels || [];

  // Format currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('fr-FR').format(val || 0) + ' F CFA';
  };

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
            {/* Striped Blue Pattern */}
            <pattern id="stripedBlue" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#38BDF8" strokeWidth="3" />
              <line x1="0" y1="0" x2="8" y2="0" stroke="transparent" strokeWidth="5" />
            </pattern>
            {/* Striped Gray Pattern */}
            <pattern id="stripedGray" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#E2E8F0" strokeWidth="2.5" />
            </pattern>
            {/* Pink to Rose Gradient */}
            <linearGradient id="pinkGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FB7185" />
              <stop offset="100%" stopColor="#F43F5E" stopOpacity={0.7} />
            </linearGradient>
            {/* Cyan to Blue Gradient */}
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

          {/* Center Pill Tabs Switcher (Identique à la maquette Subly) */}
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
              { id: 'users', label: 'Candidats & Entreprises' },
              { id: 'jobs', label: 'Offres & Recrutement' },
              { id: 'events', label: 'Événements' },
              { id: 'revenue', label: 'Revenus' },
              { id: 'exports', label: 'Rapports & Exports' },
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

        {/* ── Main Analytics Grid ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* ═════════════════════════════════════════════════════════════════════
              ROW 1: MRR Growth Target (Left) | Trial Conversions (Center) | Retention & Churn (Right)
          ═════════════════════════════════════════════════════════════════════ */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: '24px',
          }}>

            {/* CARD 1: MRR Growth Target (5 cols) */}
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
              position: 'relative',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                  Objectif Croissance Revenus
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#64748B',
                    backgroundColor: '#F1F5F9',
                    padding: '4px 10px',
                    borderRadius: '9999px'
                  }}>
                    Tous
                  </span>
                  <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8', padding: '4px' }}>
                    <MoreHorizontal size={18} />
                  </button>
                </div>
              </div>

              {/* Middle: Big Metric & Mini Bar Graphic */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', margin: '20px 0' }}>
                <div>
                  <div style={{ fontSize: '36px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.03em', lineHeight: '1.1' }}>
                    {formatCurrency(kpis?.revenue?.current || kpis?.revenue?.total || 0)}
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
                    <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>vs mois précédent</span>
                  </div>
                </div>

                {/* Mini bar chart representation */}
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
                  {/* Tooltip Tag */}
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
                    whiteSpace: 'nowrap',
                  }}>
                    Mobile Money
                  </div>
                  <div style={{ width: '12px', height: '45px', borderRadius: '4px', background: 'url(#stripedBlue)' }}></div>
                  <div style={{ width: '12px', height: '65px', borderRadius: '4px', background: 'linear-gradient(180deg, #FB7185 0%, #F43F5E 100%)' }}></div>
                  <div style={{ width: '12px', height: '55px', borderRadius: '4px', background: 'linear-gradient(180deg, #38BDF8 0%, #0284C7 100%)' }}></div>
                </div>
              </div>

              {/* Bottom: Date pill */}
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
                  Période : {data?.period?.start_date || '01 Jan'} – {data?.period?.end_date || 'Aujourd\'hui'}
                </span>
              </div>
            </div>

            {/* CARD 2: Trial Conversions / Funnel de Recrutement (4 cols) */}
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
              {/* Header with week dropdown */}
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
                  <span>Actif</span>
                  <ChevronDown size={13} color="#94A3B8" />
                </div>
              </div>

              {/* Goal Progress Bar */}
              <div style={{ margin: '14px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>
                    Taux d'embauche cible
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#2563EB' }}>
                    {kpis?.conversions?.overall_rate || 3.1}%
                  </span>
                </div>

                {/* Gradient segmented bar */}
                <div style={{
                  height: '10px',
                  borderRadius: '9999px',
                  backgroundColor: '#E2E8F0',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${Math.min(100, Math.max(15, (kpis?.conversions?.overall_rate || 3) * 8))}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #A855F7 0%, #38BDF8 60%, #10B981 100%)',
                    borderRadius: '9999px',
                  }}></div>
                </div>

                {/* Progress markers */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94A3B8', fontWeight: '600', marginTop: '6px' }}>
                  <span>0%</span>
                  <span>25%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* 3 Micro-Metric Pill Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {/* 1. Candidatures */}
                <div style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  padding: '10px 8px',
                  textAlign: 'center',
                }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '4px' }}>
                    Postulants
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>
                    {kpis?.conversions?.applications_total || 0}
                  </span>
                </div>

                {/* 2. Embauches */}
                <div style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  padding: '10px 8px',
                  textAlign: 'center',
                }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '4px' }}>
                    Embauches
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#10B981' }}>
                    {kpis?.conversions?.hired_total || 0}
                  </span>
                </div>

                {/* 3. LTV / Valeur */}
                <div style={{
                  backgroundColor: '#0F172A',
                  borderRadius: '12px',
                  padding: '10px 8px',
                  textAlign: 'center',
                  color: '#FFFFFF',
                }}>
                  <span style={{ fontSize: '10px', fontWeight: '600', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    LTV Moy.
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#38BDF8' }}>
                    {kpis?.retention?.avg_ltv ? `${Math.round(kpis.retention.avg_ltv / 1000)}k F` : '18k F'} &gt;
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 3: Retention & Churn Analysis (3 cols) */}
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
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                  Rétention & Activité
                </h2>
                <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8' }}>
                  <MoreHorizontal size={18} />
                </button>
              </div>

              {/* Pin indicator graphic with dotted vertical stems */}
              <div style={{ position: 'relative', height: '80px', margin: '10px 0 6px' }}>
                {/* Baseline bar */}
                <div style={{
                  position: 'absolute',
                  bottom: '6px',
                  left: '10%',
                  right: '10%',
                  height: '6px',
                  borderRadius: '9999px',
                  background: 'linear-gradient(90deg, #F59E0B 0%, #A855F7 50%, #38BDF8 100%)',
                }}></div>

                {/* Pin 1: 50% */}
                <div style={{ position: 'absolute', bottom: '12px', left: '25%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: '#B45309', backgroundColor: '#FEF3C7', padding: '2px 5px', borderRadius: '4px' }}>
                    96%
                  </span>
                  <div style={{ height: '42px', borderLeft: '2px dashed #F59E0B', width: '1px', marginTop: '4px' }}></div>
                </div>

                {/* Pin 2: 20% */}
                <div style={{ position: 'absolute', bottom: '12px', left: '55%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: '#6B21A8', backgroundColor: '#F3E8FF', padding: '2px 5px', borderRadius: '4px' }}>
                    72%
                  </span>
                  <div style={{ height: '30px', borderLeft: '2px dashed #A855F7', width: '1px', marginTop: '4px' }}></div>
                </div>

                {/* Pin 3: 17% */}
                <div style={{ position: 'absolute', bottom: '12px', left: '80%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: '#0369A1', backgroundColor: '#E0F2FE', padding: '2px 5px', borderRadius: '4px' }}>
                    18%
                  </span>
                  <div style={{ height: '20px', borderLeft: '2px dashed #38BDF8', width: '1px', marginTop: '4px' }}></div>
                </div>
              </div>

              {/* Key breakdown list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                  <span>Taux de Churn (Inactifs) :</span>
                  <strong style={{ color: '#0F172A' }}>{kpis?.retention?.gross_churn || 3.6}%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                  <span>Taux de Rétention :</span>
                  <strong style={{ color: '#10B981' }}>{kpis?.retention?.retention_rate || 96.4}%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                  <span>Valeur Vie Utilisateur (LTV) :</span>
                  <strong style={{ color: '#0F172A' }}>{formatCurrency(kpis?.retention?.avg_ltv || 18500)}</strong>
                </div>
              </div>
            </div>

          </div>

          {/* ═════════════════════════════════════════════════════════════════════
              ROW 2: Monthly Active Users & Cohort Trends (Left 8 cols) | Projected LTV & Channels (Right 4 cols)
          ═════════════════════════════════════════════════════════════════════ */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: '24px',
          }}>

            {/* CARD 4: Monthly Active Users (MAU) & Cohort Trends (8 cols) */}
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
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    Activité Mensuelle & Cohortes ({selectedYear})
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <span style={{ fontSize: '28px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.02em' }}>
                      {kpis?.users?.mau?.toLocaleString('fr-FR') || kpis?.users?.total || 0}
                    </span>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      fontSize: '13px',
                      fontWeight: '800',
                      color: '#10B981',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}>
                      +{kpis?.users?.growth || 32}% vs mois dernier
                    </span>
                  </div>
                </div>

                {/* Year Dropdown selector */}
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
                    <option value={2026}>2026</option>
                    <option value={2025}>2025</option>
                  </select>
                </div>
              </div>

              {/* Large Recharts Custom Bar Chart */}
              <div style={{ height: '280px', width: '100%', marginTop: '10px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trends} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94A3B8', fontSize: 11 }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const p = payload[0].payload;
                          return (
                            <div style={{
                              backgroundColor: '#0F172A',
                              color: '#FFF',
                              padding: '10px 14px',
                              borderRadius: '10px',
                              fontSize: '12px',
                              boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                            }}>
                              <p style={{ fontWeight: '800', margin: '0 0 4px', color: '#38BDF8' }}>{p.month} {selectedYear}</p>
                              <p style={{ margin: '2px 0' }}>Utilisateurs actifs : <strong>{p.users}</strong></p>
                              <p style={{ margin: '2px 0' }}>Offres publiées : <strong>{p.offers}</strong></p>
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
                        // Alternate styled fills matching screenshot
                        let fillStyle = 'url(#cyanGradient)';
                        if (entry.style_type === 'pink_gradient') fillStyle = 'url(#pinkGradient)';
                        else if (entry.style_type === 'striped_blue') fillStyle = 'url(#stripedBlue)';
                        else if (entry.style_type === 'gray_pattern') fillStyle = 'url(#stripedGray)';
                        return <Cell key={`cell-${index}`} fill={fillStyle} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Chart Legend Footer */}
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

            {/* RIGHT COLUMN (4 cols): Projected LTV + Top 3 Acquisition Channels */}
            <div style={{
              gridColumn: 'span 4',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}>

              {/* CARD 5: Projected LTV */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                border: '1px solid #E2E8F0',
                padding: '24px',
                boxShadow: '0 4px 16px -2px rgba(0,0,0,0.03)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    Croissance Prévisionnelle (LTV)
                  </h2>
                  <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8' }}>
                    <MoreHorizontal size={18} />
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '14px 0 6px' }}>
                  <span style={{ fontSize: '32px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.02em' }}>
                    {formatCurrency(kpis?.revenue?.mrr ? kpis.revenue.mrr * 12 : 2500000)}
                  </span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px',
                    fontSize: '12px',
                    fontWeight: '800',
                    color: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    padding: '3px 8px',
                    borderRadius: '6px'
                  }}>
                    ↑ 3.5%
                  </span>
                </div>

                <p style={{ fontSize: '13px', color: '#64748B', margin: 0, lineHeight: '1.4' }}>
                  Estimation du volume d'affaires et de revenus récurrents générés par les abonnements et déblocages.
                </p>
              </div>

              {/* CARD 6: Top 3 Acquisition Channels (Donut Chart) */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                border: '1px solid #E2E8F0',
                padding: '24px',
                boxShadow: '0 4px 16px -2px rgba(0,0,0,0.03)',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    Top Canaux d'Acquisition
                  </h2>
                  <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8' }}>
                    <MoreHorizontal size={18} />
                  </button>
                </div>

                {/* Donut Chart with central counter */}
                <div style={{ position: 'relative', height: '170px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={channels}
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={72}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {channels.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Central Text Badge */}
                  <div style={{
                    position: 'absolute',
                    textAlign: 'center',
                    pointerEvents: 'none',
                  }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', display: 'block' }}>
                      Utilisateurs Actifs
                    </span>
                    <span style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A' }}>
                      {kpis?.users?.total || 0}
                    </span>
                  </div>
                </div>

                {/* Donut Legend */}
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

          {/* ═════════════════════════════════════════════════════════════════════
              ROW 3: Deep Dives (Zones géographiques, Offres par catégories, etc.)
          ═════════════════════════════════════════════════════════════════════ */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: '24px',
          }}>
            {/* Top Prefectures */}
            <div style={{
              gridColumn: 'span 6',
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              border: '1px solid #E2E8F0',
              padding: '24px',
              boxShadow: '0 4px 16px -2px rgba(0,0,0,0.03)',
            }}>
              <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', marginBottom: '16px' }}>
                📍 Répartition Géographique (Top Préfectures)
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(data?.top_prefectures || []).map((p, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#F8FAFC', borderRadius: '12px' }}>
                    <span style={{ fontWeight: '700', color: '#0F172A', fontSize: '14px' }}>{p.name}</span>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '800',
                      color: '#2563EB',
                      backgroundColor: '#EFF6FF',
                      padding: '4px 10px',
                      borderRadius: '9999px',
                    }}>
                      {p.candidates} candidats
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Categories */}
            <div style={{
              gridColumn: 'span 6',
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              border: '1px solid #E2E8F0',
              padding: '24px',
              boxShadow: '0 4px 16px -2px rgba(0,0,0,0.03)',
            }}>
              <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', marginBottom: '16px' }}>
                💼 Secteurs & Métiers les Plus Demandés
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(data?.top_categories || []).map((c, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#F8FAFC', borderRadius: '12px' }}>
                    <span style={{ fontWeight: '700', color: '#0F172A', fontSize: '14px' }}>{c.name}</span>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '800',
                      color: '#10B981',
                      backgroundColor: '#ECFDF5',
                      padding: '4px 10px',
                      borderRadius: '9999px',
                    }}>
                      {c.count} offres
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>
    </MainLayout>
  );
};
