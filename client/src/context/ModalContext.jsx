import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, X } from 'lucide-react';

const ModalContext = createContext();

export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  });

  const showConfirm = useCallback((title, message, onConfirm, options = {}) => {
    setModalState({
      isOpen: true,
      title,
      message,
      onConfirm,
      onCancel: options.onCancel || null,
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel'
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handleConfirm = useCallback(() => {
    if (modalState.onConfirm) {
      modalState.onConfirm();
    }
    closeModal();
  }, [modalState, closeModal]);

  const handleCancel = useCallback(() => {
    if (modalState.onCancel) {
      modalState.onCancel();
    }
    closeModal();
  }, [modalState, closeModal]);

  return (
    <ModalContext.Provider value={{ showConfirm, closeModal }}>
      {children}
      {modalState.isOpen && createPortal(
        <div className="fixed inset-0 bg-slate-950/60 dark:bg-black/80 backdrop-blur-[12px] flex items-center justify-center z-[9999] p-6 animate-fade-in">
          <div className="w-full max-w-[400px] bg-bg-card border border-border-card rounded-[24px] p-6 shadow-xl animate-scale-up relative overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                <AlertCircle size={24} className="text-brand-primary" />
              </div>
              <div className="flex-1 pt-1">
                <h3 className="font-bold text-lg text-text-main mb-2">{modalState.title}</h3>
                <p className="text-sm text-text-sec leading-relaxed">{modalState.message}</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-border-card">
              <button 
                onClick={handleCancel}
                className="py-2.5 px-5 rounded-[12px] text-xs font-bold text-text-sec border border-border-card hover:bg-bg-base transition-colors cursor-pointer"
              >
                {modalState.cancelText}
              </button>
              <button 
                onClick={handleConfirm}
                className="py-2.5 px-6 rounded-[12px] text-xs font-bold text-white bg-brand-primary hover:bg-brand-hover shadow-md hover:shadow-brand-primary/40 transition-all cursor-pointer"
              >
                {modalState.confirmText}
              </button>
            </div>
            
            <button 
              onClick={handleCancel} 
              className="absolute top-6 right-6 text-text-mut hover:text-text-main transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>,
        document.body
      )}
    </ModalContext.Provider>
  );
};
