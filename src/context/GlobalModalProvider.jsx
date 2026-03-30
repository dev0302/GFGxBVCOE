import { createContext, useContext, useMemo, useState } from "react";

const GlobalModalContext = createContext(null);

export function GlobalModalProvider({ children }) {
  const [activeModal, setActiveModal] = useState(null);

  const value = useMemo(
    () => ({
      activeModal,
      openModal: setActiveModal,
      closeModal: () => setActiveModal(null),
    }),
    [activeModal]
  );

  return <GlobalModalContext.Provider value={value}>{children}</GlobalModalContext.Provider>;
}

export function useGlobalModal() {
  const ctx = useContext(GlobalModalContext);
  if (!ctx) throw new Error("useGlobalModal must be used within GlobalModalProvider");
  return ctx;
}

