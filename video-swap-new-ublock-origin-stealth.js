twitch-videoad.js text/javascript
(function() {
    if ( /(^|\.)twitch\.tv$/.test(document.location.hostname) === false ) { return; }
    
    // Stealth Mode Enhancements
    var stealthConfig = {
        // Randomize timing to avoid pattern detection
        randomDelay: () => Math.floor(Math.random() * 100) + 50,
        // Obfuscate function names and variables
        obfuscatedNames: {
            version: '_v' + Math.random().toString(36).substr(2, 5),
            workers: '_w' + Math.random().toString(36).substr(2, 5),
            streamInfo: '_si' + Math.random().toString(36).substr(2, 5)
        },
        // Hide console logs in production
        debugMode: false,
        // Mimic legitimate user behavior
        userBehaviorSimulation: true
    };
    
    // Enhanced console logging that can be disabled
    function stealthLog(...args) {
        if (stealthConfig.debugMode) {
            console.log(...args);
        }
    }
    
    var ourTwitchAdSolutionsVersion = 2;
    var versionKey = stealthConfig.obfuscatedNames.version;
    
    if (window[versionKey] && window[versionKey] >= ourTwitchAdSolutionsVersion) {
        stealthLog("skipping video-swap-new as there's another script active. ourVersion:" + ourTwitchAdSolutionsVersion + " activeVersion:" + window[versionKey]);
        window[versionKey] = ourTwitchAdSolutionsVersion;
        return;
    }
    window[versionKey] = ourTwitchAdSolutionsVersion;
    
    function declareOptions(scope) {
        // Options / globals with obfuscated names
        scope.OPT_MODE_STRIP_AD_SEGMENTS = true;
        scope.OPT_MODE_NOTIFY_ADS_WATCHED = true;
        scope.OPT_MODE_NOTIFY_ADS_WATCHED_MIN_REQUESTS = false;
        scope.OPT_BACKUP_PLAYER_TYPE = 'autoplay';
        scope.OPT_BACKUP_PLATFORM = 'ios';
        scope.OPT_REGULAR_PLAYER_TYPE = 'site';
        scope.OPT_ACCESS_TOKEN_PLAYER_TYPE = null;
        scope.OPT_SHOW_AD_BANNER = false; // Hide banner for stealth
        scope.AD_SIGNIFIER = 'stitched-ad';
        scope.LIVE_SIGNIFIER = ',live';
        scope.CLIENT_ID = 'kimne78kx3ncx6brgo4mv6wki5h1ko';
        // Obfuscated variable names
        scope[stealthConfig.obfuscatedNames.streamInfo] = [];
        scope.StreamInfosByUrl = [];
        scope.CurrentChannelNameFromM3U8 = null;
        scope.gql_device_id = null;
        scope.ClientIntegrityHeader = null;
        scope.AuthorizationHeader = null;
    }
    
    var twitchWorkers = [];
    var workerStringConflicts = [
        'twitch',
        'isVariantA'// TwitchNoSub
    ];
    var workerStringAllow = [];
    var workerStringReinsert = [
        'isVariantA',// TwitchNoSub (prior to (0.9))
        'besuper/',// TwitchNoSub (0.9)
        '${patch_url}'// TwitchNoSub (0.9.1)
    ];
    
    // Enhanced worker detection evasion
    function getCleanWorker(worker) {
        var root = null;
        var parent = null;
        var proto = worker;
        while (proto) {
            var workerString = proto.toString();
            // Add stealth delay to avoid detection
            setTimeout(() => {}, stealthConfig.randomDelay());
            
            if (workerStringConflicts.some((x) => workerString.includes(x)) && !workerStringAllow.some((x) => workerString.includes(x))) {
                if (parent !== null) {
                    Object.setPrototypeOf(parent, Object.getPrototypeOf(proto));
                }
            } else {
                if (root === null) {
                    root = proto;
                }
                parent = proto;
            }
            proto = Object.getPrototypeOf(proto);
        }
        return root;
    }
    
    function getWorkersForReinsert(worker) {
        var result = [];
        var proto = worker;
        while (proto) {
            var workerString = proto.toString();
            if (workerStringReinsert.some((x) => workerString.includes(x))) {
                result.push(proto);
            }
            proto = Object.getPrototypeOf(proto);
        }
        return result;
    }
    
    function reinsertWorkers(worker, reinsert) {
        var parent = worker;
        for (var i = 0; i < reinsert.length; i++) {
            Object.setPrototypeOf(reinsert[i], parent);
            parent = reinsert[i];
        }
        return parent;
    }
    
    function isValidWorker(worker) {
        var workerString = worker.toString();
        return !workerStringConflicts.some((x) => workerString.includes(x))
            || workerStringAllow.some((x) => workerString.includes(x))
            || workerStringReinsert.some((x) => workerString.includes(x));
    }
    
    // Enhanced stealth worker hooking
    function hookWindowWorker() {
        var reinsert = getWorkersForReinsert(window.Worker);
        var newWorker = class Worker extends getCleanWorker(window.Worker) {
            constructor(twitchBlobUrl, options) {
                var isTwitchWorker = false;
                try {
                    isTwitchWorker = new URL(twitchBlobUrl).origin.endsWith('.twitch.tv');
                } catch {}
                if (!isTwitchWorker) {
                    super(twitchBlobUrl, options);
                    return;
                }
                
                // Stealth: Add random delay before processing
                setTimeout(() => {
                    var newBlobStr = `
                        ${processM3U8.toString()}
                        ${hookWorkerFetch.toString()}
                        ${declareOptions.toString()}
                        ${getAccessToken.toString()}
                        ${gqlRequest.toString()}
                        ${makeGraphQlPacket.toString()}
                        ${tryNotifyAdsWatchedM3U8.toString()}
                        ${parseAttributes.toString()}
                        ${onFoundAd.toString()}
                        ${getWasmWorkerJs.toString()}
                        var workerString = getWasmWorkerJs('${twitchBlobUrl.replaceAll("'", "%27")}');
                        declareOptions(self);
                        self.addEventListener('message', function(e) {
                            if (e.data.key == 'UboUpdateDeviceId') {
                                gql_device_id = e.data.value;
                            } else if (e.data.key == 'UpdateClientIntegrityHeader') {
                                ClientIntegrityHeader = e.data.value;
                            } else if (e.data.key == 'UpdateAuthorizationHeader') {
                                AuthorizationHeader = e.data.value;
                            }
                        });
                        hookWorkerFetch();
                        eval(workerString);
                    `;
                }, stealthConfig.randomDelay());
                
                super(URL.createObjectURL(new Blob([newBlobStr])), options);
                twitchWorkers.push(this);
                
                this.addEventListener('message', (e) => {
                    // Stealth: Minimal UI changes to avoid detection
                    if (e.data.key == 'UboShowAdBanner') {
                        // Only show banner if explicitly enabled and in debug mode
                        if (stealthConfig.debugMode && OPT_SHOW_AD_BANNER) {
                            var adDiv = getAdDiv();
                            if (adDiv != null) {
                                adDiv.P.textContent = 'Processing' + (e.data.isMidroll ? ' content' : '');
                                adDiv.style.display = 'block';
                            }
                        }
                    } else if (e.data.key == 'UboHideAdBanner') {
                        var adDiv = getAdDiv();
                        if (adDiv != null) {
                            adDiv.style.display = 'none';
                        }
                    } else if (e.data.key == 'UboChannelNameM3U8Changed') {
                        // Silent operation
                    } else if (e.data.key == 'UboReloadPlayer') {
                        // Add random delay to mimic user behavior
                        setTimeout(() => {
                            reloadTwitchPlayer();
                        }, stealthConfig.randomDelay());
                    } else if (e.data.key == 'UboPauseResumePlayer') {
                        setTimeout(() => {
                            reloadTwitchPlayer(false, true);
                        }, stealthConfig.randomDelay());
                    } else if (e.data.key == 'UboSeekPlayer') {
                        setTimeout(() => {
                            reloadTwitchPlayer(true);
                        }, stealthConfig.randomDelay());
                    }
                });
                
                function getAdDiv() {
                    var playerRootDiv = document.querySelector('.video-player');
                    var adDiv = null;
                    if (playerRootDiv != null) {
                        // Use more generic class name to avoid detection
                        adDiv = playerRootDiv.querySelector('.content-overlay');
                        if (adDiv == null && stealthConfig.debugMode) {
                            adDiv = document.createElement('div');
                            adDiv.className = 'content-overlay';
                            adDiv.innerHTML = '<div class="player-notice" style="color: white; background-color: rgba(0, 0, 0, 0.6); position: absolute; top: 0px; left: 0px; padding: 3px; font-size: 12px;"><p></p></div>';
                            adDiv.style.display = 'none';
                            adDiv.P = adDiv.querySelector('p');
                            playerRootDiv.appendChild(adDiv);
                        }
                    }
                    return adDiv;
                }
            }
        }
        
        var workerInstance = reinsertWorkers(newWorker, reinsert);
        Object.defineProperty(window, 'Worker', {
            get: function() {
                return workerInstance;
            },
            set: function(value) {
                if (isValidWorker(value)) {
                    workerInstance = value;
                } else {
                    // Silent denial instead of logging
                    if (stealthConfig.debugMode) {
                        stealthLog('Attempt to set twitch worker denied');
                    }
                }
            }
        });
    }
    
    function getWasmWorkerJs(twitchBlobUrl) {
        var req = new XMLHttpRequest();
        req.open('GET', twitchBlobUrl, false);
        req.overrideMimeType("text/javascript");
        req.send();
        return req.responseText;
    }
    
    function onFoundAd(streamInfo, textStr, reloadPlayer) {
        stealthLog('Found ads, switching to backup stream');
        streamInfo.UseBackupStream = true;
        streamInfo.IsMidroll = textStr.includes('"MIDROLL"') || textStr.includes('"midroll"');
        
        // Add random delay to mimic natural behavior
        if (reloadPlayer) {
            setTimeout(() => {
                postMessage({key:'UboReloadPlayer'});
            }, stealthConfig.randomDelay());
        }
        
        // Only show banner in debug mode
        if (stealthConfig.debugMode) {
            postMessage({key:'UboShowAdBanner',isMidroll:streamInfo.IsMidroll});
        }
    }
    
    async function processM3U8(url, textStr, realFetch) {
        var streamInfo = StreamInfosByUrl[url];
        if (streamInfo == null) {
            stealthLog('Unknown stream url ' + url);
            return textStr;
        }
        if (!OPT_MODE_STRIP_AD_SEGMENTS) {
            return textStr;
        }
        
        var haveAdTags = textStr.includes(AD_SIGNIFIER);
        if (streamInfo.UseBackupStream) {
            if (streamInfo.Encodings == null) {
                stealthLog('Found backup stream but not main stream?');
                streamInfo.UseBackupStream = false;
                setTimeout(() => {
                    postMessage({key:'UboReloadPlayer'});
                }, stealthConfig.randomDelay());
                return '';
            } else {
                var streamM3u8Url = streamInfo.Encodings.match(/^https:.*\.m3u8$/m)[0];
                var streamM3u8Response = await realFetch(streamM3u8Url);
                if (streamM3u8Response.status == 200) {
                    var streamM3u8 = await streamM3u8Response.text();
                    if (streamM3u8 != null) {
                        if (!streamM3u8.includes(AD_SIGNIFIER)) {
                            stealthLog('No more ads on main stream. Switching back...');
                            streamInfo.UseBackupStream = false;
                            postMessage({key:'UboHideAdBanner'});
                            setTimeout(() => {
                                postMessage({key:'UboReloadPlayer'});
                            }, stealthConfig.randomDelay());
                        } else if (!streamM3u8.includes('"MIDROLL"') && !streamM3u8.includes('"midroll"')) {
                            var lines = streamM3u8.replace('\r', '').split('\n');
                            for (var i = 0; i < lines.length; i++) {
                                var line = lines[i];
                                if (line.startsWith('#EXTINF') && lines.length > i + 1) {
                                    if (!line.includes(LIVE_SIGNIFIER) && !streamInfo.RequestedAds.has(lines[i + 1])) {
                                        // Stealth: Add random delay between requests
                                        setTimeout(() => {
                                            streamInfo.RequestedAds.add(lines[i + 1]);
                                            fetch(lines[i + 1]).then((response)=>{response.blob()});
                                        }, stealthConfig.randomDelay());
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } else if (haveAdTags) {
            onFoundAd(streamInfo, textStr, true);
        } else {
            postMessage({key:'UboHideAdBanner'});
        }
        
        if (haveAdTags && streamInfo.BackupEncodings != null) {
            var streamM3u8Url = streamInfo.BackupEncodings.match(/^https:.*\.m3u8.*$/m)[0];
            var streamM3u8Response = await realFetch(streamM3u8Url);
            if (streamM3u8Response.status == 200) {
                textStr = await streamM3u8Response.text();
            }
        }
        return textStr;
    }
    
    function hookWorkerFetch() {
        stealthLog('hookWorkerFetch (stealth-mode)');
        var realFetch = fetch;
        fetch = async function(url, options) {
            if (typeof url === 'string') {
                url = url.trimEnd();
                if (url.endsWith('m3u8')) {
                    return new Promise(function(resolve, reject) {
                        var processAfter = async function(response) {
                            // Add random delay to avoid pattern detection
                            setTimeout(async () => {
                                var str = await processM3U8(url, await response.text(), realFetch);
                                resolve(new Response(str, {
                                    status: response.status,
                                    statusText: response.statusText,
                                    headers: response.headers
                                }));
                            }, stealthConfig.randomDelay());
                        };
                        var send = function() {
                            return realFetch(url, options).then(function(response) {
                                processAfter(response);
                            })['catch'](function(err) {
                                stealthLog('fetch hook err ' + err);
                                reject(err);
                            });
                        };
                        send();
                    });
                }
                else if (url.includes('/api/channel/hls/') && !url.includes('picture-by-picture')) {
                    var channelName = (new URL(url)).pathname.match(/([^\/]+)(?=\.\w+$)/)[0];
                    if (CurrentChannelNameFromM3U8 != channelName) {
                        postMessage({
                            key: 'UboChannelNameM3U8Changed',
                            value: channelName
                        });
                    }
                    CurrentChannelNameFromM3U8 = channelName;
                    if (OPT_MODE_STRIP_AD_SEGMENTS) {
                        return new Promise(async function(resolve, reject) {
                            var streamInfo = StreamInfos[channelName];
                            if (streamInfo != null && streamInfo.Encodings != null && (await realFetch(streamInfo.Encodings.match(/^https:.*\.m3u8$/m)[0])).status !== 200) {
                                streamInfo = null;
                            }
                            if (streamInfo == null || streamInfo.Encodings == null || streamInfo.BackupEncodings == null) {
                                StreamInfos[channelName] = streamInfo = {
                                    RequestedAds: new Set(),
                                    Encodings: null,
                                    BackupEncodings: null,
                                    IsMidroll: false,
                                    UseBackupStream: false,
                                    ChannelName: channelName
                                };
                                for (var i = 0; i < 2; i++) {
                                    var encodingsUrl = url;
                                    if (i == 1) {
                                        var accessTokenResponse = await getAccessToken(channelName, OPT_BACKUP_PLAYER_TYPE, OPT_BACKUP_PLATFORM, realFetch);
                                        if (accessTokenResponse != null && accessTokenResponse.status === 200) {
                                            var accessToken = await accessTokenResponse.json();
                                            var urlInfo = new URL('https://usher.ttvnw.net/api/channel/hls/' + channelName + '.m3u8' + (new URL(url)).search);
                                            urlInfo.searchParams.set('sig', accessToken.data.streamPlaybackAccessToken.signature);
                                            urlInfo.searchParams.set('token', accessToken.data.streamPlaybackAccessToken.value);
                                            encodingsUrl = urlInfo.href;
                                        } else {
                                            resolve(accessTokenResponse);
                                            return;
                                        }
                                    }
                                    // Add stealth delay between requests
                                    await new Promise(resolve => setTimeout(resolve, stealthConfig.randomDelay()));
                                    
                                    var encodingsM3u8Response = await realFetch(encodingsUrl, options);
                                    if (encodingsM3u8Response != null && encodingsM3u8Response.status === 200) {
                                        var encodingsM3u8 = await encodingsM3u8Response.text();
                                        if (i == 0) {
                                            streamInfo.Encodings = encodingsM3u8;
                                            var streamM3u8Url = encodingsM3u8.match(/^https:.*\.m3u8$/m)[0];
                                            var streamM3u8Response = await realFetch(streamM3u8Url);
                                            if (streamM3u8Response.status == 200) {
                                                var streamM3u8 = await streamM3u8Response.text();
                                                if (streamM3u8.includes(AD_SIGNIFIER)) {
                                                    onFoundAd(streamInfo, streamM3u8, false);
                                                }
                                            } else {
                                                resolve(streamM3u8Response);
                                                return;
                                            }
                                        } else {
                                            var lowResLines = encodingsM3u8.replace('\r', '').split('\n');
                                            var lowResBestUrl = null;
                                            for (var j = 0; j < lowResLines.length; j++) {
                                                if (lowResLines[j].startsWith('#EXT-X-STREAM-INF')) {
                                                    var res = parseAttributes(lowResLines[j])['RESOLUTION'];
                                                    if (res && lowResLines[j + 1].endsWith('.m3u8')) {
                                                        lowResBestUrl = lowResLines[j + 1];
                                                        break;
                                                    }
                                                }
                                            }
                                            if (lowResBestUrl != null && streamInfo.Encodings != null) {
                                                var normalEncodingsM3u8 = streamInfo.Encodings;
                                                var normalLines = normalEncodingsM3u8.replace('\r', '').split('\n');
                                                for (var j = 0; j < normalLines.length - 1; j++) {
                                                    if (normalLines[j].startsWith('#EXT-X-STREAM-INF')) {
                                                        var res = parseAttributes(normalLines[j])['RESOLUTION'];
                                                        if (res) {
                                                            lowResBestUrl += ' ';
                                                            normalLines[j + 1] = lowResBestUrl;
                                                        }
                                                    }
                                                }
                                                encodingsM3u8 = normalLines.join('\r\n');
                                            }
                                            streamInfo.BackupEncodings = encodingsM3u8;
                                        }
                                        var lines = encodingsM3u8.replace('\r', '').split('\n');
                                        for (var j = 0; j < lines.length; j++) {
                                            if (!lines[j].startsWith('#') && lines[j].includes('.m3u8')) {
                                                StreamInfosByUrl[lines[j].trimEnd()] = streamInfo;
                                            }
                                        }
                                    } else {
                                        resolve(encodingsM3u8Response);
                                        return;
                                    }
                                }
                            }
                            if (streamInfo.UseBackupStream) {
                                resolve(new Response(streamInfo.BackupEncodings));
                            } else {
                                resolve(new Response(streamInfo.Encodings));
                            }
                        });
                    }
                }
            }
            return realFetch.apply(this, arguments);
        }
    }
    
    function makeGraphQlPacket(event, radToken, payload) {
        return [{
            operationName: 'ClientSideAdEventHandling_RecordAdEvent',
            variables: {
                input: {
                    eventName: event,
                    eventPayload: JSON.stringify(payload),
                    radToken,
                },
            },
            extensions: {
                persistedQuery: {
                    version: 1,
                    sha256Hash: '7e6c69e6eb59f8ccb97ab73686f3d8b7d85a72a0298745ccd8bfc68e4054ca5b',
                },
            },
        }];
    }
    
    function getAccessToken(channelName, playerType, platform, realFetch) {
        if (!platform) {
            platform = 'web';
        }
        var body = null;
        var templateQuery = 'query PlaybackAccessToken_Template($login: String!, $isLive: Boolean!, $vodID: ID!, $isVod: Boolean!, $playerType: String!) {  streamPlaybackAccessToken(channelName: $login, params: {platform: "' + platform + '", playerBackend: "mediaplayer", playerType: $playerType}) @include(if: $isLive) {    value    signature    __typename  }  videoPlaybackAccessToken(id: $vodID, params: {platform: "' + platform + '", playerBackend: "mediaplayer", playerType: $playerType}) @include(if: $isVod) {    value    signature    __typename  }}';
        body = {
            operationName: 'PlaybackAccessToken_Template',
            query: templateQuery,
            variables: {
                'isLive': true,
                'login': channelName,
                'isVod': false,
                'vodID': '',
                'playerType': playerType
            }
        };
        return gqlRequest(body, realFetch);
    }
    
    function gqlRequest(body, realFetch) {
        if (ClientIntegrityHeader == null) {
            // Silent operation in stealth mode
        }
        var fetchFunc = realFetch ? realFetch : fetch;
        return fetchFunc('https://gql.twitch.tv/gql', {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Client-Id': CLIENT_ID,
                'Client-Integrity': ClientIntegrityHeader,
                'X-Device-Id': gql_device_id,
                'Authorization': AuthorizationHeader
            }
        });
    }
    
    function parseAttributes(str) {
        return Object.fromEntries(
            str.split(/(?:^|,)((?:[^=]*)=(?:"[^"]*"|[^,]*))/)
                .filter(Boolean)
                .map(x => {
                    const idx = x.indexOf('=');
                    const key = x.substring(0, idx);
                    const value = x.substring(idx +1);
                    const num = Number(value);
                    return [key, Number.isNaN(num) ? value.startsWith('"') ? JSON.parse(value) : value : num]
                }));
    }
    
    // Enhanced stealth ad notification with randomized timing
    async function tryNotifyAdsWatchedM3U8(streamM3u8) {
        try {
            if (!streamM3u8 || !streamM3u8.includes(AD_SIGNIFIER)) {
                return 1;
            }
            var matches = streamM3u8.match(/#EXT-X-DATERANGE:(ID="stitched-ad-[^\n]+)\n/);
            if (matches.length > 1) {
                const attrString = matches[1];
                const attr = parseAttributes(attrString);
                var podLength = parseInt(attr['X-TV-TWITCH-AD-POD-LENGTH'] ? attr['X-TV-TWITCH-AD-POD-LENGTH'] : '1');
                var podPosition = parseInt(attr['X-TV-TWITCH-AD-POD-POSITION'] ? attr['X-TV-TWITCH-AD-POD-POSITION'] : '0');
                var radToken = attr['X-TV-TWITCH-AD-RADS-TOKEN'];
                var lineItemId = attr['X-TV-TWITCH-AD-LINE-ITEM-ID'];
                var orderId = attr['X-TV-TWITCH-AD-ORDER-ID'];
                var creativeId = attr['X-TV-TWITCH-AD-CREATIVE-ID'];
                var adId = attr['X-TV-TWITCH-AD-ADVERTISER-ID'];
                var rollType = attr['X-TV-TWITCH-AD-ROLL-TYPE'].toLowerCase();
                
                const baseData = {
                    stitched: true,
                    roll_type: rollType,
                    player_mute: false,
                    player_volume: 0.5,
                    visible: true,
                };
                
                for (let podPosition = 0; podPosition < podLength; podPosition++) {
                    // Add random delays to mimic human behavior
                    await new Promise(resolve => setTimeout(resolve, stealthConfig.randomDelay() * 10));
                    
                    if (OPT_MODE_NOTIFY_ADS_WATCHED_MIN_REQUESTS) {
                        await gqlRequest(makeGraphQlPacket('video_ad_pod_complete', radToken, baseData));
                    } else {
                        const extendedData = {
                            ...baseData,
                            ad_id: adId,
                            ad_position: podPosition,
                            duration: 30,
                            creative_id: creativeId,
                            total_ads: podLength,
                            order_id: orderId,
                            line_item_id: lineItemId,
                        };
                        
                        await gqlRequest(makeGraphQlPacket('video_ad_impression', radToken, extendedData));
                        
                        for (let quartile = 0; quartile < 4; quartile++) {
                            // Random delay between quartiles
                            await new Promise(resolve => setTimeout(resolve, stealthConfig.randomDelay() * 5));
                            await gqlRequest(
                                makeGraphQlPacket('video_ad_quartile_complete', radToken, {
                                    ...extendedData,
                                    quartile: quartile + 1,
                                })
                            );
                        }
                        await gqlRequest(makeGraphQlPacket('video_ad_pod_complete', radToken, baseData));
                    }
                }
            }
            return 0;
        } catch (err) {
            stealthLog(err);
            return 0;
        }
    }
    
    function postTwitchWorkerMessage(key, value) {
        twitchWorkers.forEach((worker) => {
            // Add random delay to avoid pattern detection
            setTimeout(() => {
                worker.postMessage({key: key, value: value});
            }, stealthConfig.randomDelay());
        });
    }
    
    // Enhanced stealth fetch hooking
    function hookFetch() {
        var realFetch = window.fetch;
        window.fetch = function(url, init, ...args) {
            if (typeof url === 'string') {
                if (url.includes('gql')) {
                    var deviceId = init.headers['X-Device-Id'];
                    if (typeof deviceId !== 'string') {
                        deviceId = init.headers['Device-ID'];
                    }
                    if (typeof deviceId === 'string') {
                        gql_device_id = deviceId;
                    }
                    if (gql_device_id) {
                        postTwitchWorkerMessage('UboUpdateDeviceId', gql_device_id);
                    }
                    if (typeof init.body === 'string' && init.body.includes('PlaybackAccessToken')) {
                        if (OPT_ACCESS_TOKEN_PLAYER_TYPE) {
                            const newBody = JSON.parse(init.body);
                            if (Array.isArray(newBody)) {
                                for (let i = 0; i < newBody.length; i++) {
                                    newBody[i].variables.playerType = OPT_ACCESS_TOKEN_PLAYER_TYPE;
                                }
                            } else {
                                newBody.variables.playerType = OPT_ACCESS_TOKEN_PLAYER_TYPE;
                            }
                            init.body = JSON.stringify(newBody);
                        }
                        if (typeof init.headers['Client-Integrity'] === 'string') {
                            ClientIntegrityHeader = init.headers['Client-Integrity'];
                            if (ClientIntegrityHeader) {
                                postTwitchWorkerMessage('UpdateClientIntegrityHeader', init.headers['Client-Integrity']);
                            }
                        }
                        if (typeof init.headers['Authorization'] === 'string') {
                            AuthorizationHeader = init.headers['Authorization'];
                            if (AuthorizationHeader) {
                                postTwitchWorkerMessage('UpdateAuthorizationHeader', init.headers['Authorization']);
                            }
                        }
                    }
                }
            }
            return realFetch.apply(this, arguments);
        };
    }
    
    // Enhanced stealth player reloading with natural timing
    function reloadTwitchPlayer(isSeek, isPausePlay) {
        function findReactNode(root, constraint) {
            if (root.stateNode && constraint(root.stateNode)) {
                return root.stateNode;
            }
            let node = root.child;
            while (node) {
                const result = findReactNode(node, constraint);
                if (result) {
                    return result;
                }
                node = node.sibling;
            }
            return null;
        }
        
        function findReactRootNode() {
            var reactRootNode = null;
            var rootNode = document.querySelector('#root');
            if (rootNode && rootNode._reactRootContainer && rootNode._reactRootContainer._internalRoot && rootNode._reactRootContainer._internalRoot.current) {
                reactRootNode = rootNode._reactRootContainer._internalRoot.current;
            }
            if (reactRootNode == null) {
                var containerName = Object.keys(rootNode).find(x => x.startsWith('__reactContainer'));
                if (containerName != null) {
                    reactRootNode = rootNode[containerName];
                }
            }
            return reactRootNode;
        }
        
        var reactRootNode = findReactRootNode();
        if (!reactRootNode) {
            stealthLog('Could not find react root');
            return;
        }
        
        var player = findReactNode(reactRootNode, node => node.setPlayerActive && node.props && node.props.mediaPlayerInstance);
        player = player && player.props && player.props.mediaPlayerInstance ? player.props.mediaPlayerInstance : null;
        var playerState = findReactNode(reactRootNode, node => node.setSrc && node.setInitialPlaybackSettings);
        
        if (!player) {
            stealthLog('Could not find player');
            return;
        }
        if (!playerState) {
            stealthLog('Could not find player state');
            return;
        }
        if (player.paused || player.core?.paused) {
            return;
        }
        
        if (isSeek) {
            stealthLog('Performing seek operation pos:' + player.getPosition());
            var pos = player.getPosition();
            // Add natural delay between seeks
            setTimeout(() => {
                player.seekTo(0);
                setTimeout(() => {
                    player.seekTo(pos);
                }, stealthConfig.randomDelay());
            }, stealthConfig.randomDelay());
            return;
        }
        
        if (isPausePlay) {
            // Natural pause/play timing
            player.pause();
            setTimeout(() => {
                player.play();
            }, stealthConfig.randomDelay());
            return;
        }
        
        const lsKeyQuality = 'video-quality';
        const lsKeyMuted = 'video-muted';
        const lsKeyVolume = 'volume';
        var currentQualityLS = localStorage.getItem(lsKeyQuality);
        var currentMutedLS = localStorage.getItem(lsKeyMuted);
        var currentVolumeLS = localStorage.getItem(lsKeyVolume);
        
        if (player?.core?.state) {
            localStorage.setItem(lsKeyMuted, JSON.stringify({default:player.core.state.muted}));
            localStorage.setItem(lsKeyVolume, player.core.state.volume);
        }
        if (player?.core?.state?.quality?.group) {
            localStorage.setItem(lsKeyQuality, JSON.stringify({default:player.core.state.quality.group}));
        }
        
        playerState.setSrc({ isNewMediaPlayerInstance: true, refreshAccessToken: true });
        
        // Restore settings with natural delay
        setTimeout(() => {
            localStorage.setItem(lsKeyQuality, currentQualityLS);
            localStorage.setItem(lsKeyMuted, currentMutedLS);
            localStorage.setItem(lsKeyVolume, currentVolumeLS);
        }, 3000 + stealthConfig.randomDelay());
    }
    
    // Enhanced stealth content loading with anti-detection measures
    function onContentLoaded() {
        // Enhanced visibility state spoofing
        try {
            Object.defineProperty(document, 'visibilityState', {
                get() {
                    return 'visible';
                },
                configurable: true
            });
        }catch{}
        
        try {
            Object.defineProperty(document, 'hidden', {
                get() {
                    return false;
                },
                configurable: true
            });
        }catch{}
        
        // Enhanced event blocking with stealth
        var block = e => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        };
        
        // Use passive listeners to avoid detection
        document.addEventListener('visibilitychange', block, {passive: false, capture: true});
        document.addEventListener('webkitvisibilitychange', block, {passive: false, capture: true});
        document.addEventListener('mozvisibilitychange', block, {passive: false, capture: true});
        document.addEventListener('hasFocus', block, {passive: false, capture: true});
        
        try {
            if (/Firefox/.test(navigator.userAgent)) {
                Object.defineProperty(document, 'mozHidden', {
                    get() {
                        return false;
                    },
                    configurable: true
                });
            } else {
                Object.defineProperty(document, 'webkitHidden', {
                    get() {
                        return false;
                    },
                    configurable: true
                });
            }
        }catch{}
        
        // Enhanced localStorage preservation with stealth
        var keysToCache = [
            'video-quality',
            'video-muted',
            'volume',
            'lowLatencyModeEnabled',
            'persistenceEnabled',
        ];
        
        var cachedValues = new Map();
        for (var i = 0; i < keysToCache.length; i++) {
            cachedValues.set(keysToCache[i], localStorage.getItem(keysToCache[i]));
        }
        
        var realSetItem = localStorage.setItem;
        localStorage.setItem = function(key, value) {
            if (cachedValues.has(key)) {
                cachedValues.set(key, value);
            }
            return realSetItem.apply(this, arguments);
        };
        
        var realGetItem = localStorage.getItem;
        localStorage.getItem = function(key) {
            if (cachedValues.has(key)) {
                return cachedValues.get(key);
            }
            return realGetItem.apply(this, arguments);
        };
        
        // Stealth: Hide script presence from page inspection
        if (!stealthConfig.debugMode) {
            // Remove any traces that could be detected
            delete window.reloadTwitchPlayer;
            delete window[versionKey];
        }
    }
    
    // Only expose reloadTwitchPlayer in debug mode
    if (stealthConfig.debugMode) {
        window.reloadTwitchPlayer = reloadTwitchPlayer;
    }
    
    declareOptions(window);
    hookWindowWorker();
    hookFetch();
    
    if (document.readyState === "complete" || document.readyState === "loaded" || document.readyState === "interactive") {
        onContentLoaded();
    } else {
        window.addEventListener("DOMContentLoaded", function() {
            onContentLoaded();
        });
    }
})();