'use client';

import { useState, useRef, useEffect } from 'react';

declare global {
  interface Window {
    Ultraviolet: any;
    __uv$config: any;
  }
}

export default function Home() {
  const [url, setUrl] = useState('https://');
  const [proxiedUrl, setProxiedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    launchProxy(url);
  };

  const launchProxy = async (inputUrl: string) => {
    if (!inputUrl || inputUrl === 'https://') return;

    setIsLoading(true);

    try {
      // 1. Check if Ultraviolet is loaded
      if (!window.__uv$config) {
        throw new Error('Ultraviolet configuration not found. Please refresh the page.');
      }

      // 2. Register service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/uv/sw.js', {
          scope: '/uv/service/',
        });

        // Wait for it to be ready with a timeout
        const swReady = Promise.race([
          navigator.serviceWorker.ready,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Service Worker activation timeout')), 10000))
        ]);

        await swReady;

        let formattedUrl = inputUrl.trim();
        if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
          formattedUrl = 'https://' + formattedUrl;
        }

        const encodedUrl = window.__uv$config.prefix + window.__uv$config.encodeUrl(formattedUrl);
        setProxiedUrl(encodedUrl);
      } else {
        throw new Error('Your browser does not support service workers.');
      }
    } catch (err: any) {
      console.error('Proxy launch failed:', err);
      alert(err.message || 'An error occurred while launching the proxy.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (iframeRef.current) {
      try {
        iframeRef.current.contentWindow?.history.back();
      } catch (e) {
        console.error('Cannot navigate back', e);
      }
    }
  };

  const handleForward = () => {
    if (iframeRef.current) {
      try {
        iframeRef.current.contentWindow?.history.forward();
      } catch (e) {
        console.error('Cannot navigate forward', e);
      }
    }
  };

  const handleReload = () => {
    if (iframeRef.current) {
      try {
        iframeRef.current.contentWindow?.location.reload();
      } catch (e) {
        console.error('Cannot reload', e);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans overflow-hidden">
      {/* Header / Navigation Bar */}
      {!proxiedUrl ? (
        <div className="flex flex-col items-center justify-center flex-grow p-4">
          <div className="w-full max-w-2xl text-center space-y-8">
            <h1 className="text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
              Universal Web Proxy
            </h1>
            <p className="text-gray-400 text-lg">
              どんなサイトでも完璧に見ることができる、超高性能ウェブプロキシ。
            </p>

            <form onSubmit={handleSubmit} className="relative group">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="URLを入力 (例: google.com)"
                className="w-full px-6 py-4 bg-gray-800 border-2 border-gray-700 rounded-full focus:outline-none focus:border-blue-500 transition-all text-lg pr-32 shadow-xl"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="absolute right-2 top-2 bottom-2 px-8 bg-blue-600 hover:bg-blue-500 rounded-full font-bold transition-colors disabled:opacity-50"
              >
                {isLoading ? '起動中...' : 'Go'}
              </button>
            </form>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
              {['google.com', 'youtube.com', 'discord.com', 'reddit.com'].map((site) => (
                <button
                  key={site}
                  onClick={() => {
                    const fullUrl = 'https://' + site;
                    setUrl(fullUrl);
                    launchProxy(fullUrl);
                  }}
                  className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors text-sm"
                >
                  {site}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 p-2 bg-gray-800 border-b border-gray-700">
            <button
              onClick={() => setProxiedUrl(null)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="ホームに戻る"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>

            <div className="flex items-center gap-1 border-l border-gray-700 ml-1 pl-1">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="戻る"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleForward}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="進む"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={handleReload}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="再読み込み"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            <div className="flex-grow relative ml-2">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && launchProxy(url)}
                className="w-full px-4 py-1.5 bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>

            <button
              onClick={() => {
                const win = window.open(iframeRef.current?.src, '_blank');
                win?.focus();
              }}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="新しいタブで開く"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          </div>

          <div className="flex-grow bg-white relative">
            <iframe
              ref={iframeRef}
              src={proxiedUrl}
              className="absolute inset-0 w-full h-full border-none"
              sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts allow-storage-access-by-user-activation"
            />
          </div>
        </>
      )}
    </div>
  );
}
