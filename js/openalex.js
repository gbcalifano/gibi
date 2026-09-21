/* Shared OpenAlex fetch helper — timeout, retry, localStorage cache, stale-if-error.
   Classic script (no modules, no build step). Exposes one global: oaFetchJSON.

   oaFetchJSON(url, { timeoutMs, retries, cacheKey, ttlMs })
     → Promise<{ data, stale, fetchedAt }>
   - Fresh cache hit: resolves immediately from localStorage.
   - Otherwise fetches with an AbortController timeout; retries once on
     network error / timeout / 5xx (never on 4xx).
   - If every attempt fails but an expired cache entry exists, resolves
     with it flagged { stale: true } instead of rejecting. */
(function () {
    'use strict';

    function readCache(key) {
        try {
            var raw = localStorage.getItem(key);
            if (!raw) return null;
            var parsed = JSON.parse(raw);
            if (!parsed || typeof parsed.timestamp !== 'number') return null;
            return parsed;
        } catch (e) { return null; }
    }

    function writeCache(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify({ data: data, timestamp: Date.now() }));
        } catch (e) {}
    }

    function fetchWithTimeout(url, timeoutMs) {
        var controller = new AbortController();
        var timer = setTimeout(function () { controller.abort(); }, timeoutMs);
        return fetch(url, { signal: controller.signal }).finally(function () {
            clearTimeout(timer);
        });
    }

    function delay(ms) {
        return new Promise(function (resolve) { setTimeout(resolve, ms); });
    }

    window.oaFetchJSON = async function (url, opts) {
        opts = opts || {};
        var timeoutMs = opts.timeoutMs || 8000;
        var retries = (opts.retries === undefined) ? 1 : opts.retries;
        var ttlMs = opts.ttlMs || 0;
        var cacheKey = opts.cacheKey;

        var cached = cacheKey ? readCache(cacheKey) : null;
        if (cached && ttlMs && Date.now() - cached.timestamp < ttlMs) {
            return { data: cached.data, stale: false, fetchedAt: cached.timestamp };
        }

        var lastError;
        for (var attempt = 0; attempt <= retries; attempt++) {
            try {
                var response = await fetchWithTimeout(url, timeoutMs);
                if (!response.ok) {
                    // 4xx is not transient — do not retry.
                    if (response.status >= 400 && response.status < 500) {
                        throw Object.assign(new Error('HTTP ' + response.status), { permanent: true });
                    }
                    throw new Error('HTTP ' + response.status);
                }
                var data = await response.json();
                if (cacheKey) writeCache(cacheKey, data);
                return { data: data, stale: false, fetchedAt: Date.now() };
            } catch (err) {
                lastError = err;
                if (err && err.permanent) break;
                if (attempt < retries) await delay(1500);
            }
        }

        if (cached) {
            return { data: cached.data, stale: true, fetchedAt: cached.timestamp };
        }
        throw lastError;
    };
})();
