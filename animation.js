(() => {
  "use strict";
  var e = {
      246: (e, t) => {
        Object.defineProperty(t, "__esModule", { value: !0 });
        t.CursorAnimation = void 0;
        // Kitty-style cursor trail: one stretchy quad whose four corners chase
        // the cursor rect with exponential decay. Corners facing the direction
        // of travel converge fast, trailing corners lag, so the quad stretches
        // like taffy and snaps into place (kitty's cursor_trail).
        t.CursorAnimation = class {
          constructor(e) {
            this._cursorCanvas = document.createElement("canvas");
            this._interval = null;
            this._options = {
              color: e?.color || "#ffffff",
              cursorStyle: e?.cursorStyle || "block",
              trailLength: e?.trailLength || 8,
            };
            this.init();
          }
          getColor() {
            return this._options.color.startsWith("--")
              ? getComputedStyle(
                  document.querySelector(".monaco-workbench")
                ).getPropertyValue(this._options.color)
              : this._options.color;
          }
          updateOptions(e) {
            this._options.color = e?.color || this._options.color;
            this._options.cursorStyle =
              e?.cursorStyle || this._options.cursorStyle;
            this._options.trailLength =
              e?.trailLength || this._options.trailLength;
          }
          destroy() {
            this._cursorHandle.stop();
            this._cursorHandle = null;
            this._cursorCanvas.remove();
            this._interval && clearInterval(this._interval);
            this._interval = null;
          }
          init() {
            this.createCursorHandler({
              onStarted: (editor) => {
                this._cursorCanvas.style.pointerEvents = "none";
                this._cursorCanvas.style.position = "absolute";
                this._cursorCanvas.style.top = "0px";
                this._cursorCanvas.style.left = "0px";
                this._cursorCanvas.style.zIndex = "1000";
                editor.appendChild(this._cursorCanvas);
                this._cursorHandle = this.createTrail({
                  size: 7,
                  canvas: this._cursorCanvas,
                });
              },
              onReady: () => {},
              onCursorPositionUpdated: (x, y) => {
                this._cursorHandle.move(x, y);
              },
              onEditorSizeUpdated: (w, h) => {
                this._cursorHandle.updateSize(w, h);
              },
              onCursorSizeUpdated: (w, h) => {
                this._cursorHandle.updateCursorSize(w, h);
              },
              onCursorVisibilityChanged: (visible) => {
                this._cursorCanvas.style.visibility = visible
                  ? "visible"
                  : "hidden";
              },
              onLoop: () => {
                this._cursorHandle.updateParticles();
              },
            });
          }
          createTrail(e) {
            const canvas = e?.canvas;
            const ctx = canvas.getContext("2d");
            let width, height;
            let cursorW = e?.size || 3;
            let cursorH = e?.sizeY || 2.2 * cursorW;
            let target = { x: 0, y: 0 }; // cursor top-left, editor-relative
            let corners = null; // trail quad corners: tl, tr, br, bl
            let animating = false;
            let lastTime = 0;

            const targetCorners = () => [
              { x: target.x, y: target.y },
              { x: target.x + cursorW, y: target.y },
              { x: target.x + cursorW, y: target.y + cursorH },
              { x: target.x, y: target.y + cursorH },
            ];
            const snap = () => {
              corners = targetCorners();
            };

            return {
              move: (x, y) => {
                const first = corners === null;
                const dx = x - target.x;
                const dy = y - target.y;
                target.x = x;
                target.y = y;
                if (first) return snap();
                if (!animating) {
                  // kitty's cursor_trail_start_threshold: typing-sized moves
                  // (< 2 chars, same line) teleport instead of smearing
                  if (
                    Math.abs(dx) < 2 * cursorW &&
                    Math.abs(dy) < 0.5 * cursorH
                  )
                    return snap();
                  animating = true;
                  lastTime = performance.now();
                }
              },
              updateParticles: () => {
                if (!animating) return;
                const now = performance.now();
                const dt = Math.min((now - lastTime) / 1000, 0.1);
                lastTime = now;

                // decay times in seconds, scaled by the TrailLength setting:
                // TrailLength 4 = slow 0.2s, fast 0.05s (2x kitty's defaults)
                const slow = 0.05 * this._options.trailLength;
                const fast = 0.0125 * this._options.trailLength;

                // remaining direction of travel: quad centre -> cursor centre
                const cx = target.x + cursorW / 2;
                const cy = target.y + cursorH / 2;
                let qx = 0,
                  qy = 0;
                for (const c of corners) {
                  qx += c.x;
                  qy += c.y;
                }
                let dirX = cx - qx / 4;
                let dirY = cy - qy / 4;
                const dirLen = Math.hypot(dirX, dirY);
                if (dirLen > 1e-6) {
                  dirX /= dirLen;
                  dirY /= dirLen;
                }

                const goals = targetCorners();
                let maxDist = 0;
                for (let i = 0; i < 4; i++) {
                  const c = corners[i];
                  const g = goals[i];
                  // corners facing the direction of travel decay fastest
                  const ox = g.x - cx;
                  const oy = g.y - cy;
                  const oLen = Math.hypot(ox, oy) || 1;
                  const align =
                    dirLen > 1e-6 ? (dirX * ox + dirY * oy) / oLen : 1;
                  const decay = slow + ((fast - slow) * (align + 1)) / 2;
                  const step = 1 - Math.exp(-dt / decay);
                  c.x += (g.x - c.x) * step;
                  c.y += (g.y - c.y) * step;
                  maxDist = Math.max(
                    maxDist,
                    Math.abs(g.x - c.x),
                    Math.abs(g.y - c.y)
                  );
                }

                ctx.clearRect(0, 0, width, height);
                if (maxDist < 0.5) {
                  animating = false;
                  snap();
                  return;
                }
                // comet fade: opaque at the cursor, transparent at the tail
                // (the corner farthest from the cursor centre)
                const color = this.getColor();
                let tail = corners[0];
                let tailDist = 0;
                for (const c of corners) {
                  const d = Math.hypot(c.x - cx, c.y - cy);
                  if (d > tailDist) {
                    tailDist = d;
                    tail = c;
                  }
                }
                let fill = color;
                if (tailDist > 1) {
                  fill = ctx.createLinearGradient(tail.x, tail.y, cx, cy);
                  // normalize any color format via the canvas, then zero its alpha
                  ctx.fillStyle = color;
                  const n = ctx.fillStyle;
                  const transparent = n.startsWith("#")
                    ? `rgba(${parseInt(n.slice(1, 3), 16)},${parseInt(
                        n.slice(3, 5),
                        16
                      )},${parseInt(n.slice(5, 7), 16)},0)`
                    : n.replace(/^rgba\((.+),[^,]+\)$/, "rgba($1,0)");
                  fill.addColorStop(0, transparent);
                  fill.addColorStop(1, n);
                }
                ctx.beginPath();
                ctx.fillStyle = fill;
                ctx.moveTo(corners[0].x, corners[0].y);
                for (let i = 1; i < 4; i++) ctx.lineTo(corners[i].x, corners[i].y);
                ctx.closePath();
                ctx.fill();
              },
              updateSize: (w, h) => {
                width = w;
                height = h;
                canvas.width = w;
                canvas.height = h;
              },
              updateCursorSize: (w, h) => {
                cursorW = w;
                if (h) cursorH = h;
              },
              stop: () => {
                animating = false;
                corners = null;
                if (width) ctx.clearRect(0, 0, width, height);
              },
            };
          }
          async createCursorHandler(e) {
            let editor = null;
            while (!editor) {
              await new Promise((r) => setTimeout(r, 100));
              editor = document.querySelector(".part.editor");
            }
            e?.onStarted(editor);

            let updateHandlers = [];
            let nextCursorId = 0;
            let cursors = []; // cursorId -> cursor element
            let lastCursor = 0;

            const createCursorUpdateHandler = (target, cursorId, holder) => {
              let lastX, lastY;
              const update = (editorX, editorY) => {
                if (!cursors[cursorId]) {
                  updateHandlers.splice(updateHandlers.indexOf(update), 1);
                  return;
                }
                const { left, top } = target.getBoundingClientRect();
                const relX = left - editorX;
                const relY = top - editorY;
                if (relX === lastX && relY === lastY && lastCursor === cursorId)
                  return;
                lastX = relX;
                lastY = relY;
                if (relX <= 0 || relY <= 0) return;
                if ("inherit" !== target.style.visibility) return;
                if (holder.getBoundingClientRect().left > left) return;
                lastCursor = cursorId;
                e?.onCursorPositionUpdated(relX, relY);
                e?.onCursorSizeUpdated(target.clientWidth, target.clientHeight);
              };
              updateHandlers.push(update);
            };

            let lastVisible = false;
            this._interval = setInterval(() => {
              const ids = [];
              let hiddenCount = 0;
              const cursorElements = editor.querySelectorAll(".cursor");
              for (let i = 0; i < cursorElements.length; i++) {
                const target = cursorElements[i];
                if ("inherit" !== target.style.visibility) hiddenCount++;
                if (target.hasAttribute("cursorId")) {
                  ids.push(Number(target.getAttribute("cursorId")));
                  continue;
                }
                const id = nextCursorId++;
                ids.push(id);
                cursors[id] = target;
                target.setAttribute("cursorId", `${id}`);
                const holder =
                  target.parentElement?.parentElement?.parentElement;
                createCursorUpdateHandler(target, id, holder);
              }
              const visible = hiddenCount <= 1;
              if (visible !== lastVisible) {
                e?.onCursorVisibilityChanged(visible);
                lastVisible = visible;
              }
              for (const id in cursors)
                if (!ids.includes(+id)) delete cursors[+id];
            }, 500);

            const loop = () => {
              if (!this._interval) return;
              const { left, top } = editor.getBoundingClientRect();
              for (const update of updateHandlers) update(left, top);
              e?.onLoop();
              requestAnimationFrame(loop);
            };
            const updateEditorSize = () => {
              e?.onEditorSizeUpdated(editor.clientWidth, editor.clientHeight);
            };
            new ResizeObserver(updateEditorSize).observe(editor);
            updateEditorSize();
            loop();
            e?.onReady();
          }
        };
      },
      456: (e, t) => {
        Object.defineProperty(t, "__esModule", { value: !0 }),
          (t.addFocusHandler = t.FocusDimMode = void 0);
        let o = { onBlur: () => {}, onFocus: () => {} };
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
              window.removeEventListener("blur", o.onFocus);
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
            s().forEach((t) => {
              t.style.transition = `opacity ${e.duration}ms`;
            }),
              (o.onBlur = () => {
                s().forEach((t) => {
                  t.style.opacity = `${e.amount}%`;
                });
              }),
              (o.onFocus = () => {
                s().forEach((e) => {
                  e.style.opacity = "100%";
                });
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
              if (
                (e.forEach((e) => {
                  if (
                    "tabs-container" === e.target.className ||
                    "tabs-container" === e.target.parentElement?.className
                  )
                    if ("childList" === e.type) {
                      if (
                        (e.addedNodes.length > 0 && (t.added = e.addedNodes[0]),
                        e.removedNodes.length > 0 &&
                          !e.removedNodes[0].classList.contains("deletedTab"))
                      ) {
                        const o = e.removedNodes[0];
                        o.classList.add("deletedTab"), (t.removed = o);
                      }
                    } else if ("attributes" === e.type) {
                      if ("aria-label" !== e.attributeName) return;
                      if (e.oldValue === e.target.getAttribute("aria-label"))
                        return;
                      t.updated.push(e.target);
                    }
                }),
                0 !== t.updated.length || t.added || t.removed)
              )
                if (
                  (document
                    .querySelectorAll(".tabs-container > .tab")
                    .forEach((e) => {
                      e.classList.remove("newTab"),
                        e.classList.remove("moveLeft"),
                        e.classList.remove("moveRight"),
                        e.offsetWidth;
                    }),
                  t.added && t.updated.length > 0)
                ) {
                  t.updated[0].classList.add("newTab");
                  for (let e = 1; e < t.updated.length; e++)
                    t.updated[e].classList.add("moveRight");
                } else if (t.removed)
                  for (let e = 0; e < t.updated.length; e++)
                    t.updated[e].classList.add("moveLeft");
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
            const n = setInterval(() => {
              const o = document.querySelector(e);
              o && (clearInterval(n), t(o));
            }, o);
          }),
          (t.waitForElements = function (e, t, o = 10) {
            const n = setInterval(() => {
              const o = document.querySelectorAll(e);
              o.length > 0 && (clearInterval(n), t(o));
            }, o);
          });
      },
      1: (e, t, o) => {
        Object.defineProperty(t, "__esModule", { value: !0 }),
          (t.Messenger = void 0);
        const n = o(456);
        t.Messenger = class {
          constructor(e) {
            const t = setInterval(() => {
              this._messengerElement = document.getElementById(
                "BrandonKirbyson.vscode-animations"
              );
              const o = this._messengerElement?.getAttribute("aria-label");
              this._messengerElement &&
                "" !== o &&
                (clearInterval(t),
                e.onLoad(this.data),
                new MutationObserver((t) => {
                  t.forEach((t) => {
                    "attributes" === t.type &&
                      "aria-label" === t.attributeName &&
                      t.target.getAttribute("aria-label") &&
                      e.onUpdate(this.data);
                  });
                }).observe(this._messengerElement, { attributes: !0 }));
            }, 100);
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
            const n = document.querySelector(`#${t.styleID}`);
            n ? n.textContent !== e && (n.textContent = e) : o(e);
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
    const t = o(246),
      i = o(456),
      s = o(302),
      r = o(1),
      a = o(59);
    console.log("VSCode-Animations: Successfully Installed!"),
      (() => {
        let e = null;
        new r.Messenger({
          onLoad: (o) => {
            (0, a.createCustomCSS)(o.css),
              (0, i.addFocusHandler)(o.settings.focus),
              o.settings.cursorAnimation.enabled &&
                (e = new t.CursorAnimation(o.settings.cursorAnimation));
          },
          onUpdate: (o) => {
            (0, a.updateCustomCSS)(o.css),
              (0, i.addFocusHandler)(o.settings.focus),
              o.settings.cursorAnimation.enabled
                ? (e || (e = new t.CursorAnimation(o.settings.cursorAnimation)),
                  e.updateOptions(o.settings.cursorAnimation))
                : (e && e.destroy(), (e = null));
          },
        }),
          (0, s.initTabsHandler)();
      })();
  })(),
    (module.exports = n);
})();
