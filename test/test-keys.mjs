const ip = '73.222.64.204';

async function test(name, fn) {
    try {
        const r = await fn();
        const s = JSON.stringify(r);
        console.log(r ? '✅' : '❌', name, ':', s.slice(0, 200));
    } catch (e) {
        console.log('❌', name, ':', e.message?.slice(0, 150));
    }
}

(async () => {
    await test('ipgeolocation.io', async () => {
        const r = await fetch(`https://api.ipgeolocation.io/ipgeo?apiKey=a87a5956f4b84873bc8eee9d9bddad89&ip=${ip}`);
        return r.json();
    });

    await test('abstractapi.com', async () => {
        const r = await fetch(`https://ipgeolocation.abstractapi.com/v1/?api_key=07df72bd82f7462abbd8aa502c2292ac&ip_address=${ip}`);
        return r.json();
    });

    await test('ipstack.com', async () => {
        const r = await fetch(`http://api.ipstack.com/${ip}?access_key=ff9707d7528d8a0faa3fe025118ad451`);
        return r.json();
    });
})();
