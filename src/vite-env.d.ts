/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
interface ImportMetaEnv {
  readonly VITE_DEPLOY_TARGET?: 'github' | 'local'
  readonly VITE_PUBLIC_DEMO?: string
  readonly VITE_ALLOW_INTERNAL_DATA?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
  readonly url: string
}
