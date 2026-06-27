import React from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Hammer, Sparkles, Clock } from 'lucide-react';

export const ComingSoon = ({ title }) => {
  return (
    <MainLayout>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: 'calc(100vh - 120px)',
        background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)',
        borderRadius: '16px',
        padding: '40px',
        textAlign: 'center',
        border: '1px solid #E4E4E7',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background decorative elements */}
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(236,72,153,0.05) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%' }}></div>
        
        <div style={{ 
          width: '80px', 
          height: '80px', 
          backgroundColor: '#FFF', 
          borderRadius: '20px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          marginBottom: '24px',
          animation: 'bounce 3s infinite ease-in-out'
        }}>
          <Hammer size={40} color="#18181B" />
        </div>
        
        <h2 style={{ fontSize: '32px', fontWeight: '800', color: '#09090B', marginBottom: '16px', letterSpacing: '-0.02em' }}>
          {title}
        </h2>
        
        <p style={{ fontSize: '16px', color: '#71717A', maxWidth: '450px', lineHeight: '1.6', marginBottom: '32px' }}>
          Notre équipe travaille d'arrache-pied pour construire cette fonctionnalité. Elle sera bientôt disponible pour vous offrir une expérience encore plus complète.
        </p>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', backgroundColor: '#FFF', borderRadius: '99px', border: '1px solid #E4E4E7', fontSize: '14px', fontWeight: '500', color: '#18181B', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
            <Sparkles size={16} color="#6366F1" />
            <span>Nouvelle fonctionnalité</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', backgroundColor: '#FFF', borderRadius: '99px', border: '1px solid #E4E4E7', fontSize: '14px', fontWeight: '500', color: '#18181B', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
            <Clock size={16} color="#EC4899" />
            <span>En cours de développement</span>
          </div>
        </div>

      </div>
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </MainLayout>
  );
};
