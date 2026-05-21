/**
 * Wallet store — global state via Zustand + Immer.
 * Credentials are encrypted at rest using react-native-encrypted-storage.
 */
import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import EncryptedStorage from "react-native-encrypted-storage"
import type { StoredCredential } from "@eudi-wallet/core"

const STORAGE_KEY = "eudi_wallet_credentials_v1"

export type CredentialStatus = "valid" | "expired" | "revoked" | "pending"

export interface WalletCredential extends StoredCredential {
  status: CredentialStatus
  lastVerified?: string
  addedAt: string
  pinned: boolean
  // parsed display claims (subset revealed for home screen)
  previewClaims: Record<string, string>
}

export interface WalletSettings {
  biometricEnabled: boolean
  requireBiometricOnOpen: boolean
  requireBiometricOnPresent: boolean
  autoRevocationCheck: boolean
  analyticsEnabled: boolean
  language: string
}

export interface OnboardingState {
  completed: boolean
  step: number
}

interface WalletState {
  // Data
  credentials: WalletCredential[]
  settings: WalletSettings
  onboarding: OnboardingState
  isLoading: boolean
  error: string | null
  // Derived
  pinnedCredentials: WalletCredential[]
  // Actions
  loadFromStorage: () => Promise<void>
  addCredential: (credential: WalletCredential) => Promise<void>
  removeCredential: (id: string) => Promise<void>
  updateCredentialStatus: (id: string, status: CredentialStatus) => Promise<void>
  pinCredential: (id: string, pinned: boolean) => Promise<void>
  updateSettings: (settings: Partial<WalletSettings>) => Promise<void>
  completeOnboarding: () => void
  setOnboardingStep: (step: number) => void
  clearError: () => void
}

const defaultSettings: WalletSettings = {
  biometricEnabled: false,
  requireBiometricOnOpen: true,
  requireBiometricOnPresent: true,
  autoRevocationCheck: true,
  analyticsEnabled: false,
  language: "en",
}

export const useWalletStore = create<WalletState>()(
  immer((set, get) => ({
    credentials: [],
    settings: defaultSettings,
    onboarding: { completed: false, step: 0 },
    isLoading: false,
    error: null,

    get pinnedCredentials() {
      return get().credentials.filter((c) => c.pinned)
    },

    loadFromStorage: async () => {
      set((s) => { s.isLoading = true })
      try {
        const raw = await EncryptedStorage.getItem(STORAGE_KEY)
        if (raw) {
          const { credentials, settings, onboarding } = JSON.parse(raw) as {
            credentials: WalletCredential[]
            settings: WalletSettings
            onboarding: OnboardingState
          }
          set((s) => {
            s.credentials = credentials ?? []
            s.settings = { ...defaultSettings, ...settings }
            s.onboarding = onboarding ?? { completed: false, step: 0 }
          })
        }
      } catch (e) {
        set((s) => { s.error = "Failed to load wallet data" })
      } finally {
        set((s) => { s.isLoading = false })
      }
    },

    addCredential: async (credential) => {
      set((s) => { s.credentials.push(credential) })
      await persist(get())
    },

    removeCredential: async (id) => {
      set((s) => { s.credentials = s.credentials.filter((c) => c.id !== id) })
      await persist(get())
    },

    updateCredentialStatus: async (id, status) => {
      set((s) => {
        const cred = s.credentials.find((c) => c.id === id)
        if (cred) { cred.status = status; cred.lastVerified = new Date().toISOString() }
      })
      await persist(get())
    },

    pinCredential: async (id, pinned) => {
      set((s) => {
        const cred = s.credentials.find((c) => c.id === id)
        if (cred) cred.pinned = pinned
      })
      await persist(get())
    },

    updateSettings: async (updates) => {
      set((s) => { Object.assign(s.settings, updates) })
      await persist(get())
    },

    completeOnboarding: () => set((s) => { s.onboarding.completed = true }),
    setOnboardingStep: (step) => set((s) => { s.onboarding.step = step }),
    clearError: () => set((s) => { s.error = null }),
  }))
)

async function persist(state: WalletState) {
  await EncryptedStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      credentials: state.credentials,
      settings: state.settings,
      onboarding: state.onboarding,
    })
  )
}
