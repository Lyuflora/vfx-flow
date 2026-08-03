export const GITHUB_REPOSITORY = 'vfx-flow'

export type DeployTarget = 'github' | 'local'

const target: DeployTarget = import.meta.env.VITE_DEPLOY_TARGET === 'github' ? 'github' : 'local'

export const APP_MODE = {
  target,
  publicDemo: import.meta.env.VITE_PUBLIC_DEMO === 'true',
  allowInternalData: import.meta.env.VITE_ALLOW_INTERNAL_DATA === 'true',
  basePath: target === 'github' ? `/${GITHUB_REPOSITORY}/` : '/',
  storageKey: `vfx-flow.${target}.v1`,
} as const

export const isPublicDemo = APP_MODE.publicDemo
