import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import apiClient from '../lib/apiClient';
import {
  CreditCard,
  EyeOff,
  Unlock,
  TrendingUp,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  DollarSign,
  Loader2,
  Check,
  ShieldCheck
} from 'lucide-react';

export function SubscriptionControlCenterPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // States pour les tarifs de déblocage
  const [candidateCost, setCandidateCost] = useState(1000);
  const [companyCost, setCompanyCost] = useState(1000);
  const [savingSettings, setSavingSettings] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchHubData = async () => {
    setLoading(true);
    setError(null);
    try {
      let responseData;
      try {
        const res = await apiClient.get('/v1/admin/subscription-control-center');
        responseData = res.data.data || res.data;
      } catch (e) {
        // Fallback résilient si la route d'agrégation n'est pas encore déployée sur la prod
        const [plansRes, blurRes, subsRes, settingsRes] = await Promise.all([
          apiClient.get('/v1/admin/subscription-plans').catch(() => ({ data: [] })),
          apiClient.get('/v1/admin/blur-rules').catch(() => ({ data: [] })),
          apiClient.get('/v1/admin/user-subscriptions?status=active').catch(() => ({ data: [] })),
          apiClient.get('/v1/admin/system-settings').catch(() => ({ data: [] }))
        ]);

        const rawPlans = plansRes.data.data || plansRes.data || [];
        const rawBlur = blurRes.data.data || blurRes.data || [];
        const rawSubs = subsRes.data.data || subsRes.data || [];
        const rawSettings = settingsRes.data.data || settingsRes.data || [];

        const candidateCostSetting = Array.isArray(rawSettings) ? rawSettings.find(s => s.key === 'candidate_unlock_cost_cfa') : null;
        const companyCostSetting = Array.isArray(rawSettings) ? rawSettings.find(s => s.key === 'company_unlock_cost_cfa') : null;

        const candidateRules = Array.isArray(rawBlur) ? rawBlur.filter(r => r.profile_type === 'candidate') : [];
        const companyRules = Array.isArray(rawBlur) ? rawBlur.filter(r => r.profile_type === 'company') : [];

        responseData = {
          plans: rawPlans,
          blur_rules: {
            candidate: candidateRules,
            company: companyRules
          },
          unlock_settings: {
            candidate_unlock_cost_cfa: candidateCostSetting ? parseFloat(candidateCostSetting.value) : 1000,
            company_unlock_cost_cfa: companyCostSetting ? parseFloat(companyCostSetting.value) : 1000
          },
          stats: {
            active_subscriptions_count: Array.isArray(rawSubs) ? rawSubs.length : 0,
            total_revenue_cfa: Array.isArray(rawSubs) ? rawSubs.reduce((acc, curr) => acc + (parseFloat(curr.price_paid) || 0), 0) : 0,
            popular_plan: rawPlans[0]?.name || 'Aucun'
          }
        };
      }

      setData(responseData);
      setCandidateCost(responseData.unlock_settings?.candidate_unlock_cost_cfa || 1000);
      setCompanyCost(responseData.unlock_settings?.company_unlock_cost_cfa || 1000);
    } catch (err) {
      console.error(err);
      setError("Erreur de connexion au serveur API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHubData();
  }, []);

  const handleSaveUnlockCosts = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      try {
        await apiClient.put('/v1/admin/subscription-control-center/unlock-settings', {
          candidate_unlock_cost_cfa: parseFloat(candidateCost),
          company_unlock_cost_cfa: parseFloat(companyCost),
        });
      } catch (e) {
        // Fallback direct sur system-settings
        await Promise.all([
          apiClient.post('/v1/admin/system-settings', { key: 'candidate_unlock_cost_cfa', value: candidateCost }),
          apiClient.post('/v1/admin/system-settings', { key: 'company_unlock_cost_cfa', value: companyCost })
        ]);
      }
      showToast("Nouveaux tarifs de déblocage enregistrés avec succès !");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour des paramètres.");
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <MainLayout>
      <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
        
        {/* Toast Notification */}
        {toastMessage && (
          <div style={{
            position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
            backgroundColor: '#10B981', color: '#FFF', padding: '12px 20px', borderRadius: '10px',
            boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)', display: 'flex', alignItems: 'center', gap: '10px',
            fontWeight: '500', fontSize: '14px', animation: 'fadeIn 0.3s ease'
          }}>
            <CheckCircle2 size={18} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#09090B', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sliders size={28} color="#1A6FD4" />
              Centre de Contrôle des Abonnements & Règles
            </h1>
            <p style={{ fontSize: '14px', color: '#71717A', marginTop: '4px' }}>
              Gérez les forfaits, le floutage automatique des données et les tarifs de déblocage sur un seul écran.
            </p>
          </div>

          <button
            onClick={fetchHubData}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              backgroundColor: '#FFFFFF', border: '1px solid #E4E4E7',
              padding: '10px 18px', borderRadius: '10px', fontSize: '14px', fontWeight: '500',
              color: '#09090B', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: '0.2s'
            }}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Actualiser
          </button>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B',
            padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            <AlertCircle size={20} color="#DC2626" />
            <span>{error}</span>
          </div>
        )}

        {/* Cartes d'indicateurs (KPIs) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          
          <div style={{ backgroundColor: '#FFF', padding: '20px', borderRadius: '16px', border: '1px solid #E4E4E7', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={24} color="#1A6FD4" />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#71717A', fontWeight: '500' }}>Souscriptions Actives</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#09090B', marginTop: '2px' }}>
                {loading ? '...' : (data?.stats?.active_subscriptions_count || 0)}
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#FFF', padding: '20px', borderRadius: '16px', border: '1px solid #E4E4E7', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={24} color="#10B981" />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#71717A', fontWeight: '500' }}>Revenu Total Généré</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#09090B', marginTop: '2px' }}>
                {loading ? '...' : `${(data?.stats?.total_revenue_cfa || 0).toLocaleString()} FCFA`}
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#FFF', padding: '20px', borderRadius: '16px', border: '1px solid #E4E4E7', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Unlock size={24} color="#F59E0B" />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#71717A', fontWeight: '500' }}>Tarif Déblocage Candidat</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#09090B', marginTop: '2px' }}>
                {loading ? '...' : `${(candidateCost).toLocaleString()} FCFA`}
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#FFF', padding: '20px', borderRadius: '16px', border: '1px solid #E4E4E7', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EyeOff size={24} color="#9333EA" />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#71717A', fontWeight: '500' }}>Plan le plus Populaire</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#09090B', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {loading ? '...' : (data?.stats?.popular_plan || 'Aucun')}
              </div>
            </div>
          </div>

        </div>

        {/* Navigation des Onglets */}
        <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #E4E4E7', marginBottom: '24px', paddingBottom: '2px' }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '12px 20px', fontSize: '14px', fontWeight: '600', border: 'none', background: 'none',
              borderBottom: activeTab === 'overview' ? '3px solid #1A6FD4' : '3px solid transparent',
              color: activeTab === 'overview' ? '#1A6FD4' : '#71717A', cursor: 'pointer', transition: '0.2s'
            }}
          >
            1. Déblocage & Tarifs
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            style={{
              padding: '12px 20px', fontSize: '14px', fontWeight: '600', border: 'none', background: 'none',
              borderBottom: activeTab === 'rules' ? '3px solid #1A6FD4' : '3px solid transparent',
              color: activeTab === 'rules' ? '#1A6FD4' : '#71717A', cursor: 'pointer', transition: '0.2s'
            }}
          >
            2. Matrice de Floutage des Données
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            style={{
              padding: '12px 20px', fontSize: '14px', fontWeight: '600', border: 'none', background: 'none',
              borderBottom: activeTab === 'plans' ? '3px solid #1A6FD4' : '3px solid transparent',
              color: activeTab === 'plans' ? '#1A6FD4' : '#71717A', cursor: 'pointer', transition: '0.2s'
            }}
          >
            3. Forfaits d'Abonnement
          </button>
        </div>

        {/* TAB 1 : Déblocages Unitaires */}
        {activeTab === 'overview' && (
          <div style={{ backgroundColor: '#FFF', padding: '28px', borderRadius: '16px', border: '1px solid #E4E4E7', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#09090B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={20} color="#1A6FD4" />
                Configuration des Tarifs de Déblocage Unitaire (Portefeuille)
              </h2>
              <p style={{ fontSize: '14px', color: '#71717A', marginTop: '4px' }}>
                Fixez la somme débitée automatiquement du solde du Portefeuille lors d'un déblocage de profil sans abonnement active.
              </p>
            </div>

            <form onSubmit={handleSaveUnlockCosts} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#09090B', marginBottom: '8px' }}>
                  Déblocage d'un profil Candidat par une Entreprise (FCFA)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={candidateCost}
                    onChange={(e) => setCandidateCost(e.target.value)}
                    style={{
                      width: '100%', padding: '12px 60px 12px 16px', borderRadius: '10px',
                      border: '1px solid #D4D4D8', fontSize: '16px', fontWeight: '700', outline: 'none',
                      backgroundColor: '#FAFAFA', color: '#09090B'
                    }}
                    placeholder="1000"
                  />
                  <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: '#71717A', fontSize: '13px' }}>
                    FCFA
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: '#A1A1AA', marginTop: '6px' }}>
                  Frais prélevés sur le solde Entreprise pour afficher les coordonnées masquées d'un candidat.
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#09090B', marginBottom: '8px' }}>
                  Déblocage d'un profil Entreprise par un Utilisateur (FCFA)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={companyCost}
                    onChange={(e) => setCompanyCost(e.target.value)}
                    style={{
                      width: '100%', padding: '12px 60px 12px 16px', borderRadius: '10px',
                      border: '1px solid #D4D4D8', fontSize: '16px', fontWeight: '700', outline: 'none',
                      backgroundColor: '#FAFAFA', color: '#09090B'
                    }}
                    placeholder="1000"
                  />
                  <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: '#71717A', fontSize: '13px' }}>
                    FCFA
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: '#A1A1AA', marginTop: '6px' }}>
                  Frais prélevés pour afficher le téléphone/email d'une entreprise recruteuse.
                </p>
              </div>

              <div style={{ gridColumn: '1 / -1', paddingTop: '8px' }}>
                <button
                  type="submit"
                  disabled={savingSettings}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    backgroundColor: '#1A6FD4', color: '#FFF', border: 'none',
                    padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: '600',
                    cursor: 'pointer', boxShadow: '0 4px 12px rgba(26, 111, 212, 0.25)', transition: '0.2s'
                  }}
                >
                  {savingSettings ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
                  {savingSettings ? 'Enregistrement en cours...' : 'Enregistrer les Tarifs'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2 : Matrice de Floutage */}
        {activeTab === 'rules' && (
          <div style={{ backgroundColor: '#FFF', padding: '28px', borderRadius: '16px', border: '1px solid #E4E4E7', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#09090B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <EyeOff size={20} color="#1A6FD4" />
                Matrice des Données Floutées Automatiquement (Offres Gratuites)
              </h2>
              <p style={{ fontSize: '14px', color: '#71717A', marginTop: '4px' }}>
                Tous les champs marqués ci-dessous sont remplacés par des astérisques (ex: `+228 90******`) pour les comptes gratuits sans souscription.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* Profil Candidats */}
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#1A6FD4', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                  Champs Candidats Masqués ({data?.blur_rules?.candidate?.length || 0})
                </h3>
                <div style={{ border: '1px solid #E4E4E7', borderRadius: '12px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                    <thead style={{ backgroundColor: '#F4F4F5', color: '#52525B', fontWeight: '600', borderBottom: '1px solid #E4E4E7' }}>
                      <tr>
                        <th style={{ padding: '12px 16px' }}>Clé du champ (Code API)</th>
                        <th style={{ padding: '12px 16px' }}>Description du champ</th>
                        <th style={{ padding: '12px 16px' }}>Statut de Masquage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {((data?.blur_rules?.candidate) || []).map((rule) => (
                        <tr key={rule.id} style={{ borderBottom: '1px solid #F4F4F5' }}>
                          <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: '700', color: '#1A6FD4' }}>{rule.field_key}</td>
                          <td style={{ padding: '14px 16px', fontWeight: '500', color: '#09090B' }}>{rule.label || rule.field_key}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '6px',
                              backgroundColor: '#FEF3C7', color: '#92400E', padding: '4px 12px', borderRadius: '20px',
                              fontSize: '12px', fontWeight: '700'
                            }}>
                              <EyeOff size={14} />
                              {rule.is_blurred_for_free ? 'Flouté (Masqué)' : 'Visible (Public)'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Profil Entreprises */}
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#9333EA', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                  Champs Entreprises Masqués ({data?.blur_rules?.company?.length || 0})
                </h3>
                <div style={{ border: '1px solid #E4E4E7', borderRadius: '12px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                    <thead style={{ backgroundColor: '#F4F4F5', color: '#52525B', fontWeight: '600', borderBottom: '1px solid #E4E4E7' }}>
                      <tr>
                        <th style={{ padding: '12px 16px' }}>Clé du champ (Code API)</th>
                        <th style={{ padding: '12px 16px' }}>Description du champ</th>
                        <th style={{ padding: '12px 16px' }}>Statut de Masquage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {((data?.blur_rules?.company) || []).map((rule) => (
                        <tr key={rule.id} style={{ borderBottom: '1px solid #F4F4F5' }}>
                          <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: '700', color: '#9333EA' }}>{rule.field_key}</td>
                          <td style={{ padding: '14px 16px', fontWeight: '500', color: '#09090B' }}>{rule.label || rule.field_key}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '6px',
                              backgroundColor: '#FEF3C7', color: '#92400E', padding: '4px 12px', borderRadius: '20px',
                              fontSize: '12px', fontWeight: '700'
                            }}>
                              <EyeOff size={14} />
                              {rule.is_blurred_for_free ? 'Flouté (Masqué)' : 'Visible (Public)'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3 : Forfaits d'Abonnement */}
        {activeTab === 'plans' && (
          <div style={{ backgroundColor: '#FFF', padding: '28px', borderRadius: '16px', border: '1px solid #E4E4E7', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#09090B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={20} color="#1A6FD4" />
                Forfaits d'Abonnement Configurés ({data?.plans?.length || 0})
              </h2>
              <p style={{ fontSize: '14px', color: '#71717A', marginTop: '4px' }}>
                Aperçu de la grille tarifaire et des privilèges débloqués par plan.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {(data?.plans || []).map((plan) => (
                <div key={plan.id} style={{
                  border: '1px solid #E4E4E7', borderRadius: '16px', padding: '20px',
                  backgroundColor: '#FAFAFA', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', backgroundColor: '#DBEAFE', color: '#1E40AF', padding: '4px 10px', borderRadius: '20px' }}>
                        {plan.target_type || 'Tous'}
                      </span>
                      <span style={{ fontSize: '12px', color: '#71717A', fontWeight: '500' }}>
                        {plan.user_subscriptions_count || 0} abonnés
                      </span>
                    </div>

                    <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#09090B', marginTop: '12px' }}>{plan.name || plan.key}</h3>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#1A6FD4', marginTop: '6px' }}>
                      {parseFloat(plan.price || 0).toLocaleString()} FCFA
                      <span style={{ fontSize: '13px', fontWeight: '400', color: '#71717A' }}> / {plan.duration_type || 'mois'}</span>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #E4E4E7', paddingTop: '14px', marginTop: '16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#3F3F46', textTransform: 'uppercase', marginBottom: '8px' }}>Avantages inclus :</div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#52525B' }}>
                      {(plan.features || []).map((feat, idx) => (
                        <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Check size={14} color="#10B981" />
                          <span>{feat.feature_key}: <strong>{feat.value || 'Oui'}</strong></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}

export default SubscriptionControlCenterPage;
