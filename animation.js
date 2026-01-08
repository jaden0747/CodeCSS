(() => {
  "use strict";
  var e = {
      246: (e, t) => {
        Object.defineProperty(t, "__esModule", { value: !0 }),
          (t.CursorAnimation = void 0),
          (t.CursorAnimation = class {
            constructor(e) {
              (this._cursorCanvas = document.createElement("canvas")),
                (this._options = {
                  color: e?.color || "#ffffff",
                  cursorStyle: e?.cursorStyle || "block",
                  trailLength: e?.trailLength || 8,
                }),
                this.init();
            }
            getColor() {
              if (!this._options.color.startsWith("--")) {
                return this._options.color;
              }
              if (!this._cachedWorkbench) {
                this._cachedWorkbench = document.querySelector(".monaco-workbench");
              }
              return this._cachedWorkbench
                ? getComputedStyle(this._cachedWorkbench).getPropertyValue(this._options.color)
                : this._options.color;
            }
            updateOptions(e) {
              (this._options.color = e?.color || this._options.color),
                (this._options.cursorStyle =
                  e?.cursorStyle || this._options.cursorStyle),
                (this._options.trailLength =
                  e?.trailLength || this._options.trailLength);
            }
            destroy() {
              this._cursorHandle?.stop();
              this._cursorHandle = null;
              this._cursorCanvas?.remove();
            }
            init() {
              this._cachedWorkbench = null;
              this.createCursorHandler({
                onStarted: (e) => {
                  this._cursorCanvas.style.cssText = 'pointer-events: none; position: absolute; top: 0px; left: 0px; z-index: 1000; will-change: contents;';
                  e.appendChild(this._cursorCanvas);
                  (this._cursorHandle = this.createTrail({
                      length: this._options.trailLength,
                      color: this._options.color,
                      size: 7,
                      style: this._options.cursorStyle,
                      canvas: this._cursorCanvas,
                    }));
                },
                onReady: () => {},
                onCursorPositionUpdated: (e, t) => {
                  this._cursorHandle.move(e, t);
                },
                onEditorSizeUpdated: (e, t) => {
                  this._cursorHandle.updateSize(e, t);
                },
                onCursorSizeUpdated: (e, t) => {
                  this._cursorHandle.updateCursorSize(e, t);
                },
                onCursorVisibilityChanged: (e) => {
                  this._cursorCanvas.style.visibility = e
                    ? "visible"
                    : "hidden";
                },
                onLoop: () => {
                  this._cursorHandle.updateParticles();
                },
              });
            }
            createTrail(e) {
              const t = e?.canvas,
                o = t.getContext("2d");
              let n,
                i,
                s = { x: 0, y: 0 },
                r = [],
                a = e?.size || 3,
                l = e?.sizeY || 2.2 * a,
                c = !1;
              class d {
                constructor(e, t) {
                  this._position = { x: e, y: t };
                }
                get position() {
                  return this._position;
                }
              }
              function u(e, t) {
                r.push(new d(e, t));
              }
              const h = () => {
                  o.beginPath(),
                    (o.lineJoin = "round"),
                    (o.strokeStyle = this.getColor());
                  const e = Math.min(a, l);
                  o.lineWidth = e;
                  let t = (l - e) / 3;
                  for (let n = 0; n <= 3; n++) {
                    let i = n * t;
                    for (let t = 0; t < this._options.trailLength; t++) {
                      if (!r[t]) continue;
                      const n = r[t].position;
                      0 === t
                        ? o.moveTo(n.x, n.y + i + e / 2)
                        : o.lineTo(n.x, n.y + i + e / 2);
                    }
                  }
                  o.stroke();
                },
                m = () => {
                  o.beginPath(), (o.fillStyle = this.getColor());
                  for (let e = 0; e < this._options.trailLength; e++) {
                    if (!r[e]) continue;
                    const t = r[+e].position;
                    0 === e ? o.moveTo(t.x, t.y) : o.lineTo(t.x, t.y);
                  }
                  for (let e = this._options.trailLength - 1; e >= 0; e--) {
                    if (!r[e]) continue;
                    const t = r[+e].position;
                    o.lineTo(t.x, t.y + l);
                  }
                  o.closePath(),
                    o.fill(),
                    o.beginPath(),
                    (o.lineJoin = "round"),
                    (o.strokeStyle = this.getColor()),
                    (o.lineWidth = Math.min(a, l));
                  let e = -a / 2 + l / 2;
                  for (let t = 0; t < this._options.trailLength; t++) {
                    if (!r[t]) continue;
                    const n = r[t].position;
                    0 === t ? o.moveTo(n.x, n.y + e) : o.lineTo(n.x, n.y + e);
                  }
                  o.stroke();
                };
              return {
                updateParticles: () => {
                  if (!c) return;
                  o.clearRect(0, 0, n, i);
                  let e = s.x, t = s.y;
                  const len = r.length;
                  for (let idx = 0; idx < len; idx++) {
                    const next = r[(idx + 1) % len];
                    const curr = r[idx];
                    if (!curr || !next) continue;
                    curr.position.x = e;
                    curr.position.y = t;
                    e += 0.42 * (next.position.x - curr.position.x);
                    t += 0.35 * (next.position.y - curr.position.y);
                  }
                  "block" === this._options.cursorStyle ? m() : h();
                },
                move: (e, t) => {
                  if (((e += a / 2), (s.x = e), (s.y = t), !1 === c)) {
                    c = !0;
                    for (let o = 0; o < this._options.trailLength; o++) u(e, t);
                  }
                },
                updateSize: function (e, o) {
                  (n = e), (i = o), (t.width = e), (t.height = o);
                },
                updateCursorSize: function (e, t) {
                  (a = e), t && (l = t);
                },
                stop: function () {
                  (r = []), o.clearRect(0, 0, n, i);
                },
              };
            }
            async createCursorHandler(e) {
              let t = document.querySelector(".part.editor");
              if (!t) {
                await new Promise((resolve) => {
                  const checkEditor = setInterval(() => {
                    t = document.querySelector(".part.editor");
                    if (t) {
                      clearInterval(checkEditor);
                      resolve();
                    }
                  }, 100);
                });
              }
              e?.onStarted(t);
              let o = [],
                n = 0,
                i = [],
                s = 0;
              function r(t, n, r, a) {
                let l, c;
                const d = (a, u) => {
                  if (!i[n]) {
                    const idx = o.indexOf(d);
                    if (idx !== -1) o.splice(idx, 1);
                    return;
                  }
                  const rect = t.getBoundingClientRect();
                  const p = rect.left - a;
                  const v = rect.top - u;
                  if (p === l && v === c && s === n) return;
                  l = p;
                  c = v;
                  if (p <= 0 || v <= 0 || "inherit" === t.style.visibility) return;
                  if (r.getBoundingClientRect().left > rect.left) return;
                  s = n;
                  e?.onCursorPositionUpdated(p, v);
                  e?.onCursorSizeUpdated(t.clientWidth, t.clientHeight);
                };
                o.push(d);
              }
              let a = !1;
              let lastTime = 0;
              const checkCursors = (timestamp) => {
                if (timestamp - lastTime < 300) {
                  requestAnimationFrame(checkCursors);
                  return;
                }
                lastTime = timestamp;

                let o = [],
                  s = 0;
                const l = t.querySelectorAll(".cursor");
                const len = l.length;
                for (let e = 0; e < len; e++) {
                  const cursorEl = l[e];
                  if (
                    ("inherit" !== cursorEl.style.visibility && s++,
                    cursorEl.hasAttribute("cursorId"))
                  ) {
                    o.push(Number(cursorEl.getAttribute("cursorId")));
                    continue;
                  }
                  let a = n++;
                  o.push(a);
                  i[a] = cursorEl;
                  cursorEl.setAttribute("cursorId", `${a}`);
                  let c = cursorEl.parentElement?.parentElement?.parentElement;
                  r(cursorEl, a, c);
                }
                let c = s <= 1;
                c !== a && (e?.onCursorVisibilityChanged(c), (a = c));
                for (const e in i) o.includes(+e) || delete i[+e];

                requestAnimationFrame(checkCursors);
              };
              requestAnimationFrame(checkCursors);
              const l = () => {
                if (!this._cursorCanvas) return;
                const { left: n, top: i } = t.getBoundingClientRect();
                const len = o.length;
                for (let idx = 0; idx < len; idx++) o[idx](n, i);
                e?.onLoop();
                requestAnimationFrame(l);
              };
              function c() {
                e?.onEditorSizeUpdated(t.clientWidth, t.clientHeight);
              }
              let resizeTimeout;
              const debouncedResize = () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(c, 100);
              };
              new ResizeObserver(debouncedResize).observe(t);
              c();
              requestAnimationFrame(l);
              e?.onReady();
            }
          });
      },
      456: (e, t) => {
        Object.defineProperty(t, "__esModule", { value: !0 }),
          (t.addFocusHandler = t.FocusDimMode = void 0);
        let o = { onBlur: () => {}, onFocus: () => {}, elements: [] };
        var n;
        !(function (e) {
          (e.window = "Full Window"),
            (e.editor = "Everything But Editor"),
            (e.terminal = "Everything But Terminal"),
            (e.editorAndTerminal = "Everything But Editor and Terminal"),
            (e.none = "None");
        })(n || (t.FocusDimMode = n = {})),
          (t.addFocusHandler = function (e) {
            window.removeEventListener("blur", o.onBlur),
              window.removeEventListener("focus", o.onFocus);
            const t =
              ".minimap, .decorationsOverviewRuler, .composite.title, .title.tabs, .editor-container:has(.settings-editor)";
            let i = "";
            switch (e.mode) {
              case n.window:
                i = ".monaco-workbench";
                break;
              case n.editor:
                i = `.split-view-view:not(:has(.editor-instance > .monaco-editor, .editor-instance > .monaco-diff-editor)), .split-view-view:has(> .terminal-outer-container), ${t}`;
                break;
              case n.terminal:
                i = `.split-view-view:not(:has(.terminal)), ${t}`;
                break;
              case n.editorAndTerminal:
                i = `.split-view-view:not(:has(.editor-instance > .monaco-editor, .editor-instance > .monaco-diff-editor)):not(:has(.terminal)), ${t}`;
                break;
              case n.none:
                return;
            }
            const s = () => {
              let e = Array.from(document.querySelectorAll(i));
              return (
                (e = e.filter((t) => !e.some((e) => e.contains(t) && e !== t))),
                e
              );
            };
            o.elements = s();
            o.elements.forEach((t) => {
              t.style.transition = `opacity ${e.duration}ms`;
              t.style.willChange = 'opacity';
            }),
              (o.onBlur = () => {
                const t = `${e.amount}%`;
                for (const e of o.elements) {
                  e.style.opacity = t;
                }
              }),
              (o.onFocus = () => {
                for (const e of o.elements) {
                  e.style.opacity = "100%";
                }
              }),
              window.addEventListener("blur", o.onBlur),
              window.addEventListener("focus", o.onFocus);
          });
      },
      302: (e, t, o) => {
        Object.defineProperty(t, "__esModule", { value: !0 }),
          (t.initTabsHandler = void 0);
        const n = o(252);
        t.initTabsHandler = function () {
          const e = new MutationObserver((e) => {
              const t = { added: null, removed: null, updated: [] };
              for (let o = 0; o < e.length; o++) {
                const mutation = e[o];
                const target = mutation.target;
                const className = target.className;
                const parentClassName = target.parentElement?.className;

                if (className !== "tabs-container" && parentClassName !== "tabs-container") continue;

                if (mutation.type === "childList") {
                  if (mutation.addedNodes.length > 0) {
                    t.added = mutation.addedNodes[0];
                  }
                  if (mutation.removedNodes.length > 0 && !mutation.removedNodes[0].classList.contains("deletedTab")) {
                    const removed = mutation.removedNodes[0];
                    removed.classList.add("deletedTab");
                    t.removed = removed;
                  }
                } else if (mutation.type === "attributes") {
                  if (mutation.attributeName !== "aria-label") continue;
                  const newLabel = target.getAttribute("aria-label");
                  if (mutation.oldValue === newLabel) continue;
                  t.updated.push(target);
                }
              }

              if (t.updated.length === 0 && !t.added && !t.removed) return;

              const tabs = document.querySelectorAll(".tabs-container > .tab");
              for (let i = 0; i < tabs.length; i++) {
                const tab = tabs[i];
                tab.classList.remove("newTab", "moveLeft", "moveRight");
                void tab.offsetWidth;
              }

              if (t.added && t.updated.length > 0) {
                t.updated[0].classList.add("newTab");
                for (let i = 1; i < t.updated.length; i++) {
                  t.updated[i].classList.add("moveRight");
                }
              } else if (t.removed) {
                for (let i = 0; i < t.updated.length; i++) {
                  t.updated[i].classList.add("moveLeft");
                }
              }
            }),
            t = {
              childList: !0,
              attributes: !0,
              attributeOldValue: !0,
              attributeFilter: ["aria-label"],
              subtree: !0,
            },
            o = new MutationObserver((o) => {
              o.forEach((o) => {
                "childList" === o.type &&
                  o.addedNodes.forEach((o) => {
                    const n = o.querySelector(".tabs-container")?.getRootNode();
                    e.observe(n, t);
                  });
              });
            });
          (0, n.waitForElements)(".split-view-container", (i) => {
            (0, n.waitForElements)(".tabs-container", (o) => {
              o.forEach((o) => {
                e.observe(o, t);
              });
            }),
              i.forEach((e) => {
                o.observe(e, { childList: !0 });
              });
          });
        };
      },
      252: (e, t) => {
        Object.defineProperty(t, "__esModule", { value: !0 }),
          (t.waitForElements = t.waitForElement = void 0),
          (t.waitForElement = function (e, t, o = 10) {
            const checkElement = () => {
              const element = document.querySelector(e);
              if (element) {
                clearInterval(n);
                t(element);
              }
            };
            const n = setInterval(checkElement, o);
          }),
          (t.waitForElements = function (e, t, o = 10) {
            const checkElements = () => {
              const elements = document.querySelectorAll(e);
              if (elements.length > 0) {
                clearInterval(n);
                t(elements);
              }
            };
            const n = setInterval(checkElements, o);
          });
      },
      1: (e, t, o) => {
        Object.defineProperty(t, "__esModule", { value: !0 }),
          (t.Messenger = void 0);
        const n = o(456);
        t.Messenger = class {
          constructor(e) {
            this._lastUpdate = 0;
            const checkElement = () => {
              this._messengerElement = document.getElementById(
                "BrandonKirbyson.vscode-animations"
              );
              const label = this._messengerElement?.getAttribute("aria-label");
              if (this._messengerElement && label) {
                clearInterval(t);
                e.onLoad(this.data);
                new MutationObserver((mutations) => {
                  const now = Date.now();
                  if (now - this._lastUpdate < 100) return;

                  for (let i = 0; i < mutations.length; i++) {
                    const m = mutations[i];
                    if (m.type === "attributes" && m.attributeName === "aria-label" && m.target.getAttribute("aria-label")) {
                      this._lastUpdate = now;
                      e.onUpdate(this.data);
                      break;
                    }
                  }
                }).observe(this._messengerElement, { attributes: !0 });
              }
            };
            const t = setInterval(checkElement, 100);
          }
          get data() {
            const e = this._messengerElement?.getAttribute("aria-label"),
              t = {
                settings: {
                  cursorAnimation: {
                    enabled: !1,
                    color: "#ffffff",
                    cursorStyle: "line",
                    trailLength: 8,
                  },
                  focus: {
                    mode: n.FocusDimMode.window,
                    amount: 50,
                    duration: 200,
                  },
                },
                css: "",
              };
            if (!e) return t;
            return JSON.parse(e) || t;
          }
        };
      },
      59: (e, t) => {
        function o(e) {
          const o = document.createElement("style");
          (o.id = t.styleID),
            (o.textContent = e),
            document.body.insertAdjacentElement("afterbegin", o);
        }
        Object.defineProperty(t, "__esModule", { value: !0 }),
          (t.updateCustomCSS = t.createCustomCSS = t.styleID = void 0),
          (t.styleID = "VSCode-Animations-custom-css"),
          (t.createCustomCSS = o),
          (t.updateCustomCSS = function (e) {
            let n = document.getElementById(t.styleID);
            if (n) {
              if (n.textContent !== e) {
                n.textContent = e;
              }
            } else {
              o(e);
            }
          });
      },
    },
    t = {};
  function o(n) {
    var i = t[n];
    if (void 0 !== i) return i.exports;
    var s = (t[n] = { exports: {} });
    return e[n](s, s.exports, o), s.exports;
  }
  var n = {};
  (() => {
    var e = n;
    Object.defineProperty(e, "__esModule", { value: !0 });
    // const t = o(246),
    // const i = o(456),
    // const s = o(302),
    const r = o(1),
      a = o(59);
    console.log("VSCode-Animations: Successfully Installed!"),
      (() => {
        new r.Messenger({
          onLoad: (o) => {
            (0, a.createCustomCSS)(o.css);
            // (0, i.addFocusHandler)(o.settings.focus);
          },
          onUpdate: (o) => {
            (0, a.updateCustomCSS)(o.css);
            // (0, i.addFocusHandler)(o.settings.focus);
          },
        });
        // (0, s.initTabsHandler)();
      })();
  })(),
    (module.exports = n);
})();
