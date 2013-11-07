(function () {
    var xdict = xdict || {};

    xdict.debug = true;

    xdict.client = "dict-chrome-ex";
    xdict.dictBase = "http://www.google.com/dictionary";
    xdict.tipWords = "\" ' ( ) , - . / 1 2 2011 : ? a about and are as be but com for from have i in is it like may more my next not of on search that the this to was when with you your".split(" ");

    xdict.regex1 = RegExp("<[^>]*>", "g");
    xdict.regex2 = RegExp("[<>]", "g");
    xdict.maxWordLength = 100;

    xdict.options = {};

    xdict.id = 0;
    xdict.tabid = -1;
    xdict.instanceId = -1;

    xdict.sanitize = function (word) {
        word = word.replace(xdict.regex1, "");
        word = word.replace(xdict.regex2, "");
        return word.substring(0, xdict.maxWordLength).toLowerCase();
    };

    xdict.contains = function (elts, target) {
        for (var i = 0, len = elts.length; i < len; i++) 
            if (target == elts[i]) return !0;
        return !1
    };

    xdict.stringify = function (js) {
        return JSON.stringify(js, null, "  ");
    };

    xdict.handleInitialize = function (request, sender, sendResponse) {
        request.type == "initialize" && (sendResponse({
            instanceId: xdict.id++,
            leapfrogServerUrl: ""
        }))
    };

    xdict.handleOptions = function (request, sender, sendResponse) {
        request.type == "options" && sendResponse({options: xdict.options});
    };

    xdict.handleFetch = function (request, sender, sendResponse) {
        if (request.type == "fetch_raw" || request.type == "fetch_html") {
            
            if (xdict.tabid != -1 && xdict.instanceId != request.instanceId) {
                chrome.tabs.sendRequest(xdict.tabid, {
                    type: "hide",
                    instanceId: xdict.instanceId
                });
            }
            xdict.tabid = sender.tab && sender.tab.id || -1;
            xdict.instanceId = request.instanceId;

            var word = xdict.sanitize(request.query),
                ctx = {
                    request: request,
                    sanitizedQuery: word,
                    dictResponse: null,
                    translateResponse: null,
                    numResponses: 0,
                    callback: sendResponse
                },
                restrict = "pr,de,sy";
            //request.type == "fetch_html" && (restrict = "pr,de,sy");

            google.language.define(word, xdict.options.language, xdict.options.language, 
                function (a) {xdict.render(a, "dict", ctx);}, {restricts: restrict});

            xdict.translate(word, function (a) {
                xdict.render(a, "translate", ctx)
            });

            // detect tab's primary launage
            chrome.tabs.getSelected(null, function (a) {
                window.setTimeout(function () {
                    xdict.render({
                        lang: "unknown"
                    }, "tabLang", ctx)
                }, 800);
                chrome.tabs.detectLanguage(a.id, function (a) {
                    xdict.render({
                        lang: a
                    }, "tabLang", ctx)
                })
            });
        }
    };

    xdict.translate = function (word, callback) {
        var xhr = new XMLHttpRequest;
        xhr.open("GET", "http://clients5.google.com/translate_a/t?client=" + xdict.client + "&sl=auto&tl=" + xdict.options.language + "&q=" + word, !0);
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) try {
                callback(JSON.parse(xhr.responseText))
            } catch (a) {
                callback(null)
            }
        };
        xhr.send()
    };

    xdict.mapLang = function (lang) {
        return lang == "he" ? "iw" : lang;
    };

    xdict.render = function (response, type, ctx) {
        xdict.debug && console.log(response);
        if (type == "dict") ctx.dictResponse = response;
        else if (type == "translate") ctx.translateResponse = response;
        else {
            if (ctx.tabLang) return;
            ctx.tabLang = xdict.mapLang(response.lang)
        } 
    
        ctx.numResponses++;
        if (ctx.numResponses == 3) {
            var ds = xdict.summalizeDict(ctx.dictResponse),
                ts = xdict.summalizeTranslate(ctx.translateResponse);

            xdict.debug && (console.log("dictResponse:"),
                            console.log(xdict.stringify(ctx.dictResponse)),
                            console.log("dictDefinition:"),
                            console.log(xdict.stringify(ds)),
                            console.log("translateResponse:"),
                            console.log(xdict.stringify(ctx.translateResponse)),
                            console.log("translateDefinition:"),
                            console.log(xdict.stringify(ts)));

            var useTranslateDefinition = false;
            var srcLangs = null;
            if (ctx.translateResponse && ctx.translateResponse.ld_result && (srcLangs = ctx.translateResponse.ld_result.srclangs))
                for (var i = 0, l = srcLangs.length; i < l; i++) srcLangs[i] = srcLangs[i].toLowerCase();
            if (!ds || ds.type != "licensedDef") {
                var optLang = xdict.options.language.toLowerCase();
                if (ts && ts.srcLang.toLowerCase() != optLang)
                    if (srcLangs && !xdict.contains(srcLangs, optLang) || !ds) 
                        useTranslateDefinition = true
            }
            xdict.debug && ts && (console.log("srcLang=" + ts.srcLang.toLowerCase()),
                                  console.log("tabLang=" + ctx.tabLang.toLowerCase()),
                                  console.log("optLang=" + xdict.options.language.toLowerCase()));
            
            var tMoreUrl = "http://translate.google.com/translate_t?source=" + xdict.client + 
                           "&sl=auto&tl=" + xdict.options.language + "&q=" + encodeURIComponent(ctx.sanitizedQuery);
                dMoreUrl = "http://www.google.com/search?source=" + xdict.client + "&defl=" + xdict.options.language + 
                           "&hl=" + xdict.options.language + "&q=" + encodeURIComponent(ctx.sanitizedQuery) + "&tbo=1&tbs=dfn:1";

            var a = null;
            if (ctx.request.type == "fetch_html")
                a = {
                    eventKey: ctx.request.eventKey,
                    sanitizedQuery: ctx.sanitizedQuery,
                    html: useTranslateDefinition ? xdict.buildTranslate(ctx.translateResponse, tMoreUrl) : xdict.buildDict(ctx.dictResponse, tMoreUrl)
                };
            else {
                meaning = null;

                if (useTranslateDefinition && ts) meaning = ts, ts.moreUrl = tMoreUrl;
                else if (ds) meaning = ds, ds.moreUrl = dMoreUrl;

                meaning && !meaning.prettyQuery && (meaning.prettyQuery = ctx.sanitizedQuery);

                var showTip = false;
                if ((xdict.options.popupDblclick == "true" && xdict.options.popupDblclickKey == "none" || 
                     xdict.options.popupSelect == "true" && xdict.options.popupSelectKey == "none") && xdict.contains(xdict.tipWords, ctx.sanitizedQuery)) 
                    showTip = true;

                a = {
                    eventKey: ctx.request.eventKey,
                    sanitizedQuery: ctx.sanitizedQuery,
                    meaningObj: meaning,
                    showOptionsTip: showTip
                };

            }

            xdict.debug && (console.log("finalResponse:"), console.log(xdict.stringify(a)));
            ctx.callback(a);

            ds && (xdict.pushToWeb(ctx, ds));
        }
    };

    xdict.summalizeTranslate = function(doc, verbose) {
        if (!doc || doc.sentences[0].orig.toLowerCase() == doc.sentences[0].trans.toLowerCase()) 
            return null;
        var sl = window["gdx.LANG_MAP"][doc.src.toLowerCase()];
        sl || (sl = doc.src);
        return {
            type: "translation",
            meaningText: function () {
                var orig = doc.sentences[0].orig.toLowerCase(),
                    trans = doc.sentences[0].trans.toLowerCase(),
                    transes = trans;
                if (verbose && doc.dict && doc.dict.length > 0)
                    for (var i = 0, len = doc.dict.length; i < len; i++)
                        for (var d = doc.dict[i], n = 0, j = 0, len1 = d.terms.length; j < len1 && n < 2; j++) {
                            var m = d.terms[n].toLowerCase();
                            m.length > 0 && m != orig && m != trans && (transes += ", " + m, n++)
                        }
                return transes
            }(),
            attribution: "Translated from " + sl,
            srcLang: doc.src
        }
    };

    xdict.find = function (elts, type) {
        for (var i = 0, e; e = elts[i]; i++) 
            if (e.type && e.type == type && e.text) 
                return e.text;
        return ""
    };

    xdict.summary = function (primaries) {
        if (!primaries || primaries.length == 0) return null;
        for (var i = 0, p; p = primaries[i]; i++) 
            for (var j = 0, e; e = p.entries[j]; j++) 
                if (e.type == "meaning" && e.terms && e.terms.length > 0) {
                    var t = xdict.find(e.terms, "text");
                    if (t) 
                        return a = xdict.find(p.terms, "sound")/*.replace("http://", "https://")*/, {
                            prettyQuery: xdict.find(p.terms, "text"),
                            meaningText: t,
                            audio: a,
                            attribution: xdict.find(e.terms, "url")
                        }
                }
        return null
    };

    xdict.summalizeDict = function (doc) {
        if (!doc || doc.error) return null;
        var d = xdict.summary(doc.primaries);
        if (d) {
            d.attribution = "", d.type = "licensedDef";
        } else {
            (d = xdict.summary(doc.webDefinitions)) && (d.type = "webDef");
        }
        d.synonyms = doc.synonyms;
        return d
    };

    xdict.buildTranslate = function (dict, moreUrl) {
        var c = xdict.summalizeTranslate(dict, !1);
        if (!c) return "";
        var part1 = '<div class="translate-main">' + c.meaningText + '</div><div class="translate-attrib">(' + c.attribution + ")</div>",
            part2 = "";
        if (dict.dict && dict.dict.length > 0) 
            for (var part2 = '<h3 class="dct-tl">Translated definitions</h3>', i = 0, last = dict.dict.length; i < last; i++) {
                var d = dict.dict[i];
                part2 += "<b>" + d.pos + "</b><ol>";
                for (var j = 0, l = d.terms.length; j < l; j++) {
                    var t = d.terms[j];
                    t.length > 0 && (part2 += "<li>" + t + "</li>")
                }
                part2 += "</ol>"
        }
        return part1 + part2 + ('<br><div class="translate-powered">Powered by <a href="' + moreUrl + '" class="translate-link">Google Translate</a></div><br>')
    };

    xdict.buildDict = function (dict, moreUrl) {
        if (!dict || dict.error) return "";
        var html = google.language.dictionary.createResultHtml(dict),
            e = document.createElement("div");
        e.innerHTML = html;
        for (var a = e.getElementsByTagName("a"), i = a.length - 1; i >= 0; i--) {
            var g = a[i];
            if (g.innerText == "Google Dictionary" && g.href.lastIndexOf(xdict.dictBase, 0) == 0) g.href = moreUrl
        }
        return e.innerHTML
    };

    xdict.pushToWeb = function (ctx, summary) {
        if (xdict.options.accesskey == "") return;
        var xhr = new XMLHttpRequest;
        xhr.open("POST", "http://xdictweb.sinaapp.com/api/add?key=" + xdict.options.accesskey, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) 
                console.log(xhr.responseText)
        };       
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        
        var o = {word: summary.prettyQuery.replace(/·/g, ""), meaning: summary.meaningText,
                 synonyms: summary.synonyms};
        xhr.send(JSON.stringify(o));
    };

    xdict.mergeOptions = function (prev) {
        var opt = {};
        opt.language = prev.language || "en";
        var merge = function (a, b) {
                return a == "true" || a == "false" ? a : (a == true ? "true" : (a == false ? "false" : b))
            };
        opt.popupDblclick = merge(prev.popupDblclick, "true");
        opt.popupSelect = merge(prev.popupSelect, "false");
        opt.enableHttps = merge(prev.enableHttps, "true");
        opt.popupDblclickKey = prev.popupDblclickKey || "none";
        opt.popupSelectKey = prev.popupSelectKey || "ctrl";
        opt.accesskey = prev.accesskey || "";
        if (prev.popupMode) if (prev.popupMode == "popup_disabled") opt.popupDblclick = "false";
        else if (prev.popupMode == "popup_key_ctrl") opt.popupDblclickKey = "ctrl", opt.popupSelect = "true", opt.popupSelectKey = "ctrl";
        return opt
    };

    xdict.updateOptions = function (options) {
        xdict.options = xdict.mergeOptions(JSON.parse(window.localStorage.options));
    };

    dict_api.load("https://clients5.google.com?client=" + xdict.client, "1", "en");

    var os = window.localStorage.options, options = {};
    os && (options = JSON.parse(os));
    xdict.options = xdict.mergeOptions(options);
    window.localStorage.options = JSON.stringify(xdict.options);
    xdict.debug && (console.log("gdx.options:"), console.log(xdict.stringify(xdict.options)));

    chrome.extension.onRequest.addListener(xdict.handleOptions);
    chrome.extension.onRequest.addListener(xdict.handleInitialize);
    chrome.extension.onRequest.addListener(xdict.handleFetch);

    window["gdx.updateOptions"] = xdict.updateOptions;

}) ();
