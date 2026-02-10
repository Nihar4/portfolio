const ip = '73.222.64.204';

async function test(name, fn) {
    try {
        const r = await fn();
        const s = JSON.stringify(r);
        console.log('✅', name, ':', s.slice(0, 250));
    } catch (e) {
        console.log('❌', name, ':', e.message?.slice(0, 150));
    }
}

(async () => {
    // 1. ip-api.com (no key)
    await test('ip-api.com', async () => {
        const r = await fetch(`http://ip-api.com/json/${ip}?fields=status,lat,lon,city,regionName,country,timezone,isp,org`);
        return r.json();
    });

    // 2. freeipapi.com (no key)
    await test('freeipapi.com', async () => {
        const r = await fetch(`https://freeipapi.com/api/json/${ip}`);
        return r.json();
    });

    // 3. ipinfo.io (no key)
    await test('ipinfo.io', async () => {
        const r = await fetch(`https://ipinfo.io/${ip}/json`);
        return r.json();
    });

    // 4. ipapi.co (no key)
    await test('ipapi.co', async () => {
        const r = await fetch(`https://ipapi.co/${ip}/json/`, { headers: { 'User-Agent': 'portfolio-app' } });
        return r.json();
    });

    // 5. ipwho.is (no key)
    await test('ipwho.is', async () => {
        const r = await fetch(`https://ipwho.is/${ip}`);
        return r.json();
    });

    // 6. ipgeolocation.io (needs key?)
    await test('ipgeolocation.io', async () => {
        const r = await fetch(`https://api.ipgeolocation.io/ipgeo?ip=${ip}`);
        return { status: r.status, body: await r.json() };
    });

    // 7. abstractapi.com (needs key?)
    await test('abstractapi.com', async () => {
        const r = await fetch(`https://ipgeolocation.abstractapi.com/v1/?ip_address=${ip}`);
        return { status: r.status, body: await r.json() };
    });

    // 8. bigdatacloud.net (no key for basic?)
    await test('bigdatacloud.net', async () => {
        const r = await fetch(`https://api.bigdatacloud.net/data/ip-geolocation?ip=${ip}&localityLanguage=en`);
        return { status: r.status, body: await r.json() };
    });

    // 9. ipwhois.app (no key)
    await test('ipwhois.app', async () => {
        const r = await fetch(`https://ipwhois.app/json/${ip}`);
        return r.json();
    });

    // 10. ipstack.com (needs key?)
    await test('ipstack.com', async () => {
        const r = await fetch(`http://api.ipstack.com/${ip}?access_key=test`);
        return { status: r.status, body: await r.json() };
    });

    // 11. geoapify.com (needs key?)
    await test('geoapify.com', async () => {
        const r = await fetch(`https://api.geoapify.com/v1/ipinfo?ip=${ip}&apiKey=test`);
        return { status: r.status, body: await r.json() };
    });
})();
