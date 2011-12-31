/* Copyright 2011 Google Inc. All Rights Reserved. */
(function() {
    var d = null,
        e, i = function(a) {
            return a.replace(/^\s+|\s+$/g, "")
        },
        j = function(a, b) {
            return function() {
                return b.apply(a, arguments)
            }
        },
        n = function() {
            var a, b;
            if (self.pageYOffset) a = self.pageXOffset, b = self.pageYOffset;
            else if (document.documentElement && document.documentElement.scrollTop) a = document.documentElement.scrollLeft, b = document.documentElement.scrollTop;
            else if (document.body) a = document.body.scrollLeft, b = document.body.scrollTop;
            return [a, b]
        },
        p = function(a) {
            if (a && a.tagName) {
                var b = a.tagName.toLowerCase();
                if (b == "input" || b == "textarea") return !0
            }
            if (document.designMode && document.designMode.toLowerCase() == "on") return !0;
            for (; a; a = a.parentNode) if (a.isContentEditable) return !0;
            return !1
        },
        r = function() {
            var a = document.createElement("div");
            a.innerHTML = "<br>";
            return a.firstChild.nodeType == 1
        },
        u = /[0-9A-Za-z]/,
        B = function() {
            chrome.extension.sendRequest({
                type: "initialize"
            }, j(this, function(a) {
                this.F = a.instanceId;
                this.s = a.leapfrogServerUrl;
                var a = document.createElement("div"),
                    b = document.createElement("a");
                b.target = "_blank";
                this.v = a.cloneNode(!1);
                this.p = document.createElement("audio");
                this.p.O = !0;
                this.d = a.cloneNode(!1);
                this.d.id = "gdx-bubble-container";
                this.a = a.cloneNode(!1);
                this.a.id = "gdx-bubble-main";
                this.d.appendChild(this.a);
                this.b = a.cloneNode(!1);
                this.b.id = "gdx-bubble-query-container";
                this.t = a.cloneNode(!1);
                this.t.id = "gdx-bubble-query";
                this.k = a.cloneNode(!1);
                this.k.id = "gdx-bubble-audio-icon";
                this.k.style.backgroundImage = v(this, "audio.png") + " !important";
                var c = a.cloneNode(!1);
                c.id = "gdx-bubble-query-container-end";
                this.b.appendChild(this.t);
                this.b.appendChild(this.k);
                this.b.appendChild(c);
                this.i = a.cloneNode(!1);
                this.i.id = "gdx-bubble-meaning";
                this.f = a.cloneNode(!1);
                this.f.id = "gdx-bubble-options-tip";
                this.f.innerHTML = w;
                this.j = a.cloneNode(!1);
                this.j.id = "gdx-bubble-more";
                this.h = b.cloneNode(!1);
                this.j.appendChild(this.h);
                this.e = a.cloneNode(!1);
                this.e.id = "gdx-bubble-attribution";
                this.l = b.cloneNode(!1);
                this.o = a.cloneNode(!1);
                this.e.appendChild(this.l);
                this.e.appendChild(this.o);
                this.q = a.cloneNode(!1);
                this.q.id = "gdx-bubble-close";
                this.q.style.backgroundImage = v(this, "close.png") + " !important";
                if (this.s) this.a.style.paddingLeft = "27px !important", this.r = b.cloneNode(!1), this.r.id = "gdx-bubble-help", this.r.style.backgroundImage = v(this, "question_mark.png") + " !important", this.r.href = "http://www.google.com/support/toolbar/bin/answer.py?answer=191164", this.u = a.cloneNode(!1), this.u.id = "gdx-bubble-favicon", this.u.style.backgroundImage = v(this, "google_favicon.png") + " !important";
                this.s && this.a.appendChild(this.u);
                this.a.appendChild(this.q);
                this.s && this.a.appendChild(this.r);
                this.a.appendChild(this.b);
                this.a.appendChild(this.i);
                this.a.appendChild(this.f);
                this.a.appendChild(this.e);
                this.a.appendChild(this.j);
                this.n = a.cloneNode(!1);
                this.n.id = "gdx-arrow-container";
                this.d.appendChild(this.n);
                this.H = y(a, "up");
                this.G = y(a, "down");
                this.D = j(this, this.M);
                this.w = j(this, this.I);
                this.z = j(this, this.J);
                this.B = j(this, this.g);
                this.C = j(this, this.L);
                this.A = j(this, this.K);
                z("mouseup", this.D, document);
                z("click", this.w, document);
                z("dblclick", this.z, document);
                z("resize", this.B, window);
                z("keydown", this.C, document);
                z("click", j(this.p, this.p.play), this.k);
                chrome.extension.onRequest.addListener(A);
                chrome.extension.onRequest.addListener(this.A)
            }))
        },
        C = [],
        w = "Tip: Didn't want this definition pop-up? Try setting a trigger key in <a href=\"" + chrome.extension.getURL("options.html") + '" target="_blank">Extension Options</a>.';
    e = B.prototype;
    e.m = 0;
    e.v = d;
    e.p = d;
    e.d = d;
    e.a = d;
    e.b = d;
    e.t = d;
    e.k = d;
    e.i = d;
    e.f = d;
    e.q = d;
    e.j = d;
    e.r = d;
    e.u = d;
    e.h = d;
    e.e = d;
    e.l = d;
    e.o = d;
    e.n = d;
    e.H = d;
    e.G = d;
    e.c = d;
    e.D = d;
    e.w = d;
    e.z = d;
    e.B = d;
    e.C = d;
    e.A = d;
    var z = function(a, b, c) {
            document.addEventListener ? c.addEventListener(a, b, !1) : c.attachEvent("on" + a, b)
        },
        D = function(a, b, c) {
            document.removeEventListener ? c.removeEventListener(a, b, !1) : c.detachEvent("on" + a, b)
        },
        E = function(a) {
            D("mouseup", a.D, document);
            D("click", a.w, document);
            D("dblclick", a.z, document);
            D("resize", a.B, window);
            D("keydown", a.C, document);
            chrome.extension.onRequest.removeListener(A);
            chrome.extension.onRequest.removeListener(a.A);
            a.g()
        },
        v = function(a, b) {
            return a.s ? "url(" + a.s + "/translationary/contentscript/" + b + ")" : "url(" + chrome.extension.getURL("static/" + b) + ")"
        },
        y = function(a, b) {
            var c = a.cloneNode(!1),
                g = a.cloneNode(!1),
                f = a.cloneNode(!1);
            c.className = "gdx-arrow-main";
            g.className = "gdx-bubble-arrow-inner";
            f.className = "gdx-bubble-arrow-outer";
            b == "up" ? (g.id = "gdx-bubble-arrow-inner-up", f.id = "gdx-bubble-arrow-outer-up") : (g.id = "gdx-bubble-arrow-inner-down", f.id = "gdx-bubble-arrow-outer-down");
            c.appendChild(g);
            c.appendChild(f);
            return c
        },
        G = function(a, b, c, g) {
            this.left = a;
            this.top = b;
            this.right = c;
            this.bottom = g
        },
        H = function(a) {
            a.a.style.left = "0 !important";
            a.a.style.top = "0 !important";
            var b = a.a.offsetWidth,
                c = a.a.offsetHeight,
                g = n(),
                f = [a.c.left + g[0], a.c.top + g[1]],
                h = a.c.bottom - a.c.top,
                o = f[0] + (a.c.right - a.c.left) / 2,
                g = document.documentElement.offsetWidth + document.body.scrollLeft,
                x = document.body.scrollLeft,
                l = o - b / 2;
            l + b > g && (l = g - b);
            l < x && (l = x);
            var s = f[1] - c - 12 + 2,
                m = f[1] + h + 12 - 2;
            a: if (b = new G(l, s, l + b, s + c), b.top < document.body.scrollTop) b = !1;
            else {
                for (var c = document.getElementsByTagName("embed"), F = document.getElementsByTagName("object"), t = n(), q = 0, L = c.length + F.length; q < L; q++) {
                    var k = (q < c.length ? c[q] : F[q - c.length]).getBoundingClientRect(),
                        k = new G(k.left + t[0], k.top + t[1], k.right + t[0], k.bottom + t[1]);
                    if (b.bottom > k.top && k.bottom > b.top && b.left < k.right && k.left < b.right) {
                        b = !1;
                        break a
                    }
                }
                b = !0
            }
            b ? (m = a.G, m.style.top = f[1] - 12 + "px !important") : (s = m, m = a.H, b = 0, navigator.appName == "Microsoft Internet Explorer" && !(document.documentMode && document.documentMode >= 8) && (b = 16), m.style.top = f[1] + h - b + "px !important");
            f = o - 12;
            m.style.left = f + "px !important";
            f - 5 > x && f + 24 + 5 < g && a.n.appendChild(m);
            a.a.style.top = s + "px !important";
            a.a.style.left = l + "px !important"
        };
    B.prototype.N = function(a) {
        if (a.eventKey == this.m) {
            this.g();
            this.k.style.display = "none !important";
            this.f.style.display = "none !important";
            this.j.style.display = "block !important";
            this.e.style.display = "none !important";
            if (a.meaningObj) {
                var b = a.meaningObj;
                this.b.style.display = "block !important";
                this.t.innerHTML = b.prettyQuery;
                this.i.innerHTML = b.meaningText;
                if (b.audio) this.p.src = b.audio, this.k.style.display = "block !important";
                this.h.href = b.moreUrl;
                this.h.innerHTML = "More &raquo;";
                if (b.attribution) b.type == "translation" ? (this.o.innerHTML = b.attribution, this.l.style.display = "none !important", this.o.style.display = "inline !important") : (this.v.innerHTML = b.attribution, b = this.v.getElementsByTagName("a")[0], this.l.href = b.href, this.l.innerHTML = b.innerHTML.replace("http://", ""), this.l.style.display = "inline !important", this.o.style.display = "none !important"), this.e.style.display = "block !important"
            } else this.b.style.display = "none !important", this.i.innerHTML = "No definition found.", this.h.href = "http://www.google.com/search?q=" + encodeURIComponent(a.sanitizedQuery), this.h.innerHTML = 'Search the web for "' + a.sanitizedQuery + '" &raquo;';
            if (a.showOptionsTip) this.f.style.display = "block !important";
            document.documentElement.appendChild(this.d);
            H(this)
        }
    };
    var I = function(a, b) {
            if (b == a.m) a.i.innerHTML = "Dictionary is disabled for https pages.", a.h.href = "http://www.google.com/support/toolbar/bin/answer.py?answer=191164", a.h.innerHTML = "More information &raquo;", a.j.style.display = "block !important", a.b.style.display = "none !important", a.f.style.display = "none !important", a.e.style.display = "none !important", document.documentElement.appendChild(a.d), H(a)
        },
        J = function(a, b) {
            var c = b.getBoundingClientRect();
            a.c = new G(c.left, c.top, c.right, c.bottom);
            if (window.screen.deviceXDPI && window.screen.logicalXDPI && (c = window.screen.deviceXDPI / window.screen.logicalXDPI, c != 1)) for (var g in a.c) a.c[g] = Math.round(a.c[g] / c)
        };
    B.prototype.g = function() {
        this.m++;
        var a = this.d;
        a && a.parentNode && a.parentNode.removeChild(a);
        for (a = this.n; a && a.hasChildNodes();) a.removeChild(a.childNodes[0])
    };
    B.prototype.L = function(a) {
        a.keyCode == 27 && this.g()
    };
    var K = function(a, b) {
            return b == "none" || b == "alt" && a.altKey || b == "ctrl" && (window.navigator.platform.toLowerCase().indexOf("mac") != -1 ? a.metaKey : a.ctrlKey) || b == "shift" && a.shiftKey
        },
        M = function(a, b) {
            for (var c = b.target || b.srcElement; c; c = c.parentNode) if (c == a.d) return !0;
            return !1
        },
        N = function(a, b, c, g) {
            var f;
            c == "mouseup" ? f = g.popupSelect == "true" && K(b, g.popupSelectKey) : c == "dblclick" ? f = g.popupSelect == "true" && K(b, g.popupSelectKey) ? !1 : g.popupDblclick == "true" && K(b, g.popupDblclickKey) : (console.log("Unexpected eventType: " + c), f = !1);
            if (f) {
                f = 0;
                for (var h = C.length; f < h; f++) if (location.href.match(C[f])) return;
                if (!p(b.target || b.srcElement) && r()) if (f = d, h = "", window.getSelection ? (h = window.getSelection(), f = h.getRangeAt(0), h = i(h.toString())) : document.selection && (f = document.selection.createRange(), h = i(f.text)), h && !(h.length == 1 && h.charCodeAt(0) <= 127 && !h.match(u)) && !(c == "dblclick" && h.indexOf(" ") != -1)) {
                    a.m++;
                    var o = a.m;
                    M(a, b) || J(a, f);
                    g.enableHttps == "false" && location.href.lastIndexOf("https", 0) == 0 ? I(a, o) : (window.setTimeout(j(a, function() {
                        if (o == this.m) this.i.innerHTML = "Searching&hellip;", this.b.style.display = "none !important", this.f.style.display = "none !important", this.j.style.display = "none !important", this.e.style.display = "none !important", document.documentElement.appendChild(this.d), H(this)
                    }), 300), chrome.extension.sendRequest({
                        type: "fetch_raw",
                        eventKey: o,
                        instanceId: a.F,
                        query: h
                    }, j(a, a.N)))
                }
            }
        };
    B.prototype.M = function(a) {
        var b = a.target || a.srcElement;
        if (M(this, a)) if (b == this.q) this.g();
        else {
            if (b.tagName.toLowerCase() == "a") return
        } else this.g();
        chrome.extension.sendRequest({
            type: "options"
        }, j(this, function(b) {
            N(this, a, "mouseup", b.options)
        }))
    };
    B.prototype.I = function(a) {
        var b = a.target || a.srcElement;
        M(this, a) && b.tagName.toLowerCase() == "a" && this.g()
    };
    B.prototype.J = function(a) {
        chrome.extension.sendRequest({
            type: "options"
        }, j(this, function(b) {
            N(this, a, "dblclick", b.options)
        }))
    };
    var A = function(a, b, c) {
            a.type == "get_selection" && (a = i(window.getSelection().toString())) && c({
                selection: a
            })
        };
    B.prototype.K = function(a) {
        a.type == "hide" && a.instanceId == this.F && this.g()
    };
    window._dictBubbleInstance && E(window._dictBubbleInstance);
    window._gdxBubbleInstance && E(window._gdxBubbleInstance);
    window.gdxBubbleInstance && E(window.gdxBubbleInstance);
    if (typeof tblf == "undefined" || typeof tblf.contentScriptUtil == "undefined" || tblf.contentScriptUtil.preventContentScripts() == !1) window.gdxBubbleInstance = new B;
})();
