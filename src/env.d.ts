/// <reference types="vite/client" />

// Prism grammar component files don't ship individual type declarations.
// The wildcard covers all lazy grammar imports in CodeBlock.ts.
declare module 'prismjs/components/*'
