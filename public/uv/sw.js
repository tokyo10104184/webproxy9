/*global UVServiceWorker,__uv$config*/
importScripts('uv.bundle.js');
importScripts('uv.config.js');
importScripts('uv.sw.js');

const uv = new UVServiceWorker();

self.addEventListener('fetch', (event) => {
    event.respondWith(
        (async function() {
            if (uv.route(event)) {
                return await uv.fetch(event);
            }
            return await fetch(event.request);
        })()
    );
});
