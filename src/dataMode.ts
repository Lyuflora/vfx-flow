// TypeScript checks this public-safe module. Vite swaps the implementation at
// build time: local mode uses the ignored personal seed when it is present,
// while GitHub mode always uses publicData.ts.
export * from './publicData'
