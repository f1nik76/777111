var Channel = (function () {
  "use strict";
  var u = Math.floor(1000001 * Math.random()),
    g = {};
  function k(e) {
    return Array.isArray
      ? Array.isArray(e)
      : -1 != e.constructor.toString().indexOf("Array");
  }
  function e(e) {
    try {
      var t = JSON.parse(e.data);
      if ("object" != typeof t || null === t) throw "malformed";
    } catch (e) {
      return;
    }
    var o,
      n,
      r,
      i,
      a = e.source,
      s = e.origin;
    if (
      ("string" == typeof t.method &&
        (i =
          2 == (r = t.method.split("::")).length
            ? ((o = r[0]), r[1])
            : t.method),
      void 0 !== t.id && (n = t.id),
      "string" == typeof i)
    ) {
      var c = !1;
      if (g[s] && g[s][o])
        for (var l = 0; l < g[s][o].length; l++)
          if (g[s][o][l].win === a) {
            g[s][o][l].handler(s, i, t), (c = !0);
            break;
          }
      if (!c && g["*"] && g["*"][o])
        for (l = 0; l < g["*"][o].length; l++)
          if (g["*"][o][l].win === a) {
            g["*"][o][l].handler(s, i, t);
            break;
          }
    } else void 0 !== n && O[n] && O[n](s, i, t);
  }
  var O = {};
  return (
    window.addEventListener
      ? window.addEventListener("message", e, !1)
      : window.attachEvent && window.attachEvent("onmessage", e),
    {
      build: function (m) {
        function w(e) {
          if (m.debugOutput && window.console && window.console.log) {
            try {
              "string" != typeof e && (e = JSON.stringify(e));
            } catch (e) {}
            window.console.log("[" + i + "] " + e);
          }
        }
        if (!window.postMessage)
          throw "jschannel cannot run this browser, no postMessage";
        if (!window.JSON || !window.JSON.stringify || !window.JSON.parse)
          throw "jschannel cannot run this browser, no JSON parsing/serialization";
        if ("object" != typeof m)
          throw "Channel build invoked without a proper object argument";
        if (!m.window || !m.window.postMessage)
          throw "Channel.build() called without a valid window argument";
        if (window === m.window)
          throw "target window is same as present window -- not allowed";
        var e = !1;
        if (
          ("string" == typeof m.origin &&
            ("*" === m.origin
              ? (e = !0)
              : null !==
                  (t = m.origin.match(
                    /^https?:\/\/(?:[-a-zA-Z0-9_\.])+(?::\d+)?/
                  )) && ((m.origin = t[0].toLowerCase()), (e = !0))),
          !e)
        )
          throw "Channel.build() called with an invalid origin";
        if (void 0 !== m.scope) {
          if ("string" != typeof m.scope)
            throw "scope, when specified, must be a string";
          if (1 < m.scope.split("::").length)
            throw "scope may not contain double colons: '::'";
        }
        function l(e, t, o) {
          if ("function" == typeof m.gotMessageObserver)
            try {
              m.gotMessageObserver(e, o);
            } catch (e) {
              w("gotMessageObserver() raised an exception: " + e.toString());
            }
          if (o.id && t) {
            if (b[t]) {
              (p = o.id), (u = o.callbacks || []), (h = g = !1);
              var n = {
                origin: e,
                invoke: function (e, t) {
                  if (!v[p])
                    throw (
                      "attempting to invoke a callback of a nonexistent transaction: " +
                      p
                    );
                  for (var o = !1, n = 0; n < u.length; n++)
                    if (e === u[n]) {
                      o = !0;
                      break;
                    }
                  if (!o) throw "request supports no such callback '" + e + "'";
                  x({ id: p, callback: e, params: t });
                },
                error: function (e, t) {
                  if (((h = !0), !v[p]))
                    throw "error called for nonexistent message: " + p;
                  delete v[p], x({ id: p, error: e, message: t });
                },
                complete: function (e) {
                  if (((h = !0), !v[p]))
                    throw "complete called for nonexistent message: " + p;
                  delete v[p], x({ id: p, result: e });
                },
                delayReturn: function (e) {
                  return (g = "boolean" == typeof e ? !0 === e : g);
                },
                completed: function () {
                  return h;
                },
              };
              v[o.id] = {};
              try {
                if (o.callbacks && k(o.callbacks) && 0 < o.callbacks.length)
                  for (var r = 0; r < o.callbacks.length; r++) {
                    for (
                      var i = o.callbacks[r],
                        a = o.params,
                        s = i.split("/"),
                        c = 0;
                      c < s.length - 1;
                      c++
                    ) {
                      var l = s[c];
                      "object" != typeof a[l] && (a[l] = {}), (a = a[l]);
                    }
                    a[s[s.length - 1]] = (function () {
                      var t = i;
                      return function (e) {
                        return n.invoke(t, e);
                      };
                    })();
                  }
                var d = b[t](n, o.params);
                n.delayReturn() || n.completed() || n.complete(d);
              } catch (t) {
                var d = "runtime_error",
                  f = null;
                if (
                  ("string" == typeof t
                    ? (f = t)
                    : "object" == typeof t &&
                      (t && k(t) && 2 == t.length
                        ? ((d = t[0]), (f = t[1]))
                        : "string" == typeof t.error &&
                          ((d = t.error),
                          t.message
                            ? "string" == typeof t.message
                              ? (f = t.message)
                              : (t = t.message)
                            : (f = ""))),
                  null === f)
                )
                  try {
                    void 0 === (f = JSON.stringify(t)) && (f = t.toString());
                  } catch (e) {
                    f = t.toString();
                  }
                n.error(d, f);
              }
            }
          } else
            o.id && o.callback
              ? y[o.id] && y[o.id].callbacks && y[o.id].callbacks[o.callback]
                ? y[o.id].callbacks[o.callback](o.params)
                : w(
                    "ignoring invalid callback, id:" +
                      o.id +
                      " (" +
                      o.callback +
                      ")"
                  )
              : o.id
              ? y[o.id]
                ? (o.error
                    ? (0, y[o.id].error)(o.error, o.message)
                    : void 0 !== o.result
                    ? (0, y[o.id].success)(o.result)
                    : (0, y[o.id].success)(),
                  delete y[o.id],
                  delete O[o.id])
                : w("ignoring invalid response: " + o.id)
              : t && b[t] && b[t]({ origin: e }, o.params);
          var p, u, g, h;
        }
        var i = (function () {
            for (
              var e = "",
                t =
                  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
                o = 0;
              o < 5;
              o++
            )
              e += t.charAt(Math.floor(Math.random() * t.length));
            return e;
          })(),
          b = {},
          y = {},
          v = {},
          a = !1,
          s = [],
          o = m.window,
          t = m.origin,
          n = "string" == typeof m.scope ? m.scope : "",
          e = l;
        function r(e) {
          for (var t = 0; t < e.length; t++) if (e[t].win === o) return !0;
          return !1;
        }
        var c = !1;
        if ("*" === t) {
          for (var d in g)
            if (
              g.hasOwnProperty(d) &&
              "*" !== d &&
              "object" == typeof g[d][n] &&
              (c = r(g[d][n]))
            )
              break;
        } else
          !(c = g["*"] && g["*"][n] ? r(g["*"][n]) : c) &&
            g[t] &&
            g[t][n] &&
            (c = r(g[t][n]));
        if (c)
          throw (
            "A channel is already bound to the same window which overlaps with origin '" +
            t +
            "' and has scope '" +
            n +
            "'"
          );
        "object" != typeof g[t] && (g[t] = {}),
          "object" != typeof g[t][n] && (g[t][n] = []),
          g[t][n].push({ win: o, handler: e });
        function f(e) {
          return (e =
            "string" == typeof m.scope && m.scope.length
              ? [m.scope, e].join("::")
              : e);
        }
        var x = function (e, t) {
            if (!e) throw "postMessage called with null message";
            if (
              (w((a ? "post  " : "queue ") + " message: " + JSON.stringify(e)),
              t || a)
            ) {
              if ("function" == typeof m.postMessageObserver)
                try {
                  m.postMessageObserver(m.origin, e);
                } catch (e) {
                  w(
                    "postMessageObserver() raised an exception: " + e.toString()
                  );
                }
              m.window.postMessage(JSON.stringify(e), m.origin);
            } else s.push(e);
          },
          p = {
            unbind: function (e) {
              if (b[e]) {
                if (delete b[e]) return !0;
                throw "can't delete method: " + e;
              }
              return !1;
            },
            bind: function (e, t) {
              if (!e || "string" != typeof e)
                throw "'method' argument to bind must be string";
              if (!t || "function" != typeof t)
                throw "callback missing from bind params";
              if (b[e]) throw "method '" + e + "' is already bound!";
              return (b[e] = t), this;
            },
            call: function (e) {
              if (!e) throw "missing arguments to call function";
              if (!e.method || "string" != typeof e.method)
                throw "'method' argument to call must be string";
              if (!e.success || "function" != typeof e.success)
                throw "'success' callback missing from call";
              function r(e, t) {
                if (0 <= s.indexOf(t))
                  throw "params cannot be a recursive data structure";
                if ((s.push(t), "object" == typeof t))
                  for (var o in t) {
                    var n;
                    t.hasOwnProperty(o) &&
                      ((n = e + (e.length ? "/" : "") + o),
                      "function" == typeof t[o]
                        ? ((i[n] = t[o]), a.push(n), delete t[o])
                        : "object" == typeof t[o] &&
                          null !== t[o] &&
                          r(n, t[o]));
                  }
              }
              var t,
                o,
                n,
                i = {},
                a = [],
                s = [],
                c =
                  (r("", e.params),
                  { id: u, method: f(e.method), params: e.params });
              a.length && (c.callbacks = a),
                e.timeout &&
                  ((t = u),
                  (o = e.timeout),
                  (n = f(e.method)),
                  window.setTimeout(function () {
                    y[t] &&
                      ((0, y[t].error)(
                        "timeout_error",
                        "timeout (" + o + "ms) exceeded on method '" + n + "'"
                      ),
                      delete y[t],
                      delete O[t]);
                  }, o)),
                (y[u] = { callbacks: i, error: e.error, success: e.success }),
                (O[u] = l),
                u++,
                x(c);
            },
            notify: function (e) {
              if (!e) throw "missing arguments to notify function";
              if (!e.method || "string" != typeof e.method)
                throw "'method' argument to notify must be string";
              x({ method: f(e.method), params: e.params });
            },
            destroy: function () {
              for (
                var e = m.window,
                  t = m.origin,
                  o = "string" == typeof m.scope ? m.scope : "",
                  n = g[t][o],
                  r = 0;
                r < n.length;
                r++
              )
                n[r].win === e && n.splice(r, 1);
              0 === g[t][o].length && delete g[t][o],
                window.removeEventListener
                  ? window.removeEventListener("message", l, !1)
                  : window.detachEvent && window.detachEvent("onmessage", l),
                (a = !1),
                (b = {}),
                (v = {}),
                (y = {}),
                (m.origin = null),
                (s = []),
                w("channel destroyed"),
                (i = "");
            },
          };
        return (
          p.bind("__ready", function (e, t) {
            if ((w("ready msg received"), a && !m.reconnect))
              throw "received ready message while in ready state.  help!";
            for (
              a = !1,
                i.length < 6 && (i += "ping" === t ? "-R" : "-L"),
                m.reconnect || p.unbind("__ready"),
                a = !0,
                w("ready msg accepted."),
                "ping" === t && p.notify({ method: "__ready", params: "pong" });
              s.length;

            )
              x(s.pop());
            "function" == typeof m.onReady && m.onReady(p);
          }),
          setTimeout(function () {
            x({ method: f("__ready"), params: "ping" }, !0);
          }, 0),
          p
        );
      },
    }
  );
})();
function taxseeInitEvents(o, e, t, n) {
  function r() {
    return {
      windowWidth: o.innerWidth,
      windowHeight: o.innerHeight,
      frameWidth: n.scrollWidth,
      frameHeight: n.scrollHeight,
      scroll: o.pageYOffset || e.documentElement.scrollTop,
    };
  }
  (o.onload = function (e) {
    t.notify({ method: "load", params: r() });
  }),
    (o.onresize = function (e) {
      t.notify({ method: "resize", params: r() });
    }),
    (o.onscroll = function (e) {
      t.notify({ method: "scroll", params: r() });
    }),
    t.bind("loadParams", function (e, t) {
      return o.taxsee.p;
    }),
    o.taxsee.p.autoresize &&
      t.bind("frameSize", function (e, t) {
        n.setAttribute("height", t.params.frameHeight + "px");
        t = new Event("FrameResize");
        (t.bubbles = !0), (t.cancelable = !0), document.dispatchEvent(t);
      });
  var i = new Event("TaxSeeLoaded");
  (i.bubbles = !0), (i.cancelable = !0), document.dispatchEvent(i);
}
function taxseeInitFrame(o, e) {
  var t = o.taxsee.p.container || "taxsee-form";
  let n = e.createElement("iframe");
  n.setAttribute("name", "order-form-frame"),
    n.setAttribute("id", "order-form-frame"),
    n.setAttribute("allowTransparency", "true"),
    n.setAttribute("frameBorder", "0"),
    n.setAttribute("tabindex", "1"),
    n.setAttribute("width", "100%"),
    n.setAttribute("height", "400"),
    o.taxsee.p.autoresize && n.setAttribute("scrolling", "no"),
    (o.taxsee.log = function (e) {
      o.taxsee.p.debug && console.log("[TaxSee] " + e);
    });
  var r = document.getElementsByTagName("script");
  let i = "";
  for (let e = 0; e < r.length; e++)
    0 < r[e].src.indexOf("embed.form.js") &&
      (i = r[e].src.replace(/(https?:\/\/.*?\/).*/g, "$1") + "frame/");
  function a(e, t, o) {
    e
      ? (n.src += "&" + t + "=" + encodeURIComponent(e))
      : o && (n.src += "&" + t + "=" + encodeURIComponent(o));
  }
  o.taxsee.p.id
    ? ((n.src = i),
      (n.src += "?tax-id=" + encodeURIComponent(o.taxsee.p.id)),
      (t = e.getElementById(t))
        ? ([].forEach.call(t.attributes, function (e) {
            var t;
            /^data-taxsee-/.test(e.name) &&
              ((t = e.name.substring(11).replace(/-(.+)/g, function (e, t) {
                return t.toLowerCase();
              })),
              (o.taxsee.p[t] = e.value));
          }),
          a(o.taxsee.p.country, "c"),
          a(o.taxsee.p.language, "l"),
          a(o.taxsee.p.base, "b"),
          a(o.taxsee.p.payment, "p"),
          a(o.taxsee.p.socialNetwork, "s"),
          a(o.taxsee.p.cashback, "cb"),
          a(o.taxsee.p.fromCabinet, "t"),
          a(o.taxsee.p.orderId, "order"),
          a(o.taxsee.p.templateId, "template"),
          a(o.taxsee.p.phone, "phone"),
          a(o.taxsee.p.theme, "theme"),
          a(o.taxsee.p.opacity, "opacity"),
          a(o.taxsee.p.textColor, "text-color"),
          a(o.taxsee.p.bgColor, "bg-color"),
          a(o.taxsee.p.linkColor, "link-color"),
          a(o.taxsee.p.borderColor, "border-color"),
          a(o.taxsee.p.borderRadius, "border-radius"),
          a(o.taxsee.p.version, "version"),
          a(o.taxsee.p.loginPosition, "login-position"),
          a(o.taxsee.p.orgLogo, "org-logo"),
          a(o.taxsee.p.withMap, "with-map"),
          a(o.taxsee.p.privacyUrl, "privacy-url"),
          console.debug(n.src),
          t.appendChild(n),
          (o.taxsee.chan = Channel.build({
            window: n.contentWindow,
            origin: "*",
            scope: "frameFormScope",
            reconnect: !0,
            onReady: function () {
              o.taxsee.log("channel is ready!");
            },
          })),
          taxseeInitEvents(o, e, o.taxsee.chan, n))
        : o.taxsee.log("Error: Invalid container!"))
    : o.taxsee.log("Error: Identifier is not specified!");
}
window, document, taxseeInitFrame(window, document);
