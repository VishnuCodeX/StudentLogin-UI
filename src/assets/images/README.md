# Brand images

Drop the **official Mount Carmel College logo** here and also copy it to the
app's `public/` folder so it can be served directly:

```
New-StudentApplication/public/logo.png      <- official horizontal logo (maroon)
New-StudentApplication/public/logo-white.png <- optional white version for dark/maroon panels
```

The `<Logo />` component (`src/components/Logo.jsx`) automatically uses
`/logo.png` on light surfaces when it is present, and falls back to a built-in
SVG crest recreation when it is not — so the UI always renders correctly.

Recommended export: transparent PNG, height ~80–120px (or an SVG).
