export type RootStackParamList = {
  Onboarding: undefined
  Home: undefined
  CredentialDetail: { credentialId: string }
  Scan: undefined
  Issuance: { offerUri: string }
  Present: { credentialId?: string; requestUri?: string }
  Settings: undefined
}

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
