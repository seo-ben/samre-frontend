import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import apiClient from '../lib/apiClient';
import { MapPin, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export const SuggestedLocationsPage = () => {
  const [data, setData] = useState({ regions: [], prefectures: [], communes: [], skills: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSuggestedLocations();
  }, []);

  const fetchSuggestedLocations = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get('/v1/admin/suggested-locations');
      const resData = response.data?.data || response.data || {};
      setData({
        regions: Array.isArray(resData.regions) ? resData.regions : [],
        prefectures: Array.isArray(resData.prefectures) ? resData.prefectures : [],
        communes: Array.isArray(resData.communes) ? resData.communes : [],
        skills: Array.isArray(resData.skills) ? resData.skills : [],
      });
    } catch (err) {
      console.error('Erreur chargement localisations suggérées:', err);
      setError('Erreur lors du chargement des localisations suggérées. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const LocationTable = ({ title, items, emptyMessage }) => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col h-full">
      <div className="bg-gray-50 px-5 py-3.5 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-base font-bold text-gray-800">{title}</h2>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
          {items.length}
        </span>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-5 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Nom suggéré
              </th>
              <th className="px-5 py-2.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                Demandes
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan="2" className="px-5 py-10 text-center text-sm text-gray-400 font-medium">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={index} className="hover:bg-blue-50/40 transition-colors">
                  <td className="px-5 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-sm text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-blue-100 text-blue-800">
                      {item.count}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Zones & Éléments suggérés</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                Visualisez les régions, préfectures, communes et compétences saisies manuellement par les candidats.
              </p>
            </div>
          </div>
          <button
            onClick={fetchSuggestedLocations}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            Actualiser
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start gap-3 shadow-sm">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-3" />
            <p className="text-sm font-semibold">Chargement des suggestions...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            <LocationTable 
              title="Régions suggérées" 
              items={data.regions} 
              emptyMessage="Aucune région suggérée" 
            />
            <LocationTable 
              title="Préfectures suggérées" 
              items={data.prefectures} 
              emptyMessage="Aucune préfecture suggérée" 
            />
            <LocationTable 
              title="Communes suggérées" 
              items={data.communes} 
              emptyMessage="Aucune commune suggérée" 
            />
            <LocationTable 
              title="Compétences suggérées" 
              items={data.skills || []} 
              emptyMessage="Aucune compétence suggérée" 
            />
          </div>
        )}
      </div>
    </MainLayout>
  );
};
