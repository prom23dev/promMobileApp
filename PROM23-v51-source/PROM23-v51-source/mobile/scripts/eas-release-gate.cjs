// Internal preview is the sole configured build profile. Store profiles fail closed.
if (process.env.EAS_BUILD_PROFILE !== 'preview') require('./check-release.cjs');
