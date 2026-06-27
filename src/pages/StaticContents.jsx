import React, { useState, useEffect, useRef } from "react";
import { MainLayout } from "../components/layout/MainLayout";
import apiClient from "../lib/apiClient";
import { Plus, X, Loader2, AlertCircle, Trash2, Edit2, Globe, CheckCircle2, XCircle, Wand2, Upload, Eye, Download, Search } from "lucide-react";

export const StaticContentsPage = () => {
  const [contents, setContents] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const fileInputRef = useRef(null);
  
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };
  
  // Form State
  const [formData, setFormData] = useState({
    key: "",
    section: "general",
    is_active: true,
    translations: {}
  });
  
  const [activeLangTab, setActiveLangTab] = useState(null);
  
  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch both languages and contents
      const [langsRes, contentsRes] = await Promise.all([
        apiClient.get("/v1/admin/cms/dynamic/languages"),
        apiClient.get("/v1/admin/cms/translations")
      ]);
      
      const activeLangs = langsRes.data.data.filter(l => l.is_active);
      setLanguages(activeLangs);
      setContents(contentsRes.data.data);
      
      if (activeLangs.length > 0) {
        setActiveLangTab(activeLangs[0].id);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        key: item.key,
        section: item.section,
        is_active: item.is_active === 1,
        translations: item.translations || {}
      });
    } else {
      setEditingItem(null);
      setFormData({
        key: "",
        section: "general",
        is_active: true,
        translations: {}
      });
    }
    setIsModalOpen(true);
  };

  const handleTranslationChange = (langId, value) => {
    setFormData(prev => ({
      ...prev,
      translations: {
        ...prev.translations,
        [langId]: value
      }
    }));
  };

  const handleAutoTranslate = async () => {
    const sourceLangId = activeLangTab;
    const sourceLang = languages.find(l => l.id === sourceLangId);
    const sourceText = formData.translations[sourceLangId];

    if (!sourceText || !sourceText.trim() || !sourceLang) return;

    setIsTranslating(true);
    let newTranslations = { ...formData.translations };
    
    try {
      for (const lang of languages) {
        if (lang.id === sourceLangId) continue; // Skip source language
        
        // Use Google Translate free endpoint
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang.code.split('-')[0]}&tl=${lang.code.split('-')[0]}&dt=t&q=${encodeURIComponent(sourceText)}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data && data[0]) {
          newTranslations[lang.id] = data[0].map(item => item[0]).join('');
        }
      }
      setFormData({ ...formData, translations: newTranslations });
    } catch (err) {
      console.error("Translation error", err);
      setError("Erreur lors de la traduction automatique.");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    setError(null);
    try {
      const res = await apiClient.post('/v1/admin/cms/translations/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchData(); // reload
      showToast(res.data.message || "Importation réussie");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Erreur lors de l'importation du fichier CSV.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExportCSV = () => {
    try {
      // Prepare headers: key, section, fr, en, pt...
      const headers = ['key', 'section'];
      languages.forEach(lang => {
        headers.push(lang.code.split('-')[0].toLowerCase() || lang.code.toLowerCase());
      });
      
      let csvContent = headers.join(';') + '\n';
      
      // Prepare rows
      contents.forEach(item => {
        const row = [
          item.key,
          item.section || 'general'
        ];
        languages.forEach(lang => {
          let text = item.translations[lang.id] || "";
          // Escape quotes, semicolons and newlines
          if (text.includes(';') || text.includes('"') || text.includes('\n')) {
            text = '"' + text.replace(/"/g, '""') + '"';
          }
          row.push(text);
        });
        csvContent += row.join(';') + '\n';
      });
      
      // Add UTF-8 BOM so Excel opens it with correct accents
      const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
      const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `traductions_samre_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast("Fichier exporté avec succès !");
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'exportation du fichier CSV.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      if (editingItem) {
        await apiClient.put(`/v1/admin/cms/translations/${editingItem.id}`, formData);
      } else {
        await apiClient.post("/v1/admin/cms/translations", formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    setIsSaving(true);
    try {
      await apiClient.delete(`/v1/admin/cms/translations/${itemToDelete.id}`);
      setDeleteModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la suppression");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MainLayout>
      <style>{`
        /* Custom Scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #CBD5E1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94A3B8;
        }
      `}</style>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#0F1923' }}>
            Traductions de l'App (Static)
          </h2>
          <p style={{ margin: '4px 0 0', color: '#8A94A6', fontSize: '14px' }}>
            Gérez les textes de l'interface mobile dans toutes les langues.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Animated Search Bar */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            backgroundColor: isSearchExpanded ? '#F3F4F6' : 'transparent',
            borderRadius: '8px',
            padding: '4px',
            transition: 'all 0.3s ease'
          }}>
            <button
              onClick={() => setIsSearchExpanded(!isSearchExpanded)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6B7280',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px'
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = isSearchExpanded ? 'transparent' : '#F3F4F6'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Search size={20} />
            </button>
            
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: isSearchExpanded ? '250px' : '0px',
                opacity: isSearchExpanded ? 1 : 0,
                padding: isSearchExpanded ? '6px 12px 6px 4px' : '0px',
                border: 'none',
                backgroundColor: 'transparent',
                outline: 'none',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                color: '#374151'
              }}
            />
          </div>

          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            style={{ display: 'none' }} 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              backgroundColor: '#FFF', color: '#374151',
              border: '1px solid #D1D5DB', padding: '10px 20px', borderRadius: '8px',
              fontWeight: '600', cursor: isUploading ? 'not-allowed' : 'pointer', transition: '0.2s',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              opacity: isUploading ? 0.7 : 1
            }}
            onMouseOver={(e) => !isUploading && (e.currentTarget.style.backgroundColor = '#F9FAFB')}
            onMouseOut={(e) => !isUploading && (e.currentTarget.style.backgroundColor = '#FFF')}
          >
            {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
            CSV
          </button>
          
          <button
            onClick={handleExportCSV}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              backgroundColor: '#FFF', color: '#374151',
              border: '1px solid #D1D5DB', padding: '10px 20px', borderRadius: '8px',
              fontWeight: '600', cursor: 'pointer', transition: '0.2s',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#FFF')}
          >
            <Download size={20} />
            CSV
          </button>
          
          <button
            onClick={() => handleOpenModal()}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              backgroundColor: '#FF4500', color: '#FFF',
              border: 'none', padding: '10px 20px', borderRadius: '8px',
              fontWeight: '600', cursor: 'pointer', transition: '0.2s',
              boxShadow: '0 4px 12px rgba(255, 69, 0, 0.2)'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
          >
            <Plus size={20} />
            Nouvelle Clé
          </button>
        </div>
      </div>

      {error && !isModalOpen && (
        <div style={{ padding: '12px 16px', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Loader2 size={32} color="#FF4500" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ width: '100%', overflow: 'auto', borderRadius: '8px', border: '1px solid #E4E4E7', backgroundColor: '#FFF', maxHeight: 'calc(100vh - 200px)' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#FAFAFA', borderBottom: '1px solid #E4E4E7', width: '25%', height: '40px', padding: '0 16px', fontWeight: '500', color: '#71717A', verticalAlign: 'middle' }}>Clé (Key)</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#FAFAFA', borderBottom: '1px solid #E4E4E7', width: '15%', height: '40px', padding: '0 16px', fontWeight: '500', color: '#71717A', verticalAlign: 'middle' }}>Section</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#FAFAFA', borderBottom: '1px solid #E4E4E7', width: '35%', height: '40px', padding: '0 16px', fontWeight: '500', color: '#71717A', verticalAlign: 'middle' }}>Aperçu (FR par défaut)</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#FAFAFA', borderBottom: '1px solid #E4E4E7', width: '10%', height: '40px', padding: '0 16px', fontWeight: '500', color: '#71717A', verticalAlign: 'middle' }}>Statut</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#FAFAFA', borderBottom: '1px solid #E4E4E7', width: '15%', height: '40px', padding: '0 16px', fontWeight: '500', color: '#71717A', verticalAlign: 'middle', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contents.filter(item => {
                if (!searchTerm) return true;
                const lowerTerm = searchTerm.toLowerCase();
                if (item.key.toLowerCase().includes(lowerTerm)) return true;
                if (item.section.toLowerCase().includes(lowerTerm)) return true;
                return Object.values(item.translations).some(t => t && t.toLowerCase().includes(lowerTerm));
              }).length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '32px 16px', textAlign: 'center', color: '#71717A', fontSize: '14px' }}>
                    Aucune traduction trouvée.
                  </td>
                </tr>
              ) : contents.filter(item => {
                if (!searchTerm) return true;
                const lowerTerm = searchTerm.toLowerCase();
                if (item.key.toLowerCase().includes(lowerTerm)) return true;
                if (item.section.toLowerCase().includes(lowerTerm)) return true;
                return Object.values(item.translations).some(t => t && t.toLowerCase().includes(lowerTerm));
              }).map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #E4E4E7', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#F4F4F5'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '12px 16px', verticalAlign: 'middle', fontWeight: '500', color: '#09090B' }}>
                    {item.key}
                  </td>
                  <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: '9999px', border: '1px solid #E4E4E7', backgroundColor: '#FAFAFA', padding: '2px 10px', fontSize: '12px', fontWeight: '600', color: '#18181B' }}>
                      {item.section}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', verticalAlign: 'middle', color: '#71717A' }}>
                    <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.translations[1] || <span style={{ fontStyle: 'italic', color: '#A1A1AA' }}>Non défini</span>}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                    {item.is_active ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#065F46', fontSize: '12px', fontWeight: '500', backgroundColor: '#ECFDF5', padding: '2px 8px', borderRadius: '4px', border: '1px solid #A7F3D0' }}><CheckCircle2 size={12} /> Actif</span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#991B1B', fontSize: '12px', fontWeight: '500', backgroundColor: '#FEF2F2', padding: '2px 8px', borderRadius: '4px', border: '1px solid #FECACA' }}><XCircle size={12} /> Inactif</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                      <button onClick={() => setViewItem(item)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#09090B', cursor: 'pointer', transition: 'background-color 0.2s' }} title="Aperçu" onMouseOver={e => e.currentTarget.style.backgroundColor = '#E4E4E7'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <Eye size={16} />
                      </button>
                      <button onClick={() => handleOpenModal(item)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#09090B', cursor: 'pointer', transition: 'background-color 0.2s' }} title="Modifier" onMouseOver={e => e.currentTarget.style.backgroundColor = '#E4E4E7'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => { setItemToDelete(item); setDeleteModalOpen(true); }} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#EF4444', cursor: 'pointer', transition: 'background-color 0.2s' }} title="Supprimer" onMouseOver={e => e.currentTarget.style.backgroundColor = '#FEE2E2'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- ADD / EDIT MODAL --- */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '16px', width: '90%', maxWidth: '600px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={20} color="#FF4500" />
                {editingItem ? 'Modifier la traduction' : 'Nouvelle traduction'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={24} /></button>
            </div>

            <div className="custom-scrollbar" style={{ padding: '24px', overflowY: 'auto' }}>
              {error && (
                <div style={{ padding: '12px', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Clé unique (Key)</label>
                  <input
                    type="text"
                    value={formData.key}
                    onChange={e => setFormData({...formData, key: e.target.value})}
                    placeholder="ex: auth.login_button"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px', fontFamily: 'monospace' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Section</label>
                  <input
                    type="text"
                    value={formData.section}
                    onChange={e => setFormData({...formData, section: e.target.value})}
                    placeholder="ex: auth"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={e => setFormData({...formData, is_active: e.target.checked})}
                    style={{ width: '16px', height: '16px', accentColor: '#FF4500' }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Activer cette traduction dans l'application</span>
                </label>
              </div>

              {/* Tabs for Languages */}
              <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', overflowX: 'auto' }}>
                  {languages.map(lang => (
                    <button
                      key={lang.id}
                      onClick={(e) => { e.preventDefault(); setActiveLangTab(lang.id); }}
                      style={{
                        padding: '12px 16px',
                        backgroundColor: activeLangTab === lang.id ? '#FFF' : 'transparent',
                        border: 'none',
                        borderBottom: activeLangTab === lang.id ? '2px solid #FF4500' : '2px solid transparent',
                        color: activeLangTab === lang.id ? '#111827' : '#6B7280',
                        fontWeight: activeLangTab === lang.id ? '600' : '500',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {lang.flag_url && <img src={lang.flag_url} alt={lang.code} style={{ width: '16px', height: '12px', borderRadius: '2px' }} />}
                      {lang.name}
                    </button>
                  ))}
                </div>

                <div style={{ padding: '16px' }}>
                  {languages.map(lang => (
                    <div key={lang.id} style={{ display: activeLangTab === lang.id ? 'block' : 'none' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                        Valeur en {lang.name}
                      </label>
                      <textarea
                        value={formData.translations[lang.id] || ""}
                        onChange={(e) => handleTranslationChange(lang.id, e.target.value)}
                        rows={4}
                        placeholder={`Saisissez le texte en ${lang.name}...`}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px', resize: 'vertical' }}
                      />
                      <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={handleAutoTranslate}
                          disabled={isTranslating || !(formData.translations[lang.id]?.trim())}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 12px', borderRadius: '8px', border: 'none',
                            backgroundColor: '#FEF3C7', color: '#D97706', fontSize: '13px', fontWeight: '600',
                            cursor: (isTranslating || !(formData.translations[lang.id]?.trim())) ? 'not-allowed' : 'pointer',
                            opacity: (isTranslating || !(formData.translations[lang.id]?.trim())) ? 0.6 : 1,
                            transition: '0.2s'
                          }}
                        >
                          {isTranslating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                          Traduire pour toutes les autres langues
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: '#F9FAFB', borderRadius: '0 0 16px 16px' }}>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ padding: '10px 16px', backgroundColor: '#FFF', border: '1px solid #D1D5DB', borderRadius: '8px', color: '#374151', fontWeight: '500', cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSaving || !formData.key}
                style={{
                  padding: '10px 20px', backgroundColor: '#FF4500', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: (isSaving || !formData.key) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: (isSaving || !formData.key) ? 0.7 : 1
                }}
              >
                {isSaving && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {deleteModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '16px', width: '90%', maxWidth: '400px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '600', color: '#111827' }}>Confirmer la suppression</h3>
            <p style={{ color: '#4B5563', fontSize: '14px', lineHeight: '1.5', marginBottom: '24px' }}>
              Êtes-vous sûr de vouloir supprimer la clé <strong>{itemToDelete?.key}</strong> ? Cette action est irréversible et supprimera toutes les traductions associées.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setDeleteModalOpen(false)}
                style={{ padding: '8px 16px', backgroundColor: '#FFF', border: '1px solid #D1D5DB', borderRadius: '8px', color: '#374151', fontWeight: '500', cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                disabled={isSaving}
                style={{
                  padding: '8px 16px', backgroundColor: '#DC2626', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- VIEW MODAL --- */}
      {viewItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '16px', width: '90%', maxWidth: '500px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={20} color="#FF4500" />
                Détails de la traduction
              </h3>
              <button onClick={() => setViewItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto' }} className="custom-scrollbar">
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase' }}>Clé unique</span>
                <div style={{ fontSize: '15px', color: '#111827', fontFamily: 'monospace', marginTop: '4px', padding: '10px', backgroundColor: '#F3F4F6', borderRadius: '8px' }}>
                  {viewItem.key}
                </div>
              </div>
              <div style={{ marginBottom: '16px', display: 'flex', gap: '20px' }}>
                <div>
                  <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase' }}>Section</span>
                  <div style={{ marginTop: '4px' }}>
                    <span style={{ backgroundColor: '#E0E7FF', color: '#4338CA', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: '600' }}>
                      {viewItem.section}
                    </span>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase' }}>Statut</span>
                  <div style={{ marginTop: '4px' }}>
                    {viewItem.is_active ? (
                      <span style={{ color: '#059669', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={16} /> Actif</span>
                    ) : (
                      <span style={{ color: '#DC2626', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}><XCircle size={16} /> Inactif</span>
                    )}
                  </div>
                </div>
              </div>

              <h4 style={{ margin: '24px 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #E5E7EB', paddingBottom: '8px' }}>
                Traductions par langue
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {languages.map(lang => (
                  <div key={lang.id} style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                      {lang.flag_url && <img src={lang.flag_url} alt={lang.code} style={{ width: '16px', height: '12px', borderRadius: '2px' }} />}
                      {lang.name}
                    </div>
                    <div style={{ color: '#111827', fontSize: '14px', whiteSpace: 'pre-wrap', backgroundColor: '#F9FAFB', padding: '8px', borderRadius: '6px' }}>
                      {viewItem.translations[lang.id] || <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Non défini</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setViewItem(null)}
                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #D1D5DB', backgroundColor: '#FFF', color: '#374151', fontWeight: '600', cursor: 'pointer' }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

    </MainLayout>
  );
};
