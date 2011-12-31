/* Copyright 2011 Google Inc. All Rights Reserved. */
(function() {
    var d, e, f, g, h, i, j, k, l, n = function() {
            var a = {};
            a.language = f.options[f.selectedIndex].value;
            a.popupDblclick = g.checked ? "true" : "false";
            a.popupSelect = j.checked ? "true" : "false";
            a.popupDblclickKey = i.options[i.selectedIndex].value;
            a.popupSelectKey = l.options[l.selectedIndex].value;
            a.enableHttps = "true";
            a.xdict_accesskey = x.value;
            window.localStorage.options = JSON.stringify(a);
            var b = document.getElementById("save_status");
            b.style.setProperty("-webkit-transition", "opacity 0s ease-in");
            b.style.opacity = 1;
            window.setTimeout(function() {
                b.style.setProperty("-webkit-transition", "opacity 0.5s ease-in");
                b.style.opacity = 0
            }, 1E3);
            m(!1);
            chrome.extension.getBackgroundPage()["gdx.updateOptions"]()
        },
        r = function() {
            m(!1);
            var a = JSON.parse(window.localStorage.options);
            o(f, a.language);
            g.checked = a.popupDblclick == "true";
            p();
            j.checked = a.popupSelect == "true";
            q();
            o(i, a.popupDblclickKey);
            o(l, a.popupSelectKey)
            x.value = a.xdict_accesskey || "";
        },
        o = function(a, b) {
            for (var c = 0, t = a.options.length; c < t; c++) if (a.options[c].value == b) {
                a.options[c].selected = !0;
                break
            }
        },
        m = function(a) {
            d.disabled = !a;
            e.disabled = !a
        },
        s = function() {
            m(!0)
        },
        p = function() {
            var a = g.checked;
            i.disabled = !a;
            h.className = a ? "" : "text_disabled"
        },
        q = function() {
            var a = j.checked;
            l.disabled = !a;
            k.className = a ? "" : "text_disabled"
        };
    window.initOptionsPage = function() {
        d = document.getElementById("save_button");
        e = document.getElementById("reset_button");
        f = document.getElementById("language_selector");
        g = document.getElementById("popup_dblclick_checkbox");
        h = document.getElementById("popup_dblclick_text");
        i = document.getElementById("popup_dblclick_key");
        j = document.getElementById("popup_select_checkbox");
        k = document.getElementById("popup_select_text");
        l = document.getElementById("popup_select_key");
        x = document.getElementById("xdict_accesskey_text");
        x.addEventListener("click", s, !1);
        d.addEventListener("click", n, !1);
        e.addEventListener("click", r, !1);
        g.addEventListener("change", function() {
            p()
        }, !1);
        j.addEventListener("change", function() {
            q()
        }, !1);
        for (var a = document.getElementsByTagName("input"), b = 0, c; c = a[b]; b++) c.addEventListener("change", s, !1);
        a = document.getElementsByTagName("select");
        for (b = 0; c = a[b]; b++) c.addEventListener("change", s, !1);
        if (window.navigator.platform.toLowerCase().indexOf("mac") != -1) document.getElementById("popup_dblclick_key_ctrl").innerHTML = "Command", document.getElementById("popup_select_key_ctrl").innerHTML = "Command";
        r()
    };
})();
