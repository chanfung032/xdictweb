/* Copyright 2011 Google Inc. All Rights Reserved. */
(function() {
    var d = !0,
        e = null,
        g = !1,
        j, k = function(a) {
            return a.replace(/^\s+|\s+$/g, "")
        },
        o = function(a, b) {
            return function() {
                return b.apply(a, arguments)
            }
        },
        p = function(a) {
            if (a && a.tagName) {
                var b = a.tagName.toLowerCase();
                if ("input" == b || "textarea" == b) return d
            }
            if (document.designMode && "on" == document.designMode.toLowerCase()) return d;
            for (; a; a = a.parentNode) if (a.isContentEditable) return d;
            return g
        },
        r = /[0-9A-Za-z]/,
        A = function() {
            chrome.extension.sendRequest({
                type: "initialize"
            }, o(this, function(a) {
                this.B = a.instanceId;
                var a = document.createElement("div"),
                    b = document.createElement("a");
                b.target = "_blank";
                this.s = a.cloneNode(g);
                this.p = document.createElement("audio");
                this.p.L = d;
                this.c = a.cloneNode(g);
                this.c.id = "gdx-bubble-container";
                this.a = a.cloneNode(g);
                this.a.id = "gdx-bubble-main";
                this.c.appendChild(this.a);
                this.b = a.cloneNode(g);
                this.b.id = "gdx-bubble-query-container";
                this.q = a.cloneNode(g);
                this.q.id = "gdx-bubble-query";
                this.l = a.cloneNode(g);
                this.l.id = "gdx-bubble-audio-icon";
                var c = a.cloneNode(g);
                c.id = "gdx-bubble-query-container-end";
                this.b.appendChild(this.q);
                this.b.appendChild(this.l);
                this.b.appendChild(c);
                this.h = a.cloneNode(g);
                this.h.id = "gdx-bubble-meaning";
                this.f = a.cloneNode(g);
                this.f.id = "gdx-bubble-options-tip";
                this.f.innerHTML = v;
                this.i = a.cloneNode(g);
                this.i.id = "gdx-bubble-more";
                this.e = b.cloneNode(g);
                this.i.appendChild(this.e);
                this.d = a.cloneNode(g);
                this.d.id = "gdx-bubble-attribution";
                this.k = b.cloneNode(g);
                this.o = a.cloneNode(g);
                this.d.appendChild(this.k);
                this.d.appendChild(this.o);
                this.r = a.cloneNode(g);
                this.r.id = "gdx-bubble-close";
                this.a.appendChild(this.r);
                this.a.appendChild(this.b);
                this.a.appendChild(this.h);
                this.a.appendChild(this.f);
                this.a.appendChild(this.d);
                this.a.appendChild(this.i);
                this.n = a.cloneNode(g);
                this.n.id = "gdx-arrow-container";
                this.c.appendChild(this.n);
                this.D = w(a, "up");
                this.C = w(a, "down");
                this.A = o(this, this.J);
                this.t = o(this, this.F);
                this.u = o(this, this.G);
                this.w = o(this, this.g);
                this.z = o(this, this.I);
                this.v = o(this, this.H);
                x("mouseup", this.A, document);
                x("click", this.t, document);
                x("dblclick", this.u, document);
                x("resize", this.w, window);
                x("keydown", this.z, document);
                x("click", o(this.p, this.p.play), this.l);
                chrome.extension.onRequest.addListener(z);
                chrome.extension.onRequest.addListener(this.v)
            }))
        },
        B = [],
        v = "Tip: Didn't want this definition pop-up? Try setting a trigger key in <a href=\"" + chrome.extension.getURL("options.html") + '" target="_blank">Extension Options</a>.';
    j = A.prototype;
    j.m = 0;
    j.s = e;
    j.p = e;
    j.c = e;
    j.a = e;
    j.b = e;
    j.q = e;
    j.l = e;
    j.h = e;
    j.f = e;
    j.r = e;
    j.i = e;
    j.e = e;
    j.d = e;
    j.k = e;
    j.o = e;
    j.n = e;
    j.D = e;
    j.C = e;
    j.j = e;
    j.A = e;
    j.t = e;
    j.u = e;
    j.w = e;
    j.z = e;
    j.v = e;
    var x = function(a, b, c) {
            document.addEventListener ? c.addEventListener(a, b, g) : c.attachEvent("on" + a, b)
        },
        C = function(a, b, c) {
            document.removeEventListener ? c.removeEventListener(a, b, g) : c.detachEvent("on" + a, b)
        },
        D = function(a) {
            C("mouseup", a.A, document);
            C("click", a.t, document);
            C("dblclick", a.u, document);
            C("resize", a.w, window);
            C("keydown", a.z, document);
            chrome.extension.onRequest.removeListener(z);
            chrome.extension.onRequest.removeListener(a.v);
            a.g()
        },
        w = function(a, b) {
            var c = a.cloneNode(g),
                h = a.cloneNode(g),
                f = a.cloneNode(g);
            c.id = "gdx-arrow-main";
            "up" == b ? (h.id = "gdx-bubble-arrow-inner-up", f.id = "gdx-bubble-arrow-outer-up") : (h.id = "gdx-bubble-arrow-inner-down", f.id = "gdx-bubble-arrow-outer-down");
            c.appendChild(h);
            c.appendChild(f);
            return c
        },
        E = function(a, b, c, h) {
            this.left = a;
            this.top = b;
            this.right = c;
            this.bottom = h
        },
        G = function(a) {
            a.a.style.left = "0";
            a.a.style.top = "0";
            var b = a.a.offsetWidth,
                c = a.a.offsetHeight,
                h = [self.pageXOffset, self.pageYOffset],
                f = [a.j.left + h[0], a.j.top + h[1]],
                i = a.j.bottom - a.j.top,
                q = f[0] + (a.j.right - a.j.left) / 2,
                h = document.documentElement.offsetWidth + document.body.scrollLeft,
                y = document.body.scrollLeft,
                m = q - b / 2;
            m + b > h && (m = h - b);
            m < y && (m = y);
            var t = f[1] - c - 12 + 2,
                n = f[1] + i + 12 - 2;
            a: if (b = new E(m, t, m + b, t + c), b.top < document.body.scrollTop) b = g;
            else {
                for (var c = document.getElementsByTagName("embed"), F = document.getElementsByTagName("object"), u = [self.pageXOffset, self.pageYOffset], s = 0, K = c.length + F.length; s < K; s++) {
                    var l = (s < c.length ? c[s] : F[s - c.length]).getBoundingClientRect(),
                        l = new E(l.left + u[0], l.top + u[1], l.right + u[0], l.bottom + u[1]);
                    if (b.bottom > l.top && l.bottom > b.top && b.left < l.right && l.left < b.right) {
                        b = g;
                        break a
                    }
                }
                b = d
            }
            b ? (n = a.C, n.style.top = f[1] - 12 + "px") : (t = n, n = a.D, n.style.top = f[1] + i + "px");
            f = q - 12;
            n.style.left = f + "px";
            f - 5 > y && f + 24 + 5 < h && a.n.appendChild(n);
            a.a.style.top = t + "px";
            a.a.style.left = m + "px"
        };
    A.prototype.K = function(a) {
        if (a.eventKey == this.m) {
            this.g();
            this.l.className = "gdx-display-none";
            this.f.className = "gdx-display-none";
            this.i.className = "gdx-display-block";
            this.d.className = "gdx-display-none";
            if (a.meaningObj) {
                var b = a.meaningObj;
                this.b.className = "gdx-display-block";
                this.q.innerHTML = b.prettyQuery;
                this.h.innerHTML = b.meaningText;
                b.audio && (this.p.src = b.audio, this.l.className = "gdx-display-block");
                this.e.href = b.moreUrl;
                this.e.innerHTML = "More \u00bb";
                b.attribution && ("translation" == b.type ? (this.o.innerHTML = b.attribution, this.k.className = "gdx-display-none", this.o.className = "gdx-display-inline") : (this.s.innerHTML = b.attribution, b = this.s.getElementsByTagName("a")[0], this.k.href = b.href, this.k.innerHTML = b.innerHTML.replace("http://", ""), this.k.className = "gdx-display-inline", this.o.className = "gdx-display-none"), this.d.className = "gdx-display-block")
            } else this.b.className = "gdx-display-none", this.h.innerHTML = "No definition found.", this.e.href = "http://www.google.com/search?q=" + encodeURIComponent(a.sanitizedQuery), this.e.innerHTML = 'Search the web for "' + a.sanitizedQuery + '" \u00bb';
            a.showOptionsTip && (this.f.className = "gdx-display-block");
            document.documentElement.appendChild(this.c);
            G(this)
        }
    };
    A.prototype.g = function() {
        this.m++;
        var a = this.c;
        a && a.parentNode && a.parentNode.removeChild(a);
        for (a = this.n; a && a.hasChildNodes();) a.removeChild(a.childNodes[0])
    };
    A.prototype.I = function(a) {
        27 == a.keyCode && this.g()
    };
    var H = function(a, b) {
            return "none" == b || "alt" == b && a.altKey || "ctrl" == b && (-1 != window.navigator.platform.toLowerCase().indexOf("mac") ? a.metaKey : a.ctrlKey) || "shift" == b && a.shiftKey
        },
        I = function(a, b) {
            for (var c = b.target; c; c = c.parentNode) if (c == a.c) return d;
            return g
        },
        J = function(a, b, c, h) {
            var f;
            "mouseup" == c ? f = "true" == h.popupSelect && H(b, h.popupSelectKey) : "dblclick" == c ? f = "true" == h.popupSelect && H(b, h.popupSelectKey) ? g : "true" == h.popupDblclick && H(b, h.popupDblclickKey) : (console.log("Unexpected eventType: " + c), f = g);
            if (f) {
                f = 0;
                for (var i = B.length; f < i; f++) if (location.href.match(B[f])) return;
                if (!p(b.target) && (f = e, i = "", window.getSelection ? (i = window.getSelection(), f = i.getRangeAt(0), i = k(i.toString())) : document.selection && (f = document.selection.createRange(), i = k(f.text)), i && !(1 == i.length && 127 >= i.charCodeAt(0) && !i.match(r)) && !("dblclick" == c && -1 != i.indexOf(" ")))) {
                    a.m++;
                    var q = a.m;
                    I(a, b) || (b = f.getBoundingClientRect(), a.j = new E(b.left, b.top, b.right, b.bottom));
                    "false" == h.enableHttps && 0 == location.href.lastIndexOf("https", 0) ? q == a.m && (a.h.innerHTML = "Dictionary is disabled for https pages.", a.e.href = "http://support.google.com/TODO", a.e.innerHTML = "More information \u00bb", a.i.className = "gdx-display-block", a.b.className = "gdx-display-none", a.f.className = "gdx-display-none", a.d.className = "gdx-display-none", document.documentElement.appendChild(a.c), G(a)) : (window.setTimeout(o(a, function() {
                        if (q == this.m) {
                            this.h.innerHTML = "Searching...";
                            this.b.className = "gdx-display-none";
                            this.f.className = "gdx-display-none";
                            this.i.className = "gdx-display-none";
                            this.d.className = "gdx-display-none";
                            document.documentElement.appendChild(this.c);
                            G(this)
                        }
                    }), 300), chrome.extension.sendRequest({
                        type: "fetch_raw",
                        eventKey: q,
                        instanceId: a.B,
                        query: i
                    }, o(a, a.K)))
                }
            }
        };
    A.prototype.J = function(a) {
        var b = a.target;
        if (I(this, a)) if (b == this.r) this.g();
        else {
            if ("a" == b.tagName.toLowerCase()) return
        } else this.g();
        chrome.extension.sendRequest({
            type: "options"
        }, o(this, function(b) {
            J(this, a, "mouseup", b.options)
        }))
    };
    A.prototype.F = function(a) {
        var b = a.target;
        I(this, a) && "a" == b.tagName.toLowerCase() && this.g()
    };
    A.prototype.G = function(a) {
        chrome.extension.sendRequest({
            type: "options"
        }, o(this, function(b) {
            J(this, a, "dblclick", b.options)
        }))
    };
    var z = function(a, b, c) {
            "get_selection" == a.type && (a = k(window.getSelection().toString())) && c({
                selection: a
            })
        };
    A.prototype.H = function(a) {
        "hide" == a.type && a.instanceId == this.B && this.g()
    };
    window._dictBubbleInstance && D(window._dictBubbleInstance);
    window._gdxBubbleInstance && D(window._gdxBubbleInstance);
    window.gdxBubbleInstance && D(window.gdxBubbleInstance);
    window.gdxBubbleInstance = new A;
})();
