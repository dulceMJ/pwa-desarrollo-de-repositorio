module.exports = {
  globDirectory: 'build/',
  globPatterns: ['**/*.{html,js,css,png,ico,json}'],
  swDest: 'build/serviceWorker.js',
  clientsClaim: true,
  skipWaiting: true
};