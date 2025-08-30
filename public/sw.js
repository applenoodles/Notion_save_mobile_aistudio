/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Check if this is a share event defined in the manifest.
  if (event.request.method === 'POST' && url.pathname === '/' && url.searchParams.has('share-target')) {
    console.log('Share event detected!');

    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const files = formData.getAll('files'); // 'files' is the name from manifest.webmanifest

          if (files.length > 0) {
            // Find an active client window to send the files to.
            const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
            const client = clients.length > 0 ? clients[0] : null;

            if (client) {
              // Send the files to the client page.
              client.postMessage({ type: 'shared-files', files: files });
            } else {
              console.log('No active client to send shared files to.');
              // As a fallback, you could store files in IndexedDB here.
            }
          }
        } catch (e) {
          console.error('Error handling share event:', e);
        }

        // After handling the share, redirect to the main page to bring the app into focus.
        return Response.redirect('/', 303);
      })()
    );
    return;
  }

  // For all other requests, just fetch from the network as usual.
  event.respondWith(fetch(event.request));
});
