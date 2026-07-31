import React, { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import {
  CreditCard,
  EyeOff,
  Unlock,
  TrendingUp,
  Save,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Sliders,
  DollarSign
} from 'lucide-react'

export function SubscriptionControlCenterPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  // States pour la modification des prix de déblocage
  const [candidateCost, setCandidateCost] = useState(1000)
  const [companyCost, setCompanyCost] = useState(1000)
  const [savingSettings, setSavingSettings] = useState(false)
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('')

  const fetchHubData = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token')
      const res = await fetch('https://samreapi.revolutech.pro/api/v1/admin/subscription-control-center', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })
      const result = await res.json()
      if (res.ok && result.success) {
        setData(result.data)
        setCandidateCost(result.data.unlock_settings?.candidate_unlock_cost_cfa || 1000)
        setCompanyCost(result.data.unlock_settings?.company_unlock_cost_cfa || 1000)
      } else {
        setError(result.message || 'Erreur lors du chargement du Hub')
      }
    } catch (err) {
      setError('Erreur de connexion au serveur API.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHubData()
  }, [])

  const handleSaveUnlockCosts = async (e) => {
    e.preventDefault()
    setSavingSettings(true)
    setSaveSuccessMessage('')
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token')
      const res = await fetch('https://samreapi.revolutech.pro/api/v1/admin/subscription-control-center/unlock-settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          candidate_unlock_cost_cfa: parseFloat(candidateCost),
          company_unlock_cost_cfa: parseFloat(companyCost),
        })
      })
      const result = await res.json()
      if (res.ok && result.success) {
        setSaveSuccessMessage('Nouveaux tarifs de déblocage enregistrés avec succès !')
        setTimeout(() => setSaveSuccessMessage(''), 4000)
      } else {
        alert(result.message || 'Erreur lors de la sauvegarde.')
      }
    } catch (err) {
      alert('Erreur lors de la mise à jour des paramètres.')
    } finally {
      setSavingSettings(false)
    }
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sliders className="w-7 h-7 text-indigo-600" />
              Centre de Contrôle des Abonnements & Règles
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Gérez les forfaits, la matrice de floutage des données et les tarifs de déblocage en un seul endroit.
            </p>
          </div>
          <button
            onClick={fetchHubData}
            disabled={loading}
            className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser les données
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Souscriptions Actives</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {loading ? '...' : (data?.stats?.active_subscriptions_count || 0)}
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Revenu Total Généré</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {loading ? '...' : `${(data?.stats?.total_revenue_cfa || 0).toLocaleString()} FCFA`}
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Unlock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Tarif Déblocage Candidat</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {loading ? '...' : `${(candidateCost).toLocaleString()} FCFA`}
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <EyeOff className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Plan le plus Populaire</p>
              <p className="text-lg font-bold text-gray-900 mt-1 truncate">
                {loading ? '...' : (data?.stats?.popular_plan || 'Aucun')}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              1. Déblocage & Tarifs
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'rules'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              2. Matrice de Floutage des Données
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'plans'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              3. Forfaits d'Abonnement
            </button>
          </nav>
        </div>

        {/* Tab 1: Déblocages Unitaires */}
        {activeTab === 'overview' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-indigo-600" />
                Configuration des Tarifs de Déblocage Unitaire (Portefeuille)
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Définissez le coût débité du Portefeuille des utilisateurs pour débloquer un profil individuel sans abonnement.
              </p>
            </div>

            {saveSuccessMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>{saveSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveUnlockCosts} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Déblocage d'un profil Candidat par une Entreprise (FCFA)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={candidateCost}
                    onChange={(e) => setCandidateCost(e.target.value)}
                    className="w-full pl-4 pr-16 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-semibold text-gray-900"
                    placeholder="1000"
                  />
                  <span className="absolute right-4 top-3 text-sm text-gray-500 font-bold">FCFA</span>
                </div>
                <p className="text-xs text-gray-500">
                  Somme débitée du portefeuille entreprise lors de l'action "Débloquer le profil".
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Déblocage d'un profil Entreprise par un Utilisateur (FCFA)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={companyCost}
                    onChange={(e) => setCompanyCost(e.target.value)}
                    className="w-full pl-4 pr-16 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-semibold text-gray-900"
                    placeholder="1000"
                  />
                  <span className="absolute right-4 top-3 text-sm text-gray-500 font-bold">FCFA</span>
                </div>
                <p className="text-xs text-gray-500">
                  Somme débitée pour débloquer les coordonnées d'une entreprise.
                </p>
              </div>

              <div className="md:col-span-2 pt-2">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {savingSettings ? 'Enregistrement...' : 'Enregistrer les Tarifs'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Matrice de Floutage */}
        {activeTab === 'rules' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <EyeOff className="w-5 h-5 text-indigo-600" />
                Règles de Floutage des Données (Comptes Gratuits)
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Liste des champs automatiquement masqués par des astérisques pour les visiteurs ou utilisateurs sans abonnement Premium.
              </p>
            </div>

            <div className="space-y-6">
              {/* Profil Candidats */}
              <div>
                <h3 className="text-sm font-bold uppercase text-indigo-600 tracking-wider mb-3">
                  Données Candidats Floutées
                </h3>
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                      <tr>
                        <th className="p-3">Champ Identifiant (key)</th>
                        <th className="p-3">Libellé</th>
                        <th className="p-3">Masqué pour les comptes gratuits</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(data?.blur_rules?.candidate || []).map((rule) => (
                        <tr key={rule.id} className="hover:bg-gray-50">
                          <td className="p-3 font-mono text-indigo-600 font-bold">{rule.field_key}</td>
                          <td className="p-3 font-medium text-gray-800">{rule.label || rule.field_key}</td>
                          <td className="p-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                              <EyeOff className="w-3.5 h-3.5" />
                              {rule.is_blurred_for_free ? 'Oui (Masqué)' : 'Non (Public)'}
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
                <h3 className="text-sm font-bold uppercase text-purple-600 tracking-wider mb-3">
                  Données Entreprises Floutées
                </h3>
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                      <tr>
                        <th className="p-3">Champ Identifiant (key)</th>
                        <th className="p-3">Libellé</th>
                        <th className="p-3">Masqué pour les comptes gratuits</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(data?.blur_rules?.company || []).map((rule) => (
                        <tr key={rule.id} className="hover:bg-gray-50">
                          <td className="p-3 font-mono text-purple-600 font-bold">{rule.field_key}</td>
                          <td className="p-3 font-medium text-gray-800">{rule.label || rule.field_key}</td>
                          <td className="p-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                              <EyeOff className="w-3.5 h-3.5" />
                              {rule.is_blurred_for_free ? 'Oui (Masqué)' : 'Non (Public)'}
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

        {/* Tab 3: Forfaits */}
        {activeTab === 'plans' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                Offres d'Abonnement Actives ({data?.plans?.length || 0})
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Aperçu des forfaits disponibles pour les utilisateurs avec le nombre de souscriptions enregistrées.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(data?.plans || []).map((plan) => (
                <div key={plan.id} className="border border-gray-200 rounded-2xl p-5 bg-gray-50 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wide bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
                        {plan.target_type || 'Tous'}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">
                        {plan.user_subscriptions_count || 0} abonnés
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mt-3">{plan.name || plan.key}</h3>
                    <p className="text-2xl font-black text-indigo-600 mt-2">
                      {parseFloat(plan.price || 0).toLocaleString()} FCFA
                      <span className="text-xs font-normal text-gray-500"> / {plan.duration_type || 'mois'}</span>
                    </p>
                  </div>

                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-xs font-bold text-gray-700 uppercase mb-2">Avantages inclus :</p>
                    <ul className="space-y-1 text-xs text-gray-600">
                      {(plan.features || []).map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
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
    </AdminLayout>
  )
}

export default SubscriptionControlCenterPage
