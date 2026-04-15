'use client'
import { createContext, useContext, useState, ReactNode } from 'react'

type ModalContextType = {
  alert: (message: string, title?: string) => Promise<void>
  confirm: (message: string, title?: string) => Promise<boolean>
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<any>(null)

  const showAlert = (message: string, title: string = 'แจ้งเตือน') => {
    return new Promise<void>((resolve) => {
      setModal({ type: 'alert', title, message, onConfirm: () => { setModal(null); resolve() } })
    })
  }

  const showConfirm = (message: string, title: string = 'ยืนยันการทำรายการ') => {
    return new Promise<boolean>((resolve) => {
      setModal({ 
        type: 'confirm', title, message, 
        onConfirm: () => { setModal(null); resolve(true) },
        onCancel: () => { setModal(null); resolve(false) }
      })
    })
  }

  return (
    <ModalContext.Provider value={{ alert: showAlert, confirm: showConfirm }}>
      {children}
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-fade-in delay-0 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl transition-transform animate-scale-in">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{modal.title}</h3>
              <p className="text-gray-600 text-sm whitespace-pre-wrap">{modal.message}</p>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              {modal.type === 'confirm' && (
                <button onClick={modal.onCancel} className="btn-secondary py-2 px-4 text-sm bg-white hover:bg-gray-50">
                  ยกเลิก
                </button>
              )}
              <button 
                onClick={modal.onConfirm} 
                className={`text-sm py-2 px-5 rounded-xl font-semibold shadow-sm transition-all focus:ring-2 focus:ring-offset-2 ${modal.type === 'confirm' ? 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500' : 'bg-ev7-500 hover:bg-ev7-600 text-white focus:ring-ev7-500'}`}
              >
                {modal.type === 'confirm' ? 'ยืนยันลบ' : 'ตกลง'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  )
}

export const useModal = () => {
  const context = useContext(ModalContext)
  if (!context) throw new Error('useModal must be used within ModalProvider')
  return context
}
