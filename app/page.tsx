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
  const [swStatus, setSwStatus] = useState<'unregistered' | 'registering' | 'ready' | 'error'>('unregistered');
  const [logs, setLogs] = useState<string[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${msg}`]);
  };

  // Check server health and register SW on mount
  useEffect(() => {
    async function initSystem() {
      addLog('システム初期化を開始します...');

      // 1. Check server health
      try {
        addLog('サーバーの状態を確認中 (/api/bare/health)...');
        const res = await fetch('/api/bare/health');
        if (res.ok) {
          addLog('サーバー接続完了');
        } else {
          addLog(`サーバー警告: ステータス ${res.status}`);
        }
      } catch (err: any) {
        addLog(`サーバー接続失敗: ${err.message}`);
      }

      // 2. Register SW
      if ('serviceWorker' in navigator) {
        setSwStatus('registering');
        addLog('Service Workerの登録を開始します...');
        try {
          addLog('Service Workerを登録中...');
          const registration = await navigator.serviceWorker.register('/uv/sw.js', {
            scope: '/uv/service/',
          });

          addLog(`Service Worker登録完了 (Scope: ${registration.scope})`);

          const checkState = () => {
            if (registration.active) {
              addLog('Service Workerがアクティブになりました。');
              setSwStatus('ready');
              return true;
            }
            return false;
          };

          if (!checkState()) {
            addLog('Service Workerのアクティベートを待機中...');
            // Wait for the state to change to active
            const sw = registration.installing || registration.waiting;
            if (sw) {
              sw.addEventListener('statechange', (e: any) => {
                addLog(`Service Worker 状態変更: ${e.target.state}`);
                if (e.target.state === 'activated') {
                  setSwStatus('ready');
                  addLog('システム準備完了。プロキシを利用可能です。');
                }
              });
            }

            // Fallback timeout or interval check
            let attempts = 0;
            const interval = setInterval(() => {
              attempts++;
              if (checkState() || attempts > 20) {
                clearInterval(interval);
                if (attempts > 20) {
                  setSwStatus(current => {
                    if (current !== 'ready') {
                      addLog('待機タイムアウト。続行を試みます...');
                      return 'ready';
                    }
                    return current;
                  });
                }
              }
            }, 500);
          } else {
            addLog('システム準備完了。プロキシを利用可能です。');
          }
        } catch (err: any) {
          addLog(`Service Workerエラー: ${err.message}`);
          setSwStatus('error');
        }
      } else {
        addLog('エラー: お使いのブラウザはService Workerをサポートしていません。');
        setSwStatus('error');
      }
    }
    initSystem();
  }, []);

  const resetSystem = async () => {
    addLog('システムをリセット中...');
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (let reg of regs) {
        await reg.unregister();
      }
      addLog('Service Workerを解除しました。ページを再読み込みします。');
      window.location.reload();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    launchProxy(url);
  };

  const launchProxy = async (inputUrl: string) => {
    if (!inputUrl || inputUrl === 'https://') return;

    setIsLoading(true);
    addLog(`${inputUrl} への接続を準備中...`);

    try {
      // Wait for scripts
      let waitCount = 0;
      addLog('プロキシ設定をチェック中...');
      while (!window.__uv$config && waitCount < 50) {
        await new Promise(r => setTimeout(r, 100));
        waitCount++;
      }

      if (!window.__uv$config) {
        throw new Error('プロキシ設定が読み込まれていません。');
      }

      if (swStatus !== 'ready') {
        throw new Error('システムが準備完了状態ではありません。');
      }

      addLog('URLを変換中...');
      let formattedUrl = inputUrl.trim();
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'https://' + formattedUrl;
      }

      const encodedUrl = window.__uv$config.prefix + window.__uv$config.encodeUrl(formattedUrl);
      addLog('プロキシを起動します。');
      setProxiedUrl(encodedUrl);
    } catch (err: any) {
      addLog(`起動エラー: ${err.message}`);
      alert(err.message || 'エラーが発生しました');
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
                disabled={isLoading || swStatus !== 'ready'}
                className="absolute right-2 top-2 bottom-2 px-8 bg-blue-600 hover:bg-blue-500 rounded-full font-bold transition-colors disabled:opacity-50 min-w-[100px]"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    起動中
                  </span>
                ) : 'Go'}
              </button>
            </form>

            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className={`w-2 h-2 rounded-full ${swStatus === 'ready' ? 'bg-green-500' : swStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`}></div>
                {swStatus === 'ready' ? '準備完了' : '初期化プロセス進行中'}
              </div>

              {/* Log Window */}
              <div className="w-full max-w-lg bg-black/50 border border-gray-700 rounded-lg p-3 text-left font-mono text-[10px] h-32 overflow-y-auto space-y-1">
                {logs.map((log, i) => (
                  <div key={i} className={log.includes('エラー') || log.includes('失敗') ? 'text-red-400' : log.includes('完了') ? 'text-green-400' : 'text-gray-400'}>
                    {log}
                  </div>
                ))}
                {swStatus !== 'ready' && swStatus !== 'error' && (
                  <div className="text-blue-400 animate-pulse">_</div>
                )}
              </div>

              {swStatus === 'error' && (
                <button onClick={resetSystem} className="text-xs text-blue-400 hover:underline">
                  システムをリセットして再起動
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {['google.com', 'youtube.com', 'discord.com', 'reddit.com'].map((site) => (
                <button
                  key={site}
                  onClick={() => {
                    const fullUrl = 'https://' + site;
                    setUrl(fullUrl);
                    launchProxy(fullUrl);
                  }}
                  className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors text-sm disabled:opacity-50"
                  disabled={swStatus !== 'ready'}
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
