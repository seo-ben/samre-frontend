import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import apiClient from '../lib/apiClient';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';

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
      const response = await apiClient.get('/admin/suggested-locations');
      if (response.data.status === 'success') {
        setData(response.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Erreur lors du chargement des localisations suggérées.');
    } finally {
      setLoading(false);
    }
  };

  const LocationTable = ({ title, items, emptyMessage }) => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nom suggéré
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre de demandes
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.length === 0 ? (
              <tr>
                <td colSpan="2" className="px-6 py-8 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {item.count} suggestion{item.count > 1 ? 's' : ''}
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
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Zones & Éléments suggérés</h1>
              <p className="text-gray-500 mt-1">
                Visualisez les régions, préfectures, communes et compétences saisies manuellement par les candidats.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
            <p>Chargement des suggestions...</p>
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
