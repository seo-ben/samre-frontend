import React from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle2, RefreshCw } from 'lucide-react';

/**
 * Reusable Modern Confirmation Modal for SAMRE Admin Panel
 * Replaces native window.confirm() with a sleek, accessible, styled dialog.
 */
export const ConfirmModal = ({
  isOpen,
  title = 'Confirmation',
  message = 'Êtes-vous sûr de vouloir continuer ?',
  type = 'danger', // 'danger' | 'warning' | 'info' | 'success' | 'primary'
  confirmText,
  cancelText = 'Annuler',
  isLoading = false,
  onConfirm,
  onClose,
  confirmButtonColor,
  icon: CustomIcon
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (type) {
      case 'danger':
        return {
          iconBg: '#FEE2E2',
          iconColor: '#DC2626',
          Icon: CustomIcon || AlertCircle,
          btnBg: confirmButtonColor || '#DC2626',
          btnHover: '#B91C1C',
          btnShadow: 'rgba(220, 38, 38, 0.25)',
          defaultConfirmText: 'Supprimer'
        };
      case 'warning':
        return {
          iconBg: '#FEF3C7',
          iconColor: '#D97706',
          Icon: CustomIcon || AlertTriangle,
          btnBg: confirmButtonColor || '#D97706',
          btnHover: '#B45309',
          btnShadow: 'rgba(217, 119, 6, 0.25)',
          defaultConfirmText: 'Confirmer'
        };
      case 'success':
        return {
          iconBg: '#ECFDF5',
          iconColor: '#059669',
          Icon: CustomIcon || CheckCircle2,
          btnBg: confirmButtonColor || '#059669',
          btnHover: '#047857',
          btnShadow: 'rgba(5, 150, 105, 0.25)',
          defaultConfirmText: 'Valider'
        };
      case 'info':
      case 'primary':
      default:
        return {
          iconBg: '#EFF6FF',
          iconColor: '#1A6FD4',
          Icon: CustomIcon || Info,
          btnBg: confirmButtonColor || '#1A6FD4',
          btnHover: '#1557A6',
          btnShadow: 'rgba(26, 111, 212, 0.25)',
          defaultConfirmText: 'Confirmer'
        };
    }
  };

  const variant = getVariantStyles();
  const IconComponent = variant.Icon;
  const finalConfirmText = confirmText || variant.defaultConfirmText;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px',
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading && onClose) {
          onClose();
        }
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          maxWidth: '440px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          animation: 'scaleIn 0.15s ease-out'
        }}
      >
        <div style={{ padding: '24px 24px 20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: variant.iconBg,
                color: variant.iconColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <IconComponent size={24} />
            </div>
            <div style={{ flex: 1, paddingTop: '2px' }}>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#0F172A',
                  margin: '0 0 8px 0',
                  lineHeight: '1.3'
                }}
              >
                {title}
              </h3>
              <p
                style={{
                  fontSize: '13.5px',
                  color: '#475569',
                  margin: 0,
                  lineHeight: '1.55',
                  wordBreak: 'break-word'
                }}
              >
                {message}
              </p>
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#F8FAFC',
            padding: '14px 24px',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: '9px 16px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#475569',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              padding: '9px 18px',
              backgroundColor: variant.btnBg,
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              color: '#FFFFFF',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: `0 2px 6px ${variant.btnShadow}`,
              transition: 'all 0.15s ease',
              opacity: isLoading ? 0.8 : 1
            }}
          >
            {isLoading && <RefreshCw size={14} className="animate-spin" />}
            <span>{finalConfirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
