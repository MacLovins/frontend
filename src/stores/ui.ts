import { create } from "zustand"

type UiState = {
  serviceId: string
  setServiceId: (serviceId: string) => void
}

export const useUiStore = create<UiState>((set) => ({
  serviceId: "ia",
  setServiceId: (serviceId) => set({ serviceId }),
}))
