/* Copyright 2011 Google Inc. All Rights Reserved. */
(function() {
    var b = null,
        c = 0,
        d = b,
        e = b,
        f = b,
        h = b,
        i = b,
        j = b,
        k = function(a) {
            a.target = "_blank";
            a.addEventListener("click", function() {
                window.close()
            }, !1)
        },
        n = function() {
            var a;
            if (a = e.value.replace(/^\s+|\s+$/g, "")) f.innerHTML = "Searching...", f.style.display = "block", h.style.display = "none", i.style.display = "none", j.style.display = "none", d.disabled = !0, c++, chrome.extension.sendRequest({
                type: "fetch_html",
                eventKey: c,
                query: a
            }, l)
        },
        l = function(a) {
            if (a.eventKey == c) {
                if (a.html) {
                    j.innerHTML = a.html;
                    for (var m = j.getElementsByTagName("span"), a = 0, g; g = m[a]; a++)("dct-lnk" == g.className || "dct-rlnk" == g.className) && g.addEventListener("click", function() {
                        e.value = this.title ? this.title : this.innerHTML;
                        n()
                    }, !1);
                    m = j.getElementsByTagName("a");
                    for (a = 0; g = m[a]; a++) k(g);
                    f.style.display = "none";
                    j.style.display = "block"
                } else f.innerHTML = "No definition found.", f.style.display = "block", h.href = "http://www.google.com/search?q=" + a.sanitizedQuery, h.innerHTML = 'Search the web for "' + a.sanitizedQuery + '" \u00bb', h.style.display = "block";
                d.disabled = !1
            }
        },
        d = document.getElementById("button"),
        e = document.getElementById("query-field");
    e.focus();
    f = document.getElementById("lookup-status");
    h = document.getElementById("web-search-link");
    k(h);
    i = document.getElementById("usage-tip");
    j = document.getElementById("meaning");
    k(document.getElementById("options-link"));
    d.addEventListener("click", n, !1);
    e.addEventListener("keydown", function(a) {
        13 == a.keyCode && n()
    }, !1);
    i.innerHTML = "Tip: Select text on any webpage, then click the Google Dictionary button to view the definition of your selection.";
    i.style.display = "block";
    chrome.tabs.getSelected(b, function(a) {
        chrome.tabs.sendRequest(a.id, {
            type: "get_selection"
        }, function(a) {
            a.selection && (e.value = a.selection, n())
        })
    });
})();
