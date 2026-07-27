// Build a texture URL that respects Vite's base path, so assets resolve whether
// the app is served at the domain root or mounted under /solarsystem.
export const textureUrl = (file: string) => `${import.meta.env.BASE_URL}textures/${file}`
