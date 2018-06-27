/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the W3C SOFTWARE AND DOCUMENT NOTICE AND LICENSE.
 *
 *  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
 *
 */

(function (window, document) {
  'use strict';

  // Exits early if all IntersectionObserver and IntersectionObserverEntry
  // features are natively supported.

  if ('IntersectionObserver' in window && 'IntersectionObserverEntry' in window && 'intersectionRatio' in window.IntersectionObserverEntry.prototype) {

    // Minimal polyfill for Edge 15's lack of `isIntersecting`
    // See: https://github.com/w3c/IntersectionObserver/issues/211
    if (!('isIntersecting' in window.IntersectionObserverEntry.prototype)) {
      Object.defineProperty(window.IntersectionObserverEntry.prototype, 'isIntersecting', {
        get: function () {
          return this.intersectionRatio > 0;
        }
      });
    }
    return;
  }

  /**
   * An IntersectionObserver registry. This registry exists to hold a strong
   * reference to IntersectionObserver instances currently observering a target
   * element. Without this registry, instances without another reference may be
   * garbage collected.
   */
  var registry = [];

  /**
   * Creates the global IntersectionObserverEntry constructor.
   * https://w3c.github.io/IntersectionObserver/#intersection-observer-entry
   * @param {Object} entry A dictionary of instance properties.
   * @constructor
   */
  function IntersectionObserverEntry(entry) {
    this.time = entry.time;
    this.target = entry.target;
    this.rootBounds = entry.rootBounds;
    this.boundingClientRect = entry.boundingClientRect;
    this.intersectionRect = entry.intersectionRect || getEmptyRect();
    this.isIntersecting = !!entry.intersectionRect;

    // Calculates the intersection ratio.
    var targetRect = this.boundingClientRect;
    var targetArea = targetRect.width * targetRect.height;
    var intersectionRect = this.intersectionRect;
    var intersectionArea = intersectionRect.width * intersectionRect.height;

    // Sets intersection ratio.
    if (targetArea) {
      this.intersectionRatio = intersectionArea / targetArea;
    } else {
      // If area is zero and is intersecting, sets to 1, otherwise to 0
      this.intersectionRatio = this.isIntersecting ? 1 : 0;
    }
  }

  /**
   * Creates the global IntersectionObserver constructor.
   * https://w3c.github.io/IntersectionObserver/#intersection-observer-interface
   * @param {Function} callback The function to be invoked after intersection
   *     changes have queued. The function is not invoked if the queue has
   *     been emptied by calling the `takeRecords` method.
   * @param {Object=} opt_options Optional configuration options.
   * @constructor
   */
  function IntersectionObserver(callback, opt_options) {

    var options = opt_options || {};

    if (typeof callback != 'function') {
      throw new Error('callback must be a function');
    }

    if (options.root && options.root.nodeType != 1) {
      throw new Error('root must be an Element');
    }

    // Binds and throttles `this._checkForIntersections`.
    this._checkForIntersections = throttle(this._checkForIntersections.bind(this), this.THROTTLE_TIMEOUT);

    // Private properties.
    this._callback = callback;
    this._observationTargets = [];
    this._queuedEntries = [];
    this._rootMarginValues = this._parseRootMargin(options.rootMargin);

    // Public properties.
    this.thresholds = this._initThresholds(options.threshold);
    this.root = options.root || null;
    this.rootMargin = this._rootMarginValues.map(function (margin) {
      return margin.value + margin.unit;
    }).join(' ');
  }

  /**
   * The minimum interval within which the document will be checked for
   * intersection changes.
   */
  IntersectionObserver.prototype.THROTTLE_TIMEOUT = 100;

  /**
   * The frequency in which the polyfill polls for intersection changes.
   * this can be updated on a per instance basis and must be set prior to
   * calling `observe` on the first target.
   */
  IntersectionObserver.prototype.POLL_INTERVAL = null;

  /**
   * Use a mutation observer on the root element
   * to detect intersection changes.
   */
  IntersectionObserver.prototype.USE_MUTATION_OBSERVER = true;

  /**
   * Starts observing a target element for intersection changes based on
   * the thresholds values.
   * @param {Element} target The DOM element to observe.
   */
  IntersectionObserver.prototype.observe = function (target) {
    var isTargetAlreadyObserved = this._observationTargets.some(function (item) {
      return item.element == target;
    });

    if (isTargetAlreadyObserved) {
      return;
    }

    if (!(target && target.nodeType == 1)) {
      throw new Error('target must be an Element');
    }

    this._registerInstance();
    this._observationTargets.push({ element: target, entry: null });
    this._monitorIntersections();
    this._checkForIntersections();
  };

  /**
   * Stops observing a target element for intersection changes.
   * @param {Element} target The DOM element to observe.
   */
  IntersectionObserver.prototype.unobserve = function (target) {
    this._observationTargets = this._observationTargets.filter(function (item) {

      return item.element != target;
    });
    if (!this._observationTargets.length) {
      this._unmonitorIntersections();
      this._unregisterInstance();
    }
  };

  /**
   * Stops observing all target elements for intersection changes.
   */
  IntersectionObserver.prototype.disconnect = function () {
    this._observationTargets = [];
    this._unmonitorIntersections();
    this._unregisterInstance();
  };

  /**
   * Returns any queue entries that have not yet been reported to the
   * callback and clears the queue. This can be used in conjunction with the
   * callback to obtain the absolute most up-to-date intersection information.
   * @return {Array} The currently queued entries.
   */
  IntersectionObserver.prototype.takeRecords = function () {
    var records = this._queuedEntries.slice();
    this._queuedEntries = [];
    return records;
  };

  /**
   * Accepts the threshold value from the user configuration object and
   * returns a sorted array of unique threshold values. If a value is not
   * between 0 and 1 and error is thrown.
   * @private
   * @param {Array|number=} opt_threshold An optional threshold value or
   *     a list of threshold values, defaulting to [0].
   * @return {Array} A sorted list of unique and valid threshold values.
   */
  IntersectionObserver.prototype._initThresholds = function (opt_threshold) {
    var threshold = opt_threshold || [0];
    if (!Array.isArray(threshold)) threshold = [threshold];

    return threshold.sort().filter(function (t, i, a) {
      if (typeof t != 'number' || isNaN(t) || t < 0 || t > 1) {
        throw new Error('threshold must be a number between 0 and 1 inclusively');
      }
      return t !== a[i - 1];
    });
  };

  /**
   * Accepts the rootMargin value from the user configuration object
   * and returns an array of the four margin values as an object containing
   * the value and unit properties. If any of the values are not properly
   * formatted or use a unit other than px or %, and error is thrown.
   * @private
   * @param {string=} opt_rootMargin An optional rootMargin value,
   *     defaulting to '0px'.
   * @return {Array<Object>} An array of margin objects with the keys
   *     value and unit.
   */
  IntersectionObserver.prototype._parseRootMargin = function (opt_rootMargin) {
    var marginString = opt_rootMargin || '0px';
    var margins = marginString.split(/\s+/).map(function (margin) {
      var parts = /^(-?\d*\.?\d+)(px|%)$/.exec(margin);
      if (!parts) {
        throw new Error('rootMargin must be specified in pixels or percent');
      }
      return { value: parseFloat(parts[1]), unit: parts[2] };
    });

    // Handles shorthand.
    margins[1] = margins[1] || margins[0];
    margins[2] = margins[2] || margins[0];
    margins[3] = margins[3] || margins[1];

    return margins;
  };

  /**
   * Starts polling for intersection changes if the polling is not already
   * happening, and if the page's visibilty state is visible.
   * @private
   */
  IntersectionObserver.prototype._monitorIntersections = function () {
    if (!this._monitoringIntersections) {
      this._monitoringIntersections = true;

      // If a poll interval is set, use polling instead of listening to
      // resize and scroll events or DOM mutations.
      if (this.POLL_INTERVAL) {
        this._monitoringInterval = setInterval(this._checkForIntersections, this.POLL_INTERVAL);
      } else {
        addEvent(window, 'resize', this._checkForIntersections, true);
        addEvent(document, 'scroll', this._checkForIntersections, true);

        if (this.USE_MUTATION_OBSERVER && 'MutationObserver' in window) {
          this._domObserver = new MutationObserver(this._checkForIntersections);
          this._domObserver.observe(document, {
            attributes: true,
            childList: true,
            characterData: true,
            subtree: true
          });
        }
      }
    }
  };

  /**
   * Stops polling for intersection changes.
   * @private
   */
  IntersectionObserver.prototype._unmonitorIntersections = function () {
    if (this._monitoringIntersections) {
      this._monitoringIntersections = false;

      clearInterval(this._monitoringInterval);
      this._monitoringInterval = null;

      removeEvent(window, 'resize', this._checkForIntersections, true);
      removeEvent(document, 'scroll', this._checkForIntersections, true);

      if (this._domObserver) {
        this._domObserver.disconnect();
        this._domObserver = null;
      }
    }
  };

  /**
   * Scans each observation target for intersection changes and adds them
   * to the internal entries queue. If new entries are found, it
   * schedules the callback to be invoked.
   * @private
   */
  IntersectionObserver.prototype._checkForIntersections = function () {
    var rootIsInDom = this._rootIsInDom();
    var rootRect = rootIsInDom ? this._getRootRect() : getEmptyRect();

    this._observationTargets.forEach(function (item) {
      var target = item.element;
      var targetRect = getBoundingClientRect(target);
      var rootContainsTarget = this._rootContainsTarget(target);
      var oldEntry = item.entry;
      var intersectionRect = rootIsInDom && rootContainsTarget && this._computeTargetAndRootIntersection(target, rootRect);

      var newEntry = item.entry = new IntersectionObserverEntry({
        time: now(),
        target: target,
        boundingClientRect: targetRect,
        rootBounds: rootRect,
        intersectionRect: intersectionRect
      });

      if (!oldEntry) {
        this._queuedEntries.push(newEntry);
      } else if (rootIsInDom && rootContainsTarget) {
        // If the new entry intersection ratio has crossed any of the
        // thresholds, add a new entry.
        if (this._hasCrossedThreshold(oldEntry, newEntry)) {
          this._queuedEntries.push(newEntry);
        }
      } else {
        // If the root is not in the DOM or target is not contained within
        // root but the previous entry for this target had an intersection,
        // add a new record indicating removal.
        if (oldEntry && oldEntry.isIntersecting) {
          this._queuedEntries.push(newEntry);
        }
      }
    }, this);

    if (this._queuedEntries.length) {
      this._callback(this.takeRecords(), this);
    }
  };

  /**
   * Accepts a target and root rect computes the intersection between then
   * following the algorithm in the spec.
   * TODO(philipwalton): at this time clip-path is not considered.
   * https://w3c.github.io/IntersectionObserver/#calculate-intersection-rect-algo
   * @param {Element} target The target DOM element
   * @param {Object} rootRect The bounding rect of the root after being
   *     expanded by the rootMargin value.
   * @return {?Object} The final intersection rect object or undefined if no
   *     intersection is found.
   * @private
   */
  IntersectionObserver.prototype._computeTargetAndRootIntersection = function (target, rootRect) {

    // If the element isn't displayed, an intersection can't happen.
    if (window.getComputedStyle(target).display == 'none') return;

    var targetRect = getBoundingClientRect(target);
    var intersectionRect = targetRect;
    var parent = getParentNode(target);
    var atRoot = false;

    while (!atRoot) {
      var parentRect = null;
      var parentComputedStyle = parent.nodeType == 1 ? window.getComputedStyle(parent) : {};

      // If the parent isn't displayed, an intersection can't happen.
      if (parentComputedStyle.display == 'none') return;

      if (parent == this.root || parent == document) {
        atRoot = true;
        parentRect = rootRect;
      } else {
        // If the element has a non-visible overflow, and it's not the <body>
        // or <html> element, update the intersection rect.
        // Note: <body> and <html> cannot be clipped to a rect that's not also
        // the document rect, so no need to compute a new intersection.
        if (parent != document.body && parent != document.documentElement && parentComputedStyle.overflow != 'visible') {
          parentRect = getBoundingClientRect(parent);
        }
      }

      // If either of the above conditionals set a new parentRect,
      // calculate new intersection data.
      if (parentRect) {
        intersectionRect = computeRectIntersection(parentRect, intersectionRect);

        if (!intersectionRect) break;
      }
      parent = getParentNode(parent);
    }
    return intersectionRect;
  };

  /**
   * Returns the root rect after being expanded by the rootMargin value.
   * @return {Object} The expanded root rect.
   * @private
   */
  IntersectionObserver.prototype._getRootRect = function () {
    var rootRect;
    if (this.root) {
      rootRect = getBoundingClientRect(this.root);
    } else {
      // Use <html>/<body> instead of window since scroll bars affect size.
      var html = document.documentElement;
      var body = document.body;
      rootRect = {
        top: 0,
        left: 0,
        right: html.clientWidth || body.clientWidth,
        width: html.clientWidth || body.clientWidth,
        bottom: html.clientHeight || body.clientHeight,
        height: html.clientHeight || body.clientHeight
      };
    }
    return this._expandRectByRootMargin(rootRect);
  };

  /**
   * Accepts a rect and expands it by the rootMargin value.
   * @param {Object} rect The rect object to expand.
   * @return {Object} The expanded rect.
   * @private
   */
  IntersectionObserver.prototype._expandRectByRootMargin = function (rect) {
    var margins = this._rootMarginValues.map(function (margin, i) {
      return margin.unit == 'px' ? margin.value : margin.value * (i % 2 ? rect.width : rect.height) / 100;
    });
    var newRect = {
      top: rect.top - margins[0],
      right: rect.right + margins[1],
      bottom: rect.bottom + margins[2],
      left: rect.left - margins[3]
    };
    newRect.width = newRect.right - newRect.left;
    newRect.height = newRect.bottom - newRect.top;

    return newRect;
  };

  /**
   * Accepts an old and new entry and returns true if at least one of the
   * threshold values has been crossed.
   * @param {?IntersectionObserverEntry} oldEntry The previous entry for a
   *    particular target element or null if no previous entry exists.
   * @param {IntersectionObserverEntry} newEntry The current entry for a
   *    particular target element.
   * @return {boolean} Returns true if a any threshold has been crossed.
   * @private
   */
  IntersectionObserver.prototype._hasCrossedThreshold = function (oldEntry, newEntry) {

    // To make comparing easier, an entry that has a ratio of 0
    // but does not actually intersect is given a value of -1
    var oldRatio = oldEntry && oldEntry.isIntersecting ? oldEntry.intersectionRatio || 0 : -1;
    var newRatio = newEntry.isIntersecting ? newEntry.intersectionRatio || 0 : -1;

    // Ignore unchanged ratios
    if (oldRatio === newRatio) return;

    for (var i = 0; i < this.thresholds.length; i++) {
      var threshold = this.thresholds[i];

      // Return true if an entry matches a threshold or if the new ratio
      // and the old ratio are on the opposite sides of a threshold.
      if (threshold == oldRatio || threshold == newRatio || threshold < oldRatio !== threshold < newRatio) {
        return true;
      }
    }
  };

  /**
   * Returns whether or not the root element is an element and is in the DOM.
   * @return {boolean} True if the root element is an element and is in the DOM.
   * @private
   */
  IntersectionObserver.prototype._rootIsInDom = function () {
    return !this.root || containsDeep(document, this.root);
  };

  /**
   * Returns whether or not the target element is a child of root.
   * @param {Element} target The target element to check.
   * @return {boolean} True if the target element is a child of root.
   * @private
   */
  IntersectionObserver.prototype._rootContainsTarget = function (target) {
    return containsDeep(this.root || document, target);
  };

  /**
   * Adds the instance to the global IntersectionObserver registry if it isn't
   * already present.
   * @private
   */
  IntersectionObserver.prototype._registerInstance = function () {
    if (registry.indexOf(this) < 0) {
      registry.push(this);
    }
  };

  /**
   * Removes the instance from the global IntersectionObserver registry.
   * @private
   */
  IntersectionObserver.prototype._unregisterInstance = function () {
    var index = registry.indexOf(this);
    if (index != -1) registry.splice(index, 1);
  };

  /**
   * Returns the result of the performance.now() method or null in browsers
   * that don't support the API.
   * @return {number} The elapsed time since the page was requested.
   */
  function now() {
    return window.performance && performance.now && performance.now();
  }

  /**
   * Throttles a function and delays its executiong, so it's only called at most
   * once within a given time period.
   * @param {Function} fn The function to throttle.
   * @param {number} timeout The amount of time that must pass before the
   *     function can be called again.
   * @return {Function} The throttled function.
   */
  function throttle(fn, timeout) {
    var timer = null;
    return function () {
      if (!timer) {
        timer = setTimeout(function () {
          fn();
          timer = null;
        }, timeout);
      }
    };
  }

  /**
   * Adds an event handler to a DOM node ensuring cross-browser compatibility.
   * @param {Node} node The DOM node to add the event handler to.
   * @param {string} event The event name.
   * @param {Function} fn The event handler to add.
   * @param {boolean} opt_useCapture Optionally adds the even to the capture
   *     phase. Note: this only works in modern browsers.
   */
  function addEvent(node, event, fn, opt_useCapture) {
    if (typeof node.addEventListener == 'function') {
      node.addEventListener(event, fn, opt_useCapture || false);
    } else if (typeof node.attachEvent == 'function') {
      node.attachEvent('on' + event, fn);
    }
  }

  /**
   * Removes a previously added event handler from a DOM node.
   * @param {Node} node The DOM node to remove the event handler from.
   * @param {string} event The event name.
   * @param {Function} fn The event handler to remove.
   * @param {boolean} opt_useCapture If the event handler was added with this
   *     flag set to true, it should be set to true here in order to remove it.
   */
  function removeEvent(node, event, fn, opt_useCapture) {
    if (typeof node.removeEventListener == 'function') {
      node.removeEventListener(event, fn, opt_useCapture || false);
    } else if (typeof node.detatchEvent == 'function') {
      node.detatchEvent('on' + event, fn);
    }
  }

  /**
   * Returns the intersection between two rect objects.
   * @param {Object} rect1 The first rect.
   * @param {Object} rect2 The second rect.
   * @return {?Object} The intersection rect or undefined if no intersection
   *     is found.
   */
  function computeRectIntersection(rect1, rect2) {
    var top = Math.max(rect1.top, rect2.top);
    var bottom = Math.min(rect1.bottom, rect2.bottom);
    var left = Math.max(rect1.left, rect2.left);
    var right = Math.min(rect1.right, rect2.right);
    var width = right - left;
    var height = bottom - top;

    return width >= 0 && height >= 0 && {
      top: top,
      bottom: bottom,
      left: left,
      right: right,
      width: width,
      height: height
    };
  }

  /**
   * Shims the native getBoundingClientRect for compatibility with older IE.
   * @param {Element} el The element whose bounding rect to get.
   * @return {Object} The (possibly shimmed) rect of the element.
   */
  function getBoundingClientRect(el) {
    var rect;

    try {
      rect = el.getBoundingClientRect();
    } catch (err) {
      // Ignore Windows 7 IE11 "Unspecified error"
      // https://github.com/w3c/IntersectionObserver/pull/205
    }

    if (!rect) return getEmptyRect();

    // Older IE
    if (!(rect.width && rect.height)) {
      rect = {
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
        width: rect.right - rect.left,
        height: rect.bottom - rect.top
      };
    }
    return rect;
  }

  /**
   * Returns an empty rect object. An empty rect is returned when an element
   * is not in the DOM.
   * @return {Object} The empty rect.
   */
  function getEmptyRect() {
    return {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      width: 0,
      height: 0
    };
  }

  /**
   * Checks to see if a parent element contains a child elemnt (including inside
   * shadow DOM).
   * @param {Node} parent The parent element.
   * @param {Node} child The child element.
   * @return {boolean} True if the parent node contains the child node.
   */
  function containsDeep(parent, child) {
    var node = child;
    while (node) {
      if (node == parent) return true;

      node = getParentNode(node);
    }
    return false;
  }

  /**
   * Gets the parent node of an element or its host element if the parent node
   * is a shadow root.
   * @param {Node} node The node whose parent to get.
   * @return {Node|null} The parent node or null if no parent exists.
   */
  function getParentNode(node) {
    var parent = node.parentNode;

    if (parent && parent.nodeType == 11 && parent.host) {
      // If the parent is a shadow root, return the host element.
      return parent.host;
    }
    return parent;
  }

  // Exposes the constructors globally.
  window.IntersectionObserver = IntersectionObserver;
  window.IntersectionObserverEntry = IntersectionObserverEntry;
})(window, document);
/* Font Face Observer v2.0.13 - © Bram Stein. License: BSD-3-Clause */(function () {
  'use strict';
  var f,
      g = [];function l(a) {
    g.push(a);1 == g.length && f();
  }function m() {
    for (; g.length;) g[0](), g.shift();
  }f = function () {
    setTimeout(m);
  };function n(a) {
    this.a = p;this.b = void 0;this.f = [];var b = this;try {
      a(function (a) {
        q(b, a);
      }, function (a) {
        r(b, a);
      });
    } catch (c) {
      r(b, c);
    }
  }var p = 2;function t(a) {
    return new n(function (b, c) {
      c(a);
    });
  }function u(a) {
    return new n(function (b) {
      b(a);
    });
  }function q(a, b) {
    if (a.a == p) {
      if (b == a) throw new TypeError();var c = !1;try {
        var d = b && b.then;if (null != b && "object" == typeof b && "function" == typeof d) {
          d.call(b, function (b) {
            c || q(a, b);c = !0;
          }, function (b) {
            c || r(a, b);c = !0;
          });return;
        }
      } catch (e) {
        c || r(a, e);return;
      }a.a = 0;a.b = b;v(a);
    }
  }
  function r(a, b) {
    if (a.a == p) {
      if (b == a) throw new TypeError();a.a = 1;a.b = b;v(a);
    }
  }function v(a) {
    l(function () {
      if (a.a != p) for (; a.f.length;) {
        var b = a.f.shift(),
            c = b[0],
            d = b[1],
            e = b[2],
            b = b[3];try {
          0 == a.a ? "function" == typeof c ? e(c.call(void 0, a.b)) : e(a.b) : 1 == a.a && ("function" == typeof d ? e(d.call(void 0, a.b)) : b(a.b));
        } catch (h) {
          b(h);
        }
      }
    });
  }n.prototype.g = function (a) {
    return this.c(void 0, a);
  };n.prototype.c = function (a, b) {
    var c = this;return new n(function (d, e) {
      c.f.push([a, b, d, e]);v(c);
    });
  };
  function w(a) {
    return new n(function (b, c) {
      function d(c) {
        return function (d) {
          h[c] = d;e += 1;e == a.length && b(h);
        };
      }var e = 0,
          h = [];0 == a.length && b(h);for (var k = 0; k < a.length; k += 1) u(a[k]).c(d(k), c);
    });
  }function x(a) {
    return new n(function (b, c) {
      for (var d = 0; d < a.length; d += 1) u(a[d]).c(b, c);
    });
  };window.Promise || (window.Promise = n, window.Promise.resolve = u, window.Promise.reject = t, window.Promise.race = x, window.Promise.all = w, window.Promise.prototype.then = n.prototype.c, window.Promise.prototype["catch"] = n.prototype.g);
})();

(function () {
  function l(a, b) {
    document.addEventListener ? a.addEventListener("scroll", b, !1) : a.attachEvent("scroll", b);
  }function m(a) {
    document.body ? a() : document.addEventListener ? document.addEventListener("DOMContentLoaded", function c() {
      document.removeEventListener("DOMContentLoaded", c);a();
    }) : document.attachEvent("onreadystatechange", function k() {
      if ("interactive" == document.readyState || "complete" == document.readyState) document.detachEvent("onreadystatechange", k), a();
    });
  };function r(a) {
    this.a = document.createElement("div");this.a.setAttribute("aria-hidden", "true");this.a.appendChild(document.createTextNode(a));this.b = document.createElement("span");this.c = document.createElement("span");this.h = document.createElement("span");this.f = document.createElement("span");this.g = -1;this.b.style.cssText = "max-width:none;display:inline-block;position:absolute;height:100%;width:100%;overflow:scroll;font-size:16px;";this.c.style.cssText = "max-width:none;display:inline-block;position:absolute;height:100%;width:100%;overflow:scroll;font-size:16px;";
    this.f.style.cssText = "max-width:none;display:inline-block;position:absolute;height:100%;width:100%;overflow:scroll;font-size:16px;";this.h.style.cssText = "display:inline-block;width:200%;height:200%;font-size:16px;max-width:none;";this.b.appendChild(this.h);this.c.appendChild(this.f);this.a.appendChild(this.b);this.a.appendChild(this.c);
  }
  function t(a, b) {
    a.a.style.cssText = "max-width:none;min-width:20px;min-height:20px;display:inline-block;overflow:hidden;position:absolute;width:auto;margin:0;padding:0;top:-999px;white-space:nowrap;font-synthesis:none;font:" + b + ";";
  }function y(a) {
    var b = a.a.offsetWidth,
        c = b + 100;a.f.style.width = c + "px";a.c.scrollLeft = c;a.b.scrollLeft = a.b.scrollWidth + 100;return a.g !== b ? (a.g = b, !0) : !1;
  }function z(a, b) {
    function c() {
      var a = k;y(a) && a.a.parentNode && b(a.g);
    }var k = a;l(a.b, c);l(a.c, c);y(a);
  };function A(a, b) {
    var c = b || {};this.family = a;this.style = c.style || "normal";this.weight = c.weight || "normal";this.stretch = c.stretch || "normal";
  }var B = null,
      C = null,
      E = null,
      F = null;function G() {
    if (null === C) if (J() && /Apple/.test(window.navigator.vendor)) {
      var a = /AppleWebKit\/([0-9]+)(?:\.([0-9]+))(?:\.([0-9]+))/.exec(window.navigator.userAgent);C = !!a && 603 > parseInt(a[1], 10);
    } else C = !1;return C;
  }function J() {
    null === F && (F = !!document.fonts);return F;
  }
  function K() {
    if (null === E) {
      var a = document.createElement("div");try {
        a.style.font = "condensed 100px sans-serif";
      } catch (b) {}E = "" !== a.style.font;
    }return E;
  }function L(a, b) {
    return [a.style, a.weight, K() ? a.stretch : "", "100px", b].join(" ");
  }
  A.prototype.load = function (a, b) {
    var c = this,
        k = a || "BESbswy",
        q = 0,
        D = b || 3E3,
        H = new Date().getTime();return new Promise(function (a, b) {
      if (J() && !G()) {
        var M = new Promise(function (a, b) {
          function e() {
            new Date().getTime() - H >= D ? b() : document.fonts.load(L(c, '"' + c.family + '"'), k).then(function (c) {
              1 <= c.length ? a() : setTimeout(e, 25);
            }, function () {
              b();
            });
          }e();
        }),
            N = new Promise(function (a, c) {
          q = setTimeout(c, D);
        });Promise.race([N, M]).then(function () {
          clearTimeout(q);a(c);
        }, function () {
          b(c);
        });
      } else m(function () {
        function u() {
          var b;if (b = -1 != f && -1 != g || -1 != f && -1 != h || -1 != g && -1 != h) (b = f != g && f != h && g != h) || (null === B && (b = /AppleWebKit\/([0-9]+)(?:\.([0-9]+))/.exec(window.navigator.userAgent), B = !!b && (536 > parseInt(b[1], 10) || 536 === parseInt(b[1], 10) && 11 >= parseInt(b[2], 10))), b = B && (f == v && g == v && h == v || f == w && g == w && h == w || f == x && g == x && h == x)), b = !b;b && (d.parentNode && d.parentNode.removeChild(d), clearTimeout(q), a(c));
        }function I() {
          if (new Date().getTime() - H >= D) d.parentNode && d.parentNode.removeChild(d), b(c);else {
            var a = document.hidden;if (!0 === a || void 0 === a) f = e.a.offsetWidth, g = n.a.offsetWidth, h = p.a.offsetWidth, u();q = setTimeout(I, 50);
          }
        }var e = new r(k),
            n = new r(k),
            p = new r(k),
            f = -1,
            g = -1,
            h = -1,
            v = -1,
            w = -1,
            x = -1,
            d = document.createElement("div");d.dir = "ltr";t(e, L(c, "sans-serif"));t(n, L(c, "serif"));t(p, L(c, "monospace"));d.appendChild(e.a);d.appendChild(n.a);d.appendChild(p.a);document.body.appendChild(d);v = e.a.offsetWidth;w = n.a.offsetWidth;x = p.a.offsetWidth;I();z(e, function (a) {
          f = a;u();
        });t(e, L(c, '"' + c.family + '",sans-serif'));z(n, function (a) {
          g = a;u();
        });t(n, L(c, '"' + c.family + '",serif'));
        z(p, function (a) {
          h = a;u();
        });t(p, L(c, '"' + c.family + '",monospace'));
      });
    });
  };"object" === typeof module ? module.exports = A : (window.FontFaceObserver = A, window.FontFaceObserver.prototype.load = A.prototype.load);
})();
/*! lozad.js - v1.4.0 - 2018-04-22
* https://github.com/ApoorvSaxena/lozad.js
* Copyright (c) 2018 Apoorv Saxena; Licensed MIT */
!function (t, e) {
  "object" == typeof exports && "undefined" != typeof module ? module.exports = e() : "function" == typeof define && define.amd ? define(e) : t.lozad = e();
}(this, function () {
  "use strict";
  function t(t) {
    t.setAttribute("data-loaded", !0);
  }var e = Object.assign || function (t) {
    for (var e = 1; e < arguments.length; e++) {
      var r = arguments[e];for (var n in r) Object.prototype.hasOwnProperty.call(r, n) && (t[n] = r[n]);
    }return t;
  },
      r = document.documentMode,
      n = { rootMargin: "0px", threshold: 0, load: function (t) {
      if ("picture" === t.nodeName.toLowerCase()) {
        var e = document.createElement("img");r && t.getAttribute("data-iesrc") && (e.src = t.getAttribute("data-iesrc")), t.appendChild(e);
      }t.getAttribute("data-src") && (t.src = t.getAttribute("data-src")), t.getAttribute("data-srcset") && (t.srcset = t.getAttribute("data-srcset")), t.getAttribute("data-background-image") && (t.style.backgroundImage = "url('" + t.getAttribute("data-background-image") + "')");
    }, loaded: function () {} },
      o = function (t) {
    return "true" === t.getAttribute("data-loaded");
  },
      a = function (e, r) {
    return function (n, a) {
      n.forEach(function (n) {
        n.intersectionRatio > 0 && (a.unobserve(n.target), o(n.target) || (e(n.target), t(n.target), r(n.target)));
      });
    };
  },
      i = function (t) {
    return t instanceof Element ? [t] : t instanceof NodeList ? t : document.querySelectorAll(t);
  };return function () {
    var r = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : ".lozad",
        d = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {},
        u = e({}, n, d),
        c = u.rootMargin,
        s = u.threshold,
        g = u.load,
        f = u.loaded,
        l = void 0;return window.IntersectionObserver && (l = new IntersectionObserver(a(g, f), { rootMargin: c, threshold: s })), { observe: function () {
        for (var e = i(r), n = 0; n < e.length; n++) o(e[n]) || (l ? l.observe(e[n]) : (g(e[n]), t(e[n]), f(e[n])));
      }, triggerLoad: function (e) {
        o(e) || (g(e), t(e), f(e));
      } };
  };
});
/**
 * Frontend helper functions
 *
 * @author Martin Szymanski <martin@elfacht.com>
 */

'use strict';

const Helper = {

    /**
     * Check if element has a certain class
     * @param {Object} $target – the target element
     * @param {String} className – the class name to check
     * @return {Boolean}
     */
    elHasClass($target, className) {
        return new RegExp('(\\s|^)' + className + '(\\s|$)').test($target.className);
    },

    /**
     * Toggle CSS classes of element
     *
     * @param  {Object} $element  [target element]
     * @param  {String} className [CSS class name, without '.']
     * @return {Function} toggle classes
     */
    toggleClasses($element, className) {
        if ($element.classList) {
            $element.classList.toggle(className);
        } else {
            const classes = $element.className.split(' ');
            const existingIndex = classes.indexOf(className);

            if (existingIndex >= 0) classes.splice(existingIndex, 1);else classes.push(className);

            $element.className = classes.join(' ');
        }
    },

    /**
     * Add classes to an element
     * @param {Object} $element
     * @param {String} className
     * @return {Function}
     */
    addClasses($element, className) {
        if ($element.classList) {
            $element.classList.add(className);
        } else {
            $element.className += ' ' + className;
        }
    },

    /**
     * Remove classes from an element
     * @param {Object} $element
     * @param {String} className
     * @return {Function}
     */
    removeClasses($element, className) {
        if ($element.classList) {
            $element.classList.remove(className);
        } else {
            $element.className = $element.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
        }
    },

    /**
     * Find closest element (class) of given element
     * Source: http://stackoverflow.com/a/24107550
     *
     * @param {Object} el – given element | required
     * @param {String} selector – closest selector to finde | required
     * @return {Object}
     */
    findClosest(el, selector) {
        let matchesFn;

        // find vendor prefix
        ['matches', 'webkitMatchesSelector', 'mozMatchesSelector', 'msMatchesSelector', 'oMatchesSelector'].some(function (fn) {
            if (typeof document.body[fn] === 'function') {
                matchesFn = fn;
                return true;
            }
            return false;
        });

        let parent;

        // traverse parents
        while (el) {
            parent = el.parentElement;
            if (parent && parent[matchesFn](selector)) {
                return parent;
            }
            el = parent;
        }

        return null;
    },

    /**
     * Get document height
     *
     * @return {Number} [returns height]
     */
    getDocumentHeight() {
        const body = document.body;
        const html = document.documentElement;
        const height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);

        return height;
    }
};
/**
 * Adding SVG sprite to localStorage with
 * fallback for older browsers.
 *
 * IMPORTANT: Update `revision` if the SVG file has any changes!
 *
 * @see https://osvaldas.info/caching-svg-sprite-in-localstorage
 * @see https://osvaldas.info/examples/caching-svg-sprite-in-localstorage/
 *
 */

'use strict';

// A part of the fallback for browsers that do not support SVG

if (!document.createElementNS || !document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect) {
	document.createElement('svg');
	document.createElement('use');
}

// Storing SVG Sprite in localStorage

;(function (window, document) {
	// 'use strict';

	/**
  * TODO: Update filename here!!!
  * @type {String}
  */
	var file = '/assets/svg/svg.html',


	// TODO: Must be updated after filechange!
	// TODO: Use the PHP solution: https://osvaldas.info/caching-svg-sprite-in-localstorage
	revision = 9;

	if (!document.createElementNS || !document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect) {
		return true;
	}

	var isLocalStorage = 'localStorage' in window && window['localStorage'] !== null,
	    request,
	    data,
	    insertIT = function () {

		document.querySelector('.js-svg').insertAdjacentHTML('afterbegin', data);
	},
	    insert = function () {
		if (document.body) {
			insertIT();
		} else {
			document.addEventListener('DOMContentLoaded', insertIT);
		}
	};

	if (isLocalStorage && localStorage.getItem('inlineSVGrev') === revision) {
		data = localStorage.getItem('inlineSVGdata');
		if (data) {
			insert();
			return true;
		}
	}

	try {
		request = new XMLHttpRequest();
		request.open('GET', file, true);
		request.onload = function () {

			if (request.status >= 200 && request.status < 400) {
				data = request.responseText;
				insert();

				if (isLocalStorage) {
					localStorage.setItem('inlineSVGdata', data);
					localStorage.setItem('inlineSVGrev', revision);
				}
			}
		};

		request.send();
	} catch (e) {}
})(window, document);

// Fallback for browsers that do not support SVG

;(function (window, document) {
	if (document.createElementNS && document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect) {
		return true;
	}

	var uses = document.getElementsByTagName('use'),
	    use;
	while (use = uses[0]) {
		var svg = use.parentNode,
		    img = new Image();
		img.src = use.getAttribute('data-img');
		svg.parentNode.replaceChild(img, svg);
	}
})(window, document);
(function () {
  /**
   * Intersection observer for lozad.js
   */
  const observer = lozad(); // lazy loads elements with default selector as ".lozad"
  observer.observe();

  /**
   * Font Observer
   */
  var font = new FontFaceObserver('SpilloutSans');

  font.load().then(function () {
    document.documentElement.className += ' fonts--loaded';
  });
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImludGVyc2VjdGlvbi1vYnNlcnZlci5qcyIsImZvbnRmYWNlb2JzZXJ2ZXIuanMiLCJsb3phZC5qcyIsImhlbHBlci5qcyIsInN2Zy5qcyIsImFwcC5qcyJdLCJuYW1lcyI6WyJ3aW5kb3ciLCJkb2N1bWVudCIsIkludGVyc2VjdGlvbk9ic2VydmVyRW50cnkiLCJwcm90b3R5cGUiLCJPYmplY3QiLCJkZWZpbmVQcm9wZXJ0eSIsImdldCIsImludGVyc2VjdGlvblJhdGlvIiwicmVnaXN0cnkiLCJlbnRyeSIsInRpbWUiLCJ0YXJnZXQiLCJyb290Qm91bmRzIiwiYm91bmRpbmdDbGllbnRSZWN0IiwiaW50ZXJzZWN0aW9uUmVjdCIsImdldEVtcHR5UmVjdCIsImlzSW50ZXJzZWN0aW5nIiwidGFyZ2V0UmVjdCIsInRhcmdldEFyZWEiLCJ3aWR0aCIsImhlaWdodCIsImludGVyc2VjdGlvbkFyZWEiLCJJbnRlcnNlY3Rpb25PYnNlcnZlciIsImNhbGxiYWNrIiwib3B0X29wdGlvbnMiLCJvcHRpb25zIiwiRXJyb3IiLCJyb290Iiwibm9kZVR5cGUiLCJfY2hlY2tGb3JJbnRlcnNlY3Rpb25zIiwidGhyb3R0bGUiLCJiaW5kIiwiVEhST1RUTEVfVElNRU9VVCIsIl9jYWxsYmFjayIsIl9vYnNlcnZhdGlvblRhcmdldHMiLCJfcXVldWVkRW50cmllcyIsIl9yb290TWFyZ2luVmFsdWVzIiwiX3BhcnNlUm9vdE1hcmdpbiIsInJvb3RNYXJnaW4iLCJ0aHJlc2hvbGRzIiwiX2luaXRUaHJlc2hvbGRzIiwidGhyZXNob2xkIiwibWFwIiwibWFyZ2luIiwidmFsdWUiLCJ1bml0Iiwiam9pbiIsIlBPTExfSU5URVJWQUwiLCJVU0VfTVVUQVRJT05fT0JTRVJWRVIiLCJvYnNlcnZlIiwiaXNUYXJnZXRBbHJlYWR5T2JzZXJ2ZWQiLCJzb21lIiwiaXRlbSIsImVsZW1lbnQiLCJfcmVnaXN0ZXJJbnN0YW5jZSIsInB1c2giLCJfbW9uaXRvckludGVyc2VjdGlvbnMiLCJ1bm9ic2VydmUiLCJmaWx0ZXIiLCJsZW5ndGgiLCJfdW5tb25pdG9ySW50ZXJzZWN0aW9ucyIsIl91bnJlZ2lzdGVySW5zdGFuY2UiLCJkaXNjb25uZWN0IiwidGFrZVJlY29yZHMiLCJyZWNvcmRzIiwic2xpY2UiLCJvcHRfdGhyZXNob2xkIiwiQXJyYXkiLCJpc0FycmF5Iiwic29ydCIsInQiLCJpIiwiYSIsImlzTmFOIiwib3B0X3Jvb3RNYXJnaW4iLCJtYXJnaW5TdHJpbmciLCJtYXJnaW5zIiwic3BsaXQiLCJwYXJ0cyIsImV4ZWMiLCJwYXJzZUZsb2F0IiwiX21vbml0b3JpbmdJbnRlcnNlY3Rpb25zIiwiX21vbml0b3JpbmdJbnRlcnZhbCIsInNldEludGVydmFsIiwiYWRkRXZlbnQiLCJfZG9tT2JzZXJ2ZXIiLCJNdXRhdGlvbk9ic2VydmVyIiwiYXR0cmlidXRlcyIsImNoaWxkTGlzdCIsImNoYXJhY3RlckRhdGEiLCJzdWJ0cmVlIiwiY2xlYXJJbnRlcnZhbCIsInJlbW92ZUV2ZW50Iiwicm9vdElzSW5Eb20iLCJfcm9vdElzSW5Eb20iLCJyb290UmVjdCIsIl9nZXRSb290UmVjdCIsImZvckVhY2giLCJnZXRCb3VuZGluZ0NsaWVudFJlY3QiLCJyb290Q29udGFpbnNUYXJnZXQiLCJfcm9vdENvbnRhaW5zVGFyZ2V0Iiwib2xkRW50cnkiLCJfY29tcHV0ZVRhcmdldEFuZFJvb3RJbnRlcnNlY3Rpb24iLCJuZXdFbnRyeSIsIm5vdyIsIl9oYXNDcm9zc2VkVGhyZXNob2xkIiwiZ2V0Q29tcHV0ZWRTdHlsZSIsImRpc3BsYXkiLCJwYXJlbnQiLCJnZXRQYXJlbnROb2RlIiwiYXRSb290IiwicGFyZW50UmVjdCIsInBhcmVudENvbXB1dGVkU3R5bGUiLCJib2R5IiwiZG9jdW1lbnRFbGVtZW50Iiwib3ZlcmZsb3ciLCJjb21wdXRlUmVjdEludGVyc2VjdGlvbiIsImh0bWwiLCJ0b3AiLCJsZWZ0IiwicmlnaHQiLCJjbGllbnRXaWR0aCIsImJvdHRvbSIsImNsaWVudEhlaWdodCIsIl9leHBhbmRSZWN0QnlSb290TWFyZ2luIiwicmVjdCIsIm5ld1JlY3QiLCJvbGRSYXRpbyIsIm5ld1JhdGlvIiwiY29udGFpbnNEZWVwIiwiaW5kZXhPZiIsImluZGV4Iiwic3BsaWNlIiwicGVyZm9ybWFuY2UiLCJmbiIsInRpbWVvdXQiLCJ0aW1lciIsInNldFRpbWVvdXQiLCJub2RlIiwiZXZlbnQiLCJvcHRfdXNlQ2FwdHVyZSIsImFkZEV2ZW50TGlzdGVuZXIiLCJhdHRhY2hFdmVudCIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJkZXRhdGNoRXZlbnQiLCJyZWN0MSIsInJlY3QyIiwiTWF0aCIsIm1heCIsIm1pbiIsImVsIiwiZXJyIiwiY2hpbGQiLCJwYXJlbnROb2RlIiwiaG9zdCIsImYiLCJnIiwibCIsIm0iLCJzaGlmdCIsIm4iLCJwIiwiYiIsInEiLCJyIiwiYyIsInUiLCJUeXBlRXJyb3IiLCJkIiwidGhlbiIsImNhbGwiLCJlIiwidiIsImgiLCJ3IiwiayIsIngiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsInJhY2UiLCJhbGwiLCJyZWFkeVN0YXRlIiwiZGV0YWNoRXZlbnQiLCJjcmVhdGVFbGVtZW50Iiwic2V0QXR0cmlidXRlIiwiYXBwZW5kQ2hpbGQiLCJjcmVhdGVUZXh0Tm9kZSIsInN0eWxlIiwiY3NzVGV4dCIsInkiLCJvZmZzZXRXaWR0aCIsInNjcm9sbExlZnQiLCJzY3JvbGxXaWR0aCIsInoiLCJBIiwiZmFtaWx5Iiwid2VpZ2h0Iiwic3RyZXRjaCIsIkIiLCJDIiwiRSIsIkYiLCJHIiwiSiIsInRlc3QiLCJuYXZpZ2F0b3IiLCJ2ZW5kb3IiLCJ1c2VyQWdlbnQiLCJwYXJzZUludCIsImZvbnRzIiwiSyIsImZvbnQiLCJMIiwibG9hZCIsIkQiLCJIIiwiRGF0ZSIsImdldFRpbWUiLCJNIiwiTiIsImNsZWFyVGltZW91dCIsInJlbW92ZUNoaWxkIiwiSSIsImhpZGRlbiIsImRpciIsIm1vZHVsZSIsImV4cG9ydHMiLCJGb250RmFjZU9ic2VydmVyIiwiZGVmaW5lIiwiYW1kIiwibG96YWQiLCJhc3NpZ24iLCJhcmd1bWVudHMiLCJoYXNPd25Qcm9wZXJ0eSIsImRvY3VtZW50TW9kZSIsIm5vZGVOYW1lIiwidG9Mb3dlckNhc2UiLCJnZXRBdHRyaWJ1dGUiLCJzcmMiLCJzcmNzZXQiLCJiYWNrZ3JvdW5kSW1hZ2UiLCJsb2FkZWQiLCJvIiwiRWxlbWVudCIsIk5vZGVMaXN0IiwicXVlcnlTZWxlY3RvckFsbCIsInMiLCJ0cmlnZ2VyTG9hZCIsIkhlbHBlciIsImVsSGFzQ2xhc3MiLCIkdGFyZ2V0IiwiY2xhc3NOYW1lIiwiUmVnRXhwIiwidG9nZ2xlQ2xhc3NlcyIsIiRlbGVtZW50IiwiY2xhc3NMaXN0IiwidG9nZ2xlIiwiY2xhc3NlcyIsImV4aXN0aW5nSW5kZXgiLCJhZGRDbGFzc2VzIiwiYWRkIiwicmVtb3ZlQ2xhc3NlcyIsInJlbW92ZSIsInJlcGxhY2UiLCJmaW5kQ2xvc2VzdCIsInNlbGVjdG9yIiwibWF0Y2hlc0ZuIiwicGFyZW50RWxlbWVudCIsImdldERvY3VtZW50SGVpZ2h0Iiwic2Nyb2xsSGVpZ2h0Iiwib2Zmc2V0SGVpZ2h0IiwiY3JlYXRlRWxlbWVudE5TIiwiY3JlYXRlU1ZHUmVjdCIsImZpbGUiLCJyZXZpc2lvbiIsImlzTG9jYWxTdG9yYWdlIiwicmVxdWVzdCIsImRhdGEiLCJpbnNlcnRJVCIsInF1ZXJ5U2VsZWN0b3IiLCJpbnNlcnRBZGphY2VudEhUTUwiLCJpbnNlcnQiLCJsb2NhbFN0b3JhZ2UiLCJnZXRJdGVtIiwiWE1MSHR0cFJlcXVlc3QiLCJvcGVuIiwib25sb2FkIiwic3RhdHVzIiwicmVzcG9uc2VUZXh0Iiwic2V0SXRlbSIsInNlbmQiLCJ1c2VzIiwiZ2V0RWxlbWVudHNCeVRhZ05hbWUiLCJ1c2UiLCJzdmciLCJpbWciLCJJbWFnZSIsInJlcGxhY2VDaGlsZCIsIm9ic2VydmVyIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7O0FBU0MsV0FBU0EsTUFBVCxFQUFpQkMsUUFBakIsRUFBMkI7QUFDNUI7O0FBR0E7QUFDQTs7QUFDQSxN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LGdCQUFKLENBQXFCLGNBQXJCLENBQVg7O0FBRUFoQixPQUFLRSxJQUFMLEdBQVk3QyxJQUFaLENBQWlCLFlBQVk7QUFDM0J4SyxhQUFTaUgsZUFBVCxDQUF5QjBJLFNBQXpCLElBQXNDLGdCQUF0QztBQUNELEdBRkQ7QUFRRCxDQXhCRCIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFczQyBTT0ZUV0FSRSBBTkQgRE9DVU1FTlQgTk9USUNFIEFORCBMSUNFTlNFLlxuICpcbiAqICBodHRwczovL3d3dy53My5vcmcvQ29uc29ydGl1bS9MZWdhbC8yMDE1L2NvcHlyaWdodC1zb2Z0d2FyZS1hbmQtZG9jdW1lbnRcbiAqXG4gKi9cblxuKGZ1bmN0aW9uKHdpbmRvdywgZG9jdW1lbnQpIHtcbid1c2Ugc3RyaWN0JztcblxuXG4vLyBFeGl0cyBlYXJseSBpZiBhbGwgSW50ZXJzZWN0aW9uT2JzZXJ2ZXIgYW5kIEludGVyc2VjdGlvbk9ic2VydmVyRW50cnlcbi8vIGZlYXR1cmVzIGFyZSBuYXRpdmVseSBzdXBwb3J0ZWQuXG5pZiAoJ0ludGVyc2VjdGlvbk9ic2VydmVyJyBpbiB3aW5kb3cgJiZcbiAgICAnSW50ZXJzZWN0aW9uT2JzZXJ2ZXJFbnRyeScgaW4gd2luZG93ICYmXG4gICAgJ2ludGVyc2VjdGlvblJhdGlvJyBpbiB3aW5kb3cuSW50ZXJzZWN0aW9uT2JzZXJ2ZXJFbnRyeS5wcm90b3R5cGUpIHtcblxuICAvLyBNaW5pbWFsIHBvbHlmaWxsIGZvciBFZGdlIDE1J3MgbGFjayBvZiBgaXNJbnRlcnNlY3RpbmdgXG4gIC8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL3czYy9JbnRlcnNlY3Rpb25PYnNlcnZlci9pc3N1ZXMvMjExXG4gIGlmICghKCdpc0ludGVyc2VjdGluZycgaW4gd2luZG93LkludGVyc2VjdGlvbk9ic2VydmVyRW50cnkucHJvdG90eXBlKSkge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh3aW5kb3cuSW50ZXJzZWN0aW9uT2JzZXJ2ZXJFbnRyeS5wcm90b3R5cGUsXG4gICAgICAnaXNJbnRlcnNlY3RpbmcnLCB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW50ZXJzZWN0aW9uUmF0aW8gPiAwO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIHJldHVybjtcbn1cblxuXG4vKipcbiAqIEFuIEludGVyc2VjdGlvbk9ic2VydmVyIHJlZ2lzdHJ5LiBUaGlzIHJlZ2lzdHJ5IGV4aXN0cyB0byBob2xkIGEgc3Ryb25nXG4gKiByZWZlcmVuY2UgdG8gSW50ZXJzZWN0aW9uT2JzZXJ2ZXIgaW5zdGFuY2VzIGN1cnJlbnRseSBvYnNlcnZlcmluZyBhIHRhcmdldFxuICogZWxlbWVudC4gV2l0aG91dCB0aGlzIHJlZ2lzdHJ5LCBpbnN0YW5jZXMgd2l0aG91dCBhbm90aGVyIHJlZmVyZW5jZSBtYXkgYmVcbiAqIGdhcmJhZ2UgY29sbGVjdGVkLlxuICovXG52YXIgcmVnaXN0cnkgPSBbXTtcblxuXG4vKipcbiAqIENyZWF0ZXMgdGhlIGdsb2JhbCBJbnRlcnNlY3Rpb25PYnNlcnZlckVudHJ5IGNvbnN0cnVjdG9yLlxuICogaHR0cHM6Ly93M2MuZ2l0aHViLmlvL0ludGVyc2VjdGlvbk9ic2VydmVyLyNpbnRlcnNlY3Rpb24tb2JzZXJ2ZXItZW50cnlcbiAqIEBwYXJhbSB7T2JqZWN0fSBlbnRyeSBBIGRpY3Rpb25hcnkgb2YgaW5zdGFuY2UgcHJvcGVydGllcy5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBJbnRlcnNlY3Rpb25PYnNlcnZlckVudHJ5KGVudHJ5KSB7XG4gIHRoaXMudGltZSA9IGVudHJ5LnRpbWU7XG4gIHRoaXMudGFyZ2V0ID0gZW50cnkudGFyZ2V0O1xuICB0aGlzLnJvb3RCb3VuZHMgPSBlbnRyeS5yb290Qm91bmRzO1xuICB0aGlzLmJvdW5kaW5nQ2xpZW50UmVjdCA9IGVudHJ5LmJvdW5kaW5nQ2xpZW50UmVjdDtcbiAgdGhpcy5pbnRlcnNlY3Rpb25SZWN0ID0gZW50cnkuaW50ZXJzZWN0aW9uUmVjdCB8fCBnZXRFbXB0eVJlY3QoKTtcbiAgdGhpcy5pc0ludGVyc2VjdGluZyA9ICEhZW50cnkuaW50ZXJzZWN0aW9uUmVjdDtcblxuICAvLyBDYWxjdWxhdGVzIHRoZSBpbnRlcnNlY3Rpb24gcmF0aW8uXG4gIHZhciB0YXJnZXRSZWN0ID0gdGhpcy5ib3VuZGluZ0NsaWVudFJlY3Q7XG4gIHZhciB0YXJnZXRBcmVhID0gdGFyZ2V0UmVjdC53aWR0aCAqIHRhcmdldFJlY3QuaGVpZ2h0O1xuICB2YXIgaW50ZXJzZWN0aW9uUmVjdCA9IHRoaXMuaW50ZXJzZWN0aW9uUmVjdDtcbiAgdmFyIGludGVyc2VjdGlvbkFyZWEgPSBpbnRlcnNlY3Rpb25SZWN0LndpZHRoICogaW50ZXJzZWN0aW9uUmVjdC5oZWlnaHQ7XG5cbiAgLy8gU2V0cyBpbnRlcnNlY3Rpb24gcmF0aW8uXG4gIGlmICh0YXJnZXRBcmVhKSB7XG4gICAgdGhpcy5pbnRlcnNlY3Rpb25SYXRpbyA9IGludGVyc2VjdGlvbkFyZWEgLyB0YXJnZXRBcmVhO1xuICB9IGVsc2Uge1xuICAgIC8vIElmIGFyZWEgaXMgemVybyBhbmQgaXMgaW50ZXJzZWN0aW5nLCBzZXRzIHRvIDEsIG90aGVyd2lzZSB0byAwXG4gICAgdGhpcy5pbnRlcnNlY3Rpb25SYXRpbyA9IHRoaXMuaXNJbnRlcnNlY3RpbmcgPyAxIDogMDtcbiAgfVxufVxuXG5cbi8qKlxuICogQ3JlYXRlcyB0aGUgZ2xvYmFsIEludGVyc2VjdGlvbk9ic2VydmVyIGNvbnN0cnVjdG9yLlxuICogaHR0cHM6Ly93M2MuZ2l0aHViLmlvL0ludGVyc2VjdGlvbk9ic2VydmVyLyNpbnRlcnNlY3Rpb24tb2JzZXJ2ZXItaW50ZXJmYWNlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBUaGUgZnVuY3Rpb24gdG8gYmUgaW52b2tlZCBhZnRlciBpbnRlcnNlY3Rpb25cbiAqICAgICBjaGFuZ2VzIGhhdmUgcXVldWVkLiBUaGUgZnVuY3Rpb24gaXMgbm90IGludm9rZWQgaWYgdGhlIHF1ZXVlIGhhc1xuICogICAgIGJlZW4gZW1wdGllZCBieSBjYWxsaW5nIHRoZSBgdGFrZVJlY29yZHNgIG1ldGhvZC5cbiAqIEBwYXJhbSB7T2JqZWN0PX0gb3B0X29wdGlvbnMgT3B0aW9uYWwgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIEludGVyc2VjdGlvbk9ic2VydmVyKGNhbGxiYWNrLCBvcHRfb3B0aW9ucykge1xuXG4gIHZhciBvcHRpb25zID0gb3B0X29wdGlvbnMgfHwge307XG5cbiAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgfVxuXG4gIGlmIChvcHRpb25zLnJvb3QgJiYgb3B0aW9ucy5yb290Lm5vZGVUeXBlICE9IDEpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Jvb3QgbXVzdCBiZSBhbiBFbGVtZW50Jyk7XG4gIH1cblxuICAvLyBCaW5kcyBhbmQgdGhyb3R0bGVzIGB0aGlzLl9jaGVja0ZvckludGVyc2VjdGlvbnNgLlxuICB0aGlzLl9jaGVja0ZvckludGVyc2VjdGlvbnMgPSB0aHJvdHRsZShcbiAgICAgIHRoaXMuX2NoZWNrRm9ySW50ZXJzZWN0aW9ucy5iaW5kKHRoaXMpLCB0aGlzLlRIUk9UVExFX1RJTUVPVVQpO1xuXG4gIC8vIFByaXZhdGUgcHJvcGVydGllcy5cbiAgdGhpcy5fY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgdGhpcy5fb2JzZXJ2YXRpb25UYXJnZXRzID0gW107XG4gIHRoaXMuX3F1ZXVlZEVudHJpZXMgPSBbXTtcbiAgdGhpcy5fcm9vdE1hcmdpblZhbHVlcyA9IHRoaXMuX3BhcnNlUm9vdE1hcmdpbihvcHRpb25zLnJvb3RNYXJnaW4pO1xuXG4gIC8vIFB1YmxpYyBwcm9wZXJ0aWVzLlxuICB0aGlzLnRocmVzaG9sZHMgPSB0aGlzLl9pbml0VGhyZXNob2xkcyhvcHRpb25zLnRocmVzaG9sZCk7XG4gIHRoaXMucm9vdCA9IG9wdGlvbnMucm9vdCB8fCBudWxsO1xuICB0aGlzLnJvb3RNYXJnaW4gPSB0aGlzLl9yb290TWFyZ2luVmFsdWVzLm1hcChmdW5jdGlvbihtYXJnaW4pIHtcbiAgICByZXR1cm4gbWFyZ2luLnZhbHVlICsgbWFyZ2luLnVuaXQ7XG4gIH0pLmpvaW4oJyAnKTtcbn1cblxuXG4vKipcbiAqIFRoZSBtaW5pbXVtIGludGVydmFsIHdpdGhpbiB3aGljaCB0aGUgZG9jdW1lbnQgd2lsbCBiZSBjaGVja2VkIGZvclxuICogaW50ZXJzZWN0aW9uIGNoYW5nZXMuXG4gKi9cbkludGVyc2VjdGlvbk9ic2VydmVyLnByb3RvdHlwZS5USFJPVFRMRV9USU1FT1VUID0gMTAwO1xuXG5cbi8qKlxuICogVGhlIGZyZXF1ZW5jeSBpbiB3aGljaCB0aGUgcG9seWZpbGwgcG9sbHMgZm9yIGludGVyc2VjdGlvbiBjaGFuZ2VzLlxuICogdGhpcyBjYW4gYmUgdXBkYXRlZCBvbiBhIHBlciBpbnN0YW5jZSBiYXNpcyBhbmQgbXVzdCBiZSBzZXQgcHJpb3IgdG9cbiAqIGNhbGxpbmcgYG9ic2VydmVgIG9uIHRoZSBmaXJzdCB0YXJnZXQuXG4gKi9cbkludGVyc2VjdGlvbk9ic2VydmVyLnByb3RvdHlwZS5QT0xMX0lOVEVSVkFMID0gbnVsbDtcblxuLyoqXG4gKiBVc2UgYSBtdXRhdGlvbiBvYnNlcnZlciBvbiB0aGUgcm9vdCBlbGVtZW50XG4gKiB0byBkZXRlY3QgaW50ZXJzZWN0aW9uIGNoYW5nZXMuXG4gKi9cbkludGVyc2VjdGlvbk9ic2VydmVyLnByb3RvdHlwZS5VU0VfTVVUQVRJT05fT0JTRVJWRVIgPSB0cnVlO1xuXG5cbi8qKlxuICogU3RhcnRzIG9ic2VydmluZyBhIHRhcmdldCBlbGVtZW50IGZvciBpbnRlcnNlY3Rpb24gY2hhbmdlcyBiYXNlZCBvblxuICogdGhlIHRocmVzaG9sZHMgdmFsdWVzLlxuICogQHBhcmFtIHtFbGVtZW50fSB0YXJnZXQgVGhlIERPTSBlbGVtZW50IHRvIG9ic2VydmUuXG4gKi9cbkludGVyc2VjdGlvbk9ic2VydmVyLnByb3RvdHlwZS5vYnNlcnZlID0gZnVuY3Rpb24odGFyZ2V0KSB7XG4gIHZhciBpc1RhcmdldEFscmVhZHlPYnNlcnZlZCA9IHRoaXMuX29ic2VydmF0aW9uVGFyZ2V0cy5zb21lKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICByZXR1cm4gaXRlbS5lbGVtZW50ID09IHRhcmdldDtcbiAgfSk7XG5cbiAgaWYgKGlzVGFyZ2V0QWxyZWFkeU9ic2VydmVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKCEodGFyZ2V0ICYmIHRhcmdldC5ub2RlVHlwZSA9PSAxKSkge1xuICAgIHRocm93IG5ldyBFcnJvcigndGFyZ2V0IG11c3QgYmUgYW4gRWxlbWVudCcpO1xuICB9XG5cbiAgdGhpcy5fcmVnaXN0ZXJJbnN0YW5jZSgpO1xuICB0aGlzLl9vYnNlcnZhdGlvblRhcmdldHMucHVzaCh7ZWxlbWVudDogdGFyZ2V0LCBlbnRyeTogbnVsbH0pO1xuICB0aGlzLl9tb25pdG9ySW50ZXJzZWN0aW9ucygpO1xuICB0aGlzLl9jaGVja0ZvckludGVyc2VjdGlvbnMoKTtcbn07XG5cblxuLyoqXG4gKiBTdG9wcyBvYnNlcnZpbmcgYSB0YXJnZXQgZWxlbWVudCBmb3IgaW50ZXJzZWN0aW9uIGNoYW5nZXMuXG4gKiBAcGFyYW0ge0VsZW1lbnR9IHRhcmdldCBUaGUgRE9NIGVsZW1lbnQgdG8gb2JzZXJ2ZS5cbiAqL1xuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLnVub2JzZXJ2ZSA9IGZ1bmN0aW9uKHRhcmdldCkge1xuICB0aGlzLl9vYnNlcnZhdGlvblRhcmdldHMgPVxuICAgICAgdGhpcy5fb2JzZXJ2YXRpb25UYXJnZXRzLmZpbHRlcihmdW5jdGlvbihpdGVtKSB7XG5cbiAgICByZXR1cm4gaXRlbS5lbGVtZW50ICE9IHRhcmdldDtcbiAgfSk7XG4gIGlmICghdGhpcy5fb2JzZXJ2YXRpb25UYXJnZXRzLmxlbmd0aCkge1xuICAgIHRoaXMuX3VubW9uaXRvckludGVyc2VjdGlvbnMoKTtcbiAgICB0aGlzLl91bnJlZ2lzdGVySW5zdGFuY2UoKTtcbiAgfVxufTtcblxuXG4vKipcbiAqIFN0b3BzIG9ic2VydmluZyBhbGwgdGFyZ2V0IGVsZW1lbnRzIGZvciBpbnRlcnNlY3Rpb24gY2hhbmdlcy5cbiAqL1xuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLmRpc2Nvbm5lY3QgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5fb2JzZXJ2YXRpb25UYXJnZXRzID0gW107XG4gIHRoaXMuX3VubW9uaXRvckludGVyc2VjdGlvbnMoKTtcbiAgdGhpcy5fdW5yZWdpc3Rlckluc3RhbmNlKCk7XG59O1xuXG5cbi8qKlxuICogUmV0dXJucyBhbnkgcXVldWUgZW50cmllcyB0aGF0IGhhdmUgbm90IHlldCBiZWVuIHJlcG9ydGVkIHRvIHRoZVxuICogY2FsbGJhY2sgYW5kIGNsZWFycyB0aGUgcXVldWUuIFRoaXMgY2FuIGJlIHVzZWQgaW4gY29uanVuY3Rpb24gd2l0aCB0aGVcbiAqIGNhbGxiYWNrIHRvIG9idGFpbiB0aGUgYWJzb2x1dGUgbW9zdCB1cC10by1kYXRlIGludGVyc2VjdGlvbiBpbmZvcm1hdGlvbi5cbiAqIEByZXR1cm4ge0FycmF5fSBUaGUgY3VycmVudGx5IHF1ZXVlZCBlbnRyaWVzLlxuICovXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUudGFrZVJlY29yZHMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHJlY29yZHMgPSB0aGlzLl9xdWV1ZWRFbnRyaWVzLnNsaWNlKCk7XG4gIHRoaXMuX3F1ZXVlZEVudHJpZXMgPSBbXTtcbiAgcmV0dXJuIHJlY29yZHM7XG59O1xuXG5cbi8qKlxuICogQWNjZXB0cyB0aGUgdGhyZXNob2xkIHZhbHVlIGZyb20gdGhlIHVzZXIgY29uZmlndXJhdGlvbiBvYmplY3QgYW5kXG4gKiByZXR1cm5zIGEgc29ydGVkIGFycmF5IG9mIHVuaXF1ZSB0aHJlc2hvbGQgdmFsdWVzLiBJZiBhIHZhbHVlIGlzIG5vdFxuICogYmV0d2VlbiAwIGFuZCAxIGFuZCBlcnJvciBpcyB0aHJvd24uXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheXxudW1iZXI9fSBvcHRfdGhyZXNob2xkIEFuIG9wdGlvbmFsIHRocmVzaG9sZCB2YWx1ZSBvclxuICogICAgIGEgbGlzdCBvZiB0aHJlc2hvbGQgdmFsdWVzLCBkZWZhdWx0aW5nIHRvIFswXS5cbiAqIEByZXR1cm4ge0FycmF5fSBBIHNvcnRlZCBsaXN0IG9mIHVuaXF1ZSBhbmQgdmFsaWQgdGhyZXNob2xkIHZhbHVlcy5cbiAqL1xuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLl9pbml0VGhyZXNob2xkcyA9IGZ1bmN0aW9uKG9wdF90aHJlc2hvbGQpIHtcbiAgdmFyIHRocmVzaG9sZCA9IG9wdF90aHJlc2hvbGQgfHwgWzBdO1xuICBpZiAoIUFycmF5LmlzQXJyYXkodGhyZXNob2xkKSkgdGhyZXNob2xkID0gW3RocmVzaG9sZF07XG5cbiAgcmV0dXJuIHRocmVzaG9sZC5zb3J0KCkuZmlsdGVyKGZ1bmN0aW9uKHQsIGksIGEpIHtcbiAgICBpZiAodHlwZW9mIHQgIT0gJ251bWJlcicgfHwgaXNOYU4odCkgfHwgdCA8IDAgfHwgdCA+IDEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcigndGhyZXNob2xkIG11c3QgYmUgYSBudW1iZXIgYmV0d2VlbiAwIGFuZCAxIGluY2x1c2l2ZWx5Jyk7XG4gICAgfVxuICAgIHJldHVybiB0ICE9PSBhW2kgLSAxXTtcbiAgfSk7XG59O1xuXG5cbi8qKlxuICogQWNjZXB0cyB0aGUgcm9vdE1hcmdpbiB2YWx1ZSBmcm9tIHRoZSB1c2VyIGNvbmZpZ3VyYXRpb24gb2JqZWN0XG4gKiBhbmQgcmV0dXJucyBhbiBhcnJheSBvZiB0aGUgZm91ciBtYXJnaW4gdmFsdWVzIGFzIGFuIG9iamVjdCBjb250YWluaW5nXG4gKiB0aGUgdmFsdWUgYW5kIHVuaXQgcHJvcGVydGllcy4gSWYgYW55IG9mIHRoZSB2YWx1ZXMgYXJlIG5vdCBwcm9wZXJseVxuICogZm9ybWF0dGVkIG9yIHVzZSBhIHVuaXQgb3RoZXIgdGhhbiBweCBvciAlLCBhbmQgZXJyb3IgaXMgdGhyb3duLlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7c3RyaW5nPX0gb3B0X3Jvb3RNYXJnaW4gQW4gb3B0aW9uYWwgcm9vdE1hcmdpbiB2YWx1ZSxcbiAqICAgICBkZWZhdWx0aW5nIHRvICcwcHgnLlxuICogQHJldHVybiB7QXJyYXk8T2JqZWN0Pn0gQW4gYXJyYXkgb2YgbWFyZ2luIG9iamVjdHMgd2l0aCB0aGUga2V5c1xuICogICAgIHZhbHVlIGFuZCB1bml0LlxuICovXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUuX3BhcnNlUm9vdE1hcmdpbiA9IGZ1bmN0aW9uKG9wdF9yb290TWFyZ2luKSB7XG4gIHZhciBtYXJnaW5TdHJpbmcgPSBvcHRfcm9vdE1hcmdpbiB8fCAnMHB4JztcbiAgdmFyIG1hcmdpbnMgPSBtYXJnaW5TdHJpbmcuc3BsaXQoL1xccysvKS5tYXAoZnVuY3Rpb24obWFyZ2luKSB7XG4gICAgdmFyIHBhcnRzID0gL14oLT9cXGQqXFwuP1xcZCspKHB4fCUpJC8uZXhlYyhtYXJnaW4pO1xuICAgIGlmICghcGFydHMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcigncm9vdE1hcmdpbiBtdXN0IGJlIHNwZWNpZmllZCBpbiBwaXhlbHMgb3IgcGVyY2VudCcpO1xuICAgIH1cbiAgICByZXR1cm4ge3ZhbHVlOiBwYXJzZUZsb2F0KHBhcnRzWzFdKSwgdW5pdDogcGFydHNbMl19O1xuICB9KTtcblxuICAvLyBIYW5kbGVzIHNob3J0aGFuZC5cbiAgbWFyZ2luc1sxXSA9IG1hcmdpbnNbMV0gfHwgbWFyZ2luc1swXTtcbiAgbWFyZ2luc1syXSA9IG1hcmdpbnNbMl0gfHwgbWFyZ2luc1swXTtcbiAgbWFyZ2luc1szXSA9IG1hcmdpbnNbM10gfHwgbWFyZ2luc1sxXTtcblxuICByZXR1cm4gbWFyZ2lucztcbn07XG5cblxuLyoqXG4gKiBTdGFydHMgcG9sbGluZyBmb3IgaW50ZXJzZWN0aW9uIGNoYW5nZXMgaWYgdGhlIHBvbGxpbmcgaXMgbm90IGFscmVhZHlcbiAqIGhhcHBlbmluZywgYW5kIGlmIHRoZSBwYWdlJ3MgdmlzaWJpbHR5IHN0YXRlIGlzIHZpc2libGUuXG4gKiBAcHJpdmF0ZVxuICovXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUuX21vbml0b3JJbnRlcnNlY3Rpb25zID0gZnVuY3Rpb24oKSB7XG4gIGlmICghdGhpcy5fbW9uaXRvcmluZ0ludGVyc2VjdGlvbnMpIHtcbiAgICB0aGlzLl9tb25pdG9yaW5nSW50ZXJzZWN0aW9ucyA9IHRydWU7XG5cbiAgICAvLyBJZiBhIHBvbGwgaW50ZXJ2YWwgaXMgc2V0LCB1c2UgcG9sbGluZyBpbnN0ZWFkIG9mIGxpc3RlbmluZyB0b1xuICAgIC8vIHJlc2l6ZSBhbmQgc2Nyb2xsIGV2ZW50cyBvciBET00gbXV0YXRpb25zLlxuICAgIGlmICh0aGlzLlBPTExfSU5URVJWQUwpIHtcbiAgICAgIHRoaXMuX21vbml0b3JpbmdJbnRlcnZhbCA9IHNldEludGVydmFsKFxuICAgICAgICAgIHRoaXMuX2NoZWNrRm9ySW50ZXJzZWN0aW9ucywgdGhpcy5QT0xMX0lOVEVSVkFMKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBhZGRFdmVudCh3aW5kb3csICdyZXNpemUnLCB0aGlzLl9jaGVja0ZvckludGVyc2VjdGlvbnMsIHRydWUpO1xuICAgICAgYWRkRXZlbnQoZG9jdW1lbnQsICdzY3JvbGwnLCB0aGlzLl9jaGVja0ZvckludGVyc2VjdGlvbnMsIHRydWUpO1xuXG4gICAgICBpZiAodGhpcy5VU0VfTVVUQVRJT05fT0JTRVJWRVIgJiYgJ011dGF0aW9uT2JzZXJ2ZXInIGluIHdpbmRvdykge1xuICAgICAgICB0aGlzLl9kb21PYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKHRoaXMuX2NoZWNrRm9ySW50ZXJzZWN0aW9ucyk7XG4gICAgICAgIHRoaXMuX2RvbU9ic2VydmVyLm9ic2VydmUoZG9jdW1lbnQsIHtcbiAgICAgICAgICBhdHRyaWJ1dGVzOiB0cnVlLFxuICAgICAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICAgICAgICBjaGFyYWN0ZXJEYXRhOiB0cnVlLFxuICAgICAgICAgIHN1YnRyZWU6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG5cbi8qKlxuICogU3RvcHMgcG9sbGluZyBmb3IgaW50ZXJzZWN0aW9uIGNoYW5nZXMuXG4gKiBAcHJpdmF0ZVxuICovXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUuX3VubW9uaXRvckludGVyc2VjdGlvbnMgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuX21vbml0b3JpbmdJbnRlcnNlY3Rpb25zKSB7XG4gICAgdGhpcy5fbW9uaXRvcmluZ0ludGVyc2VjdGlvbnMgPSBmYWxzZTtcblxuICAgIGNsZWFySW50ZXJ2YWwodGhpcy5fbW9uaXRvcmluZ0ludGVydmFsKTtcbiAgICB0aGlzLl9tb25pdG9yaW5nSW50ZXJ2YWwgPSBudWxsO1xuXG4gICAgcmVtb3ZlRXZlbnQod2luZG93LCAncmVzaXplJywgdGhpcy5fY2hlY2tGb3JJbnRlcnNlY3Rpb25zLCB0cnVlKTtcbiAgICByZW1vdmVFdmVudChkb2N1bWVudCwgJ3Njcm9sbCcsIHRoaXMuX2NoZWNrRm9ySW50ZXJzZWN0aW9ucywgdHJ1ZSk7XG5cbiAgICBpZiAodGhpcy5fZG9tT2JzZXJ2ZXIpIHtcbiAgICAgIHRoaXMuX2RvbU9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbiAgICAgIHRoaXMuX2RvbU9ic2VydmVyID0gbnVsbDtcbiAgICB9XG4gIH1cbn07XG5cblxuLyoqXG4gKiBTY2FucyBlYWNoIG9ic2VydmF0aW9uIHRhcmdldCBmb3IgaW50ZXJzZWN0aW9uIGNoYW5nZXMgYW5kIGFkZHMgdGhlbVxuICogdG8gdGhlIGludGVybmFsIGVudHJpZXMgcXVldWUuIElmIG5ldyBlbnRyaWVzIGFyZSBmb3VuZCwgaXRcbiAqIHNjaGVkdWxlcyB0aGUgY2FsbGJhY2sgdG8gYmUgaW52b2tlZC5cbiAqIEBwcml2YXRlXG4gKi9cbkludGVyc2VjdGlvbk9ic2VydmVyLnByb3RvdHlwZS5fY2hlY2tGb3JJbnRlcnNlY3Rpb25zID0gZnVuY3Rpb24oKSB7XG4gIHZhciByb290SXNJbkRvbSA9IHRoaXMuX3Jvb3RJc0luRG9tKCk7XG4gIHZhciByb290UmVjdCA9IHJvb3RJc0luRG9tID8gdGhpcy5fZ2V0Um9vdFJlY3QoKSA6IGdldEVtcHR5UmVjdCgpO1xuXG4gIHRoaXMuX29ic2VydmF0aW9uVGFyZ2V0cy5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICB2YXIgdGFyZ2V0ID0gaXRlbS5lbGVtZW50O1xuICAgIHZhciB0YXJnZXRSZWN0ID0gZ2V0Qm91bmRpbmdDbGllbnRSZWN0KHRhcmdldCk7XG4gICAgdmFyIHJvb3RDb250YWluc1RhcmdldCA9IHRoaXMuX3Jvb3RDb250YWluc1RhcmdldCh0YXJnZXQpO1xuICAgIHZhciBvbGRFbnRyeSA9IGl0ZW0uZW50cnk7XG4gICAgdmFyIGludGVyc2VjdGlvblJlY3QgPSByb290SXNJbkRvbSAmJiByb290Q29udGFpbnNUYXJnZXQgJiZcbiAgICAgICAgdGhpcy5fY29tcHV0ZVRhcmdldEFuZFJvb3RJbnRlcnNlY3Rpb24odGFyZ2V0LCByb290UmVjdCk7XG5cbiAgICB2YXIgbmV3RW50cnkgPSBpdGVtLmVudHJ5ID0gbmV3IEludGVyc2VjdGlvbk9ic2VydmVyRW50cnkoe1xuICAgICAgdGltZTogbm93KCksXG4gICAgICB0YXJnZXQ6IHRhcmdldCxcbiAgICAgIGJvdW5kaW5nQ2xpZW50UmVjdDogdGFyZ2V0UmVjdCxcbiAgICAgIHJvb3RCb3VuZHM6IHJvb3RSZWN0LFxuICAgICAgaW50ZXJzZWN0aW9uUmVjdDogaW50ZXJzZWN0aW9uUmVjdFxuICAgIH0pO1xuXG4gICAgaWYgKCFvbGRFbnRyeSkge1xuICAgICAgdGhpcy5fcXVldWVkRW50cmllcy5wdXNoKG5ld0VudHJ5KTtcbiAgICB9IGVsc2UgaWYgKHJvb3RJc0luRG9tICYmIHJvb3RDb250YWluc1RhcmdldCkge1xuICAgICAgLy8gSWYgdGhlIG5ldyBlbnRyeSBpbnRlcnNlY3Rpb24gcmF0aW8gaGFzIGNyb3NzZWQgYW55IG9mIHRoZVxuICAgICAgLy8gdGhyZXNob2xkcywgYWRkIGEgbmV3IGVudHJ5LlxuICAgICAgaWYgKHRoaXMuX2hhc0Nyb3NzZWRUaHJlc2hvbGQob2xkRW50cnksIG5ld0VudHJ5KSkge1xuICAgICAgICB0aGlzLl9xdWV1ZWRFbnRyaWVzLnB1c2gobmV3RW50cnkpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiB0aGUgcm9vdCBpcyBub3QgaW4gdGhlIERPTSBvciB0YXJnZXQgaXMgbm90IGNvbnRhaW5lZCB3aXRoaW5cbiAgICAgIC8vIHJvb3QgYnV0IHRoZSBwcmV2aW91cyBlbnRyeSBmb3IgdGhpcyB0YXJnZXQgaGFkIGFuIGludGVyc2VjdGlvbixcbiAgICAgIC8vIGFkZCBhIG5ldyByZWNvcmQgaW5kaWNhdGluZyByZW1vdmFsLlxuICAgICAgaWYgKG9sZEVudHJ5ICYmIG9sZEVudHJ5LmlzSW50ZXJzZWN0aW5nKSB7XG4gICAgICAgIHRoaXMuX3F1ZXVlZEVudHJpZXMucHVzaChuZXdFbnRyeSk7XG4gICAgICB9XG4gICAgfVxuICB9LCB0aGlzKTtcblxuICBpZiAodGhpcy5fcXVldWVkRW50cmllcy5sZW5ndGgpIHtcbiAgICB0aGlzLl9jYWxsYmFjayh0aGlzLnRha2VSZWNvcmRzKCksIHRoaXMpO1xuICB9XG59O1xuXG5cbi8qKlxuICogQWNjZXB0cyBhIHRhcmdldCBhbmQgcm9vdCByZWN0IGNvbXB1dGVzIHRoZSBpbnRlcnNlY3Rpb24gYmV0d2VlbiB0aGVuXG4gKiBmb2xsb3dpbmcgdGhlIGFsZ29yaXRobSBpbiB0aGUgc3BlYy5cbiAqIFRPRE8ocGhpbGlwd2FsdG9uKTogYXQgdGhpcyB0aW1lIGNsaXAtcGF0aCBpcyBub3QgY29uc2lkZXJlZC5cbiAqIGh0dHBzOi8vdzNjLmdpdGh1Yi5pby9JbnRlcnNlY3Rpb25PYnNlcnZlci8jY2FsY3VsYXRlLWludGVyc2VjdGlvbi1yZWN0LWFsZ29cbiAqIEBwYXJhbSB7RWxlbWVudH0gdGFyZ2V0IFRoZSB0YXJnZXQgRE9NIGVsZW1lbnRcbiAqIEBwYXJhbSB7T2JqZWN0fSByb290UmVjdCBUaGUgYm91bmRpbmcgcmVjdCBvZiB0aGUgcm9vdCBhZnRlciBiZWluZ1xuICogICAgIGV4cGFuZGVkIGJ5IHRoZSByb290TWFyZ2luIHZhbHVlLlxuICogQHJldHVybiB7P09iamVjdH0gVGhlIGZpbmFsIGludGVyc2VjdGlvbiByZWN0IG9iamVjdCBvciB1bmRlZmluZWQgaWYgbm9cbiAqICAgICBpbnRlcnNlY3Rpb24gaXMgZm91bmQuXG4gKiBAcHJpdmF0ZVxuICovXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUuX2NvbXB1dGVUYXJnZXRBbmRSb290SW50ZXJzZWN0aW9uID1cbiAgICBmdW5jdGlvbih0YXJnZXQsIHJvb3RSZWN0KSB7XG5cbiAgLy8gSWYgdGhlIGVsZW1lbnQgaXNuJ3QgZGlzcGxheWVkLCBhbiBpbnRlcnNlY3Rpb24gY2FuJ3QgaGFwcGVuLlxuICBpZiAod2luZG93LmdldENvbXB1dGVkU3R5bGUodGFyZ2V0KS5kaXNwbGF5ID09ICdub25lJykgcmV0dXJuO1xuXG4gIHZhciB0YXJnZXRSZWN0ID0gZ2V0Qm91bmRpbmdDbGllbnRSZWN0KHRhcmdldCk7XG4gIHZhciBpbnRlcnNlY3Rpb25SZWN0ID0gdGFyZ2V0UmVjdDtcbiAgdmFyIHBhcmVudCA9IGdldFBhcmVudE5vZGUodGFyZ2V0KTtcbiAgdmFyIGF0Um9vdCA9IGZhbHNlO1xuXG4gIHdoaWxlICghYXRSb290KSB7XG4gICAgdmFyIHBhcmVudFJlY3QgPSBudWxsO1xuICAgIHZhciBwYXJlbnRDb21wdXRlZFN0eWxlID0gcGFyZW50Lm5vZGVUeXBlID09IDEgP1xuICAgICAgICB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShwYXJlbnQpIDoge307XG5cbiAgICAvLyBJZiB0aGUgcGFyZW50IGlzbid0IGRpc3BsYXllZCwgYW4gaW50ZXJzZWN0aW9uIGNhbid0IGhhcHBlbi5cbiAgICBpZiAocGFyZW50Q29tcHV0ZWRTdHlsZS5kaXNwbGF5ID09ICdub25lJykgcmV0dXJuO1xuXG4gICAgaWYgKHBhcmVudCA9PSB0aGlzLnJvb3QgfHwgcGFyZW50ID09IGRvY3VtZW50KSB7XG4gICAgICBhdFJvb3QgPSB0cnVlO1xuICAgICAgcGFyZW50UmVjdCA9IHJvb3RSZWN0O1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiB0aGUgZWxlbWVudCBoYXMgYSBub24tdmlzaWJsZSBvdmVyZmxvdywgYW5kIGl0J3Mgbm90IHRoZSA8Ym9keT5cbiAgICAgIC8vIG9yIDxodG1sPiBlbGVtZW50LCB1cGRhdGUgdGhlIGludGVyc2VjdGlvbiByZWN0LlxuICAgICAgLy8gTm90ZTogPGJvZHk+IGFuZCA8aHRtbD4gY2Fubm90IGJlIGNsaXBwZWQgdG8gYSByZWN0IHRoYXQncyBub3QgYWxzb1xuICAgICAgLy8gdGhlIGRvY3VtZW50IHJlY3QsIHNvIG5vIG5lZWQgdG8gY29tcHV0ZSBhIG5ldyBpbnRlcnNlY3Rpb24uXG4gICAgICBpZiAocGFyZW50ICE9IGRvY3VtZW50LmJvZHkgJiZcbiAgICAgICAgICBwYXJlbnQgIT0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50ICYmXG4gICAgICAgICAgcGFyZW50Q29tcHV0ZWRTdHlsZS5vdmVyZmxvdyAhPSAndmlzaWJsZScpIHtcbiAgICAgICAgcGFyZW50UmVjdCA9IGdldEJvdW5kaW5nQ2xpZW50UmVjdChwYXJlbnQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIElmIGVpdGhlciBvZiB0aGUgYWJvdmUgY29uZGl0aW9uYWxzIHNldCBhIG5ldyBwYXJlbnRSZWN0LFxuICAgIC8vIGNhbGN1bGF0ZSBuZXcgaW50ZXJzZWN0aW9uIGRhdGEuXG4gICAgaWYgKHBhcmVudFJlY3QpIHtcbiAgICAgIGludGVyc2VjdGlvblJlY3QgPSBjb21wdXRlUmVjdEludGVyc2VjdGlvbihwYXJlbnRSZWN0LCBpbnRlcnNlY3Rpb25SZWN0KTtcblxuICAgICAgaWYgKCFpbnRlcnNlY3Rpb25SZWN0KSBicmVhaztcbiAgICB9XG4gICAgcGFyZW50ID0gZ2V0UGFyZW50Tm9kZShwYXJlbnQpO1xuICB9XG4gIHJldHVybiBpbnRlcnNlY3Rpb25SZWN0O1xufTtcblxuXG4vKipcbiAqIFJldHVybnMgdGhlIHJvb3QgcmVjdCBhZnRlciBiZWluZyBleHBhbmRlZCBieSB0aGUgcm9vdE1hcmdpbiB2YWx1ZS5cbiAqIEByZXR1cm4ge09iamVjdH0gVGhlIGV4cGFuZGVkIHJvb3QgcmVjdC5cbiAqIEBwcml2YXRlXG4gKi9cbkludGVyc2VjdGlvbk9ic2VydmVyLnByb3RvdHlwZS5fZ2V0Um9vdFJlY3QgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHJvb3RSZWN0O1xuICBpZiAodGhpcy5yb290KSB7XG4gICAgcm9vdFJlY3QgPSBnZXRCb3VuZGluZ0NsaWVudFJlY3QodGhpcy5yb290KTtcbiAgfSBlbHNlIHtcbiAgICAvLyBVc2UgPGh0bWw+Lzxib2R5PiBpbnN0ZWFkIG9mIHdpbmRvdyBzaW5jZSBzY3JvbGwgYmFycyBhZmZlY3Qgc2l6ZS5cbiAgICB2YXIgaHRtbCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcbiAgICB2YXIgYm9keSA9IGRvY3VtZW50LmJvZHk7XG4gICAgcm9vdFJlY3QgPSB7XG4gICAgICB0b3A6IDAsXG4gICAgICBsZWZ0OiAwLFxuICAgICAgcmlnaHQ6IGh0bWwuY2xpZW50V2lkdGggfHwgYm9keS5jbGllbnRXaWR0aCxcbiAgICAgIHdpZHRoOiBodG1sLmNsaWVudFdpZHRoIHx8IGJvZHkuY2xpZW50V2lkdGgsXG4gICAgICBib3R0b206IGh0bWwuY2xpZW50SGVpZ2h0IHx8IGJvZHkuY2xpZW50SGVpZ2h0LFxuICAgICAgaGVpZ2h0OiBodG1sLmNsaWVudEhlaWdodCB8fCBib2R5LmNsaWVudEhlaWdodFxuICAgIH07XG4gIH1cbiAgcmV0dXJuIHRoaXMuX2V4cGFuZFJlY3RCeVJvb3RNYXJnaW4ocm9vdFJlY3QpO1xufTtcblxuXG4vKipcbiAqIEFjY2VwdHMgYSByZWN0IGFuZCBleHBhbmRzIGl0IGJ5IHRoZSByb290TWFyZ2luIHZhbHVlLlxuICogQHBhcmFtIHtPYmplY3R9IHJlY3QgVGhlIHJlY3Qgb2JqZWN0IHRvIGV4cGFuZC5cbiAqIEByZXR1cm4ge09iamVjdH0gVGhlIGV4cGFuZGVkIHJlY3QuXG4gKiBAcHJpdmF0ZVxuICovXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUuX2V4cGFuZFJlY3RCeVJvb3RNYXJnaW4gPSBmdW5jdGlvbihyZWN0KSB7XG4gIHZhciBtYXJnaW5zID0gdGhpcy5fcm9vdE1hcmdpblZhbHVlcy5tYXAoZnVuY3Rpb24obWFyZ2luLCBpKSB7XG4gICAgcmV0dXJuIG1hcmdpbi51bml0ID09ICdweCcgPyBtYXJnaW4udmFsdWUgOlxuICAgICAgICBtYXJnaW4udmFsdWUgKiAoaSAlIDIgPyByZWN0LndpZHRoIDogcmVjdC5oZWlnaHQpIC8gMTAwO1xuICB9KTtcbiAgdmFyIG5ld1JlY3QgPSB7XG4gICAgdG9wOiByZWN0LnRvcCAtIG1hcmdpbnNbMF0sXG4gICAgcmlnaHQ6IHJlY3QucmlnaHQgKyBtYXJnaW5zWzFdLFxuICAgIGJvdHRvbTogcmVjdC5ib3R0b20gKyBtYXJnaW5zWzJdLFxuICAgIGxlZnQ6IHJlY3QubGVmdCAtIG1hcmdpbnNbM11cbiAgfTtcbiAgbmV3UmVjdC53aWR0aCA9IG5ld1JlY3QucmlnaHQgLSBuZXdSZWN0LmxlZnQ7XG4gIG5ld1JlY3QuaGVpZ2h0ID0gbmV3UmVjdC5ib3R0b20gLSBuZXdSZWN0LnRvcDtcblxuICByZXR1cm4gbmV3UmVjdDtcbn07XG5cblxuLyoqXG4gKiBBY2NlcHRzIGFuIG9sZCBhbmQgbmV3IGVudHJ5IGFuZCByZXR1cm5zIHRydWUgaWYgYXQgbGVhc3Qgb25lIG9mIHRoZVxuICogdGhyZXNob2xkIHZhbHVlcyBoYXMgYmVlbiBjcm9zc2VkLlxuICogQHBhcmFtIHs/SW50ZXJzZWN0aW9uT2JzZXJ2ZXJFbnRyeX0gb2xkRW50cnkgVGhlIHByZXZpb3VzIGVudHJ5IGZvciBhXG4gKiAgICBwYXJ0aWN1bGFyIHRhcmdldCBlbGVtZW50IG9yIG51bGwgaWYgbm8gcHJldmlvdXMgZW50cnkgZXhpc3RzLlxuICogQHBhcmFtIHtJbnRlcnNlY3Rpb25PYnNlcnZlckVudHJ5fSBuZXdFbnRyeSBUaGUgY3VycmVudCBlbnRyeSBmb3IgYVxuICogICAgcGFydGljdWxhciB0YXJnZXQgZWxlbWVudC5cbiAqIEByZXR1cm4ge2Jvb2xlYW59IFJldHVybnMgdHJ1ZSBpZiBhIGFueSB0aHJlc2hvbGQgaGFzIGJlZW4gY3Jvc3NlZC5cbiAqIEBwcml2YXRlXG4gKi9cbkludGVyc2VjdGlvbk9ic2VydmVyLnByb3RvdHlwZS5faGFzQ3Jvc3NlZFRocmVzaG9sZCA9XG4gICAgZnVuY3Rpb24ob2xkRW50cnksIG5ld0VudHJ5KSB7XG5cbiAgLy8gVG8gbWFrZSBjb21wYXJpbmcgZWFzaWVyLCBhbiBlbnRyeSB0aGF0IGhhcyBhIHJhdGlvIG9mIDBcbiAgLy8gYnV0IGRvZXMgbm90IGFjdHVhbGx5IGludGVyc2VjdCBpcyBnaXZlbiBhIHZhbHVlIG9mIC0xXG4gIHZhciBvbGRSYXRpbyA9IG9sZEVudHJ5ICYmIG9sZEVudHJ5LmlzSW50ZXJzZWN0aW5nID9cbiAgICAgIG9sZEVudHJ5LmludGVyc2VjdGlvblJhdGlvIHx8IDAgOiAtMTtcbiAgdmFyIG5ld1JhdGlvID0gbmV3RW50cnkuaXNJbnRlcnNlY3RpbmcgP1xuICAgICAgbmV3RW50cnkuaW50ZXJzZWN0aW9uUmF0aW8gfHwgMCA6IC0xO1xuXG4gIC8vIElnbm9yZSB1bmNoYW5nZWQgcmF0aW9zXG4gIGlmIChvbGRSYXRpbyA9PT0gbmV3UmF0aW8pIHJldHVybjtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMudGhyZXNob2xkcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciB0aHJlc2hvbGQgPSB0aGlzLnRocmVzaG9sZHNbaV07XG5cbiAgICAvLyBSZXR1cm4gdHJ1ZSBpZiBhbiBlbnRyeSBtYXRjaGVzIGEgdGhyZXNob2xkIG9yIGlmIHRoZSBuZXcgcmF0aW9cbiAgICAvLyBhbmQgdGhlIG9sZCByYXRpbyBhcmUgb24gdGhlIG9wcG9zaXRlIHNpZGVzIG9mIGEgdGhyZXNob2xkLlxuICAgIGlmICh0aHJlc2hvbGQgPT0gb2xkUmF0aW8gfHwgdGhyZXNob2xkID09IG5ld1JhdGlvIHx8XG4gICAgICAgIHRocmVzaG9sZCA8IG9sZFJhdGlvICE9PSB0aHJlc2hvbGQgPCBuZXdSYXRpbykge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG59O1xuXG5cbi8qKlxuICogUmV0dXJucyB3aGV0aGVyIG9yIG5vdCB0aGUgcm9vdCBlbGVtZW50IGlzIGFuIGVsZW1lbnQgYW5kIGlzIGluIHRoZSBET00uXG4gKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIHRoZSByb290IGVsZW1lbnQgaXMgYW4gZWxlbWVudCBhbmQgaXMgaW4gdGhlIERPTS5cbiAqIEBwcml2YXRlXG4gKi9cbkludGVyc2VjdGlvbk9ic2VydmVyLnByb3RvdHlwZS5fcm9vdElzSW5Eb20gPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICF0aGlzLnJvb3QgfHwgY29udGFpbnNEZWVwKGRvY3VtZW50LCB0aGlzLnJvb3QpO1xufTtcblxuXG4vKipcbiAqIFJldHVybnMgd2hldGhlciBvciBub3QgdGhlIHRhcmdldCBlbGVtZW50IGlzIGEgY2hpbGQgb2Ygcm9vdC5cbiAqIEBwYXJhbSB7RWxlbWVudH0gdGFyZ2V0IFRoZSB0YXJnZXQgZWxlbWVudCB0byBjaGVjay5cbiAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgdGhlIHRhcmdldCBlbGVtZW50IGlzIGEgY2hpbGQgb2Ygcm9vdC5cbiAqIEBwcml2YXRlXG4gKi9cbkludGVyc2VjdGlvbk9ic2VydmVyLnByb3RvdHlwZS5fcm9vdENvbnRhaW5zVGFyZ2V0ID0gZnVuY3Rpb24odGFyZ2V0KSB7XG4gIHJldHVybiBjb250YWluc0RlZXAodGhpcy5yb290IHx8IGRvY3VtZW50LCB0YXJnZXQpO1xufTtcblxuXG4vKipcbiAqIEFkZHMgdGhlIGluc3RhbmNlIHRvIHRoZSBnbG9iYWwgSW50ZXJzZWN0aW9uT2JzZXJ2ZXIgcmVnaXN0cnkgaWYgaXQgaXNuJ3RcbiAqIGFscmVhZHkgcHJlc2VudC5cbiAqIEBwcml2YXRlXG4gKi9cbkludGVyc2VjdGlvbk9ic2VydmVyLnByb3RvdHlwZS5fcmVnaXN0ZXJJbnN0YW5jZSA9IGZ1bmN0aW9uKCkge1xuICBpZiAocmVnaXN0cnkuaW5kZXhPZih0aGlzKSA8IDApIHtcbiAgICByZWdpc3RyeS5wdXNoKHRoaXMpO1xuICB9XG59O1xuXG5cbi8qKlxuICogUmVtb3ZlcyB0aGUgaW5zdGFuY2UgZnJvbSB0aGUgZ2xvYmFsIEludGVyc2VjdGlvbk9ic2VydmVyIHJlZ2lzdHJ5LlxuICogQHByaXZhdGVcbiAqL1xuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLl91bnJlZ2lzdGVySW5zdGFuY2UgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGluZGV4ID0gcmVnaXN0cnkuaW5kZXhPZih0aGlzKTtcbiAgaWYgKGluZGV4ICE9IC0xKSByZWdpc3RyeS5zcGxpY2UoaW5kZXgsIDEpO1xufTtcblxuXG4vKipcbiAqIFJldHVybnMgdGhlIHJlc3VsdCBvZiB0aGUgcGVyZm9ybWFuY2Uubm93KCkgbWV0aG9kIG9yIG51bGwgaW4gYnJvd3NlcnNcbiAqIHRoYXQgZG9uJ3Qgc3VwcG9ydCB0aGUgQVBJLlxuICogQHJldHVybiB7bnVtYmVyfSBUaGUgZWxhcHNlZCB0aW1lIHNpbmNlIHRoZSBwYWdlIHdhcyByZXF1ZXN0ZWQuXG4gKi9cbmZ1bmN0aW9uIG5vdygpIHtcbiAgcmV0dXJuIHdpbmRvdy5wZXJmb3JtYW5jZSAmJiBwZXJmb3JtYW5jZS5ub3cgJiYgcGVyZm9ybWFuY2Uubm93KCk7XG59XG5cblxuLyoqXG4gKiBUaHJvdHRsZXMgYSBmdW5jdGlvbiBhbmQgZGVsYXlzIGl0cyBleGVjdXRpb25nLCBzbyBpdCdzIG9ubHkgY2FsbGVkIGF0IG1vc3RcbiAqIG9uY2Ugd2l0aGluIGEgZ2l2ZW4gdGltZSBwZXJpb2QuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gdG8gdGhyb3R0bGUuXG4gKiBAcGFyYW0ge251bWJlcn0gdGltZW91dCBUaGUgYW1vdW50IG9mIHRpbWUgdGhhdCBtdXN0IHBhc3MgYmVmb3JlIHRoZVxuICogICAgIGZ1bmN0aW9uIGNhbiBiZSBjYWxsZWQgYWdhaW4uXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gVGhlIHRocm90dGxlZCBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gdGhyb3R0bGUoZm4sIHRpbWVvdXQpIHtcbiAgdmFyIHRpbWVyID0gbnVsbDtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRpbWVyKSB7XG4gICAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIGZuKCk7XG4gICAgICAgIHRpbWVyID0gbnVsbDtcbiAgICAgIH0sIHRpbWVvdXQpO1xuICAgIH1cbiAgfTtcbn1cblxuXG4vKipcbiAqIEFkZHMgYW4gZXZlbnQgaGFuZGxlciB0byBhIERPTSBub2RlIGVuc3VyaW5nIGNyb3NzLWJyb3dzZXIgY29tcGF0aWJpbGl0eS5cbiAqIEBwYXJhbSB7Tm9kZX0gbm9kZSBUaGUgRE9NIG5vZGUgdG8gYWRkIHRoZSBldmVudCBoYW5kbGVyIHRvLlxuICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IFRoZSBldmVudCBuYW1lLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGV2ZW50IGhhbmRsZXIgdG8gYWRkLlxuICogQHBhcmFtIHtib29sZWFufSBvcHRfdXNlQ2FwdHVyZSBPcHRpb25hbGx5IGFkZHMgdGhlIGV2ZW4gdG8gdGhlIGNhcHR1cmVcbiAqICAgICBwaGFzZS4gTm90ZTogdGhpcyBvbmx5IHdvcmtzIGluIG1vZGVybiBicm93c2Vycy5cbiAqL1xuZnVuY3Rpb24gYWRkRXZlbnQobm9kZSwgZXZlbnQsIGZuLCBvcHRfdXNlQ2FwdHVyZSkge1xuICBpZiAodHlwZW9mIG5vZGUuYWRkRXZlbnRMaXN0ZW5lciA9PSAnZnVuY3Rpb24nKSB7XG4gICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBmbiwgb3B0X3VzZUNhcHR1cmUgfHwgZmFsc2UpO1xuICB9XG4gIGVsc2UgaWYgKHR5cGVvZiBub2RlLmF0dGFjaEV2ZW50ID09ICdmdW5jdGlvbicpIHtcbiAgICBub2RlLmF0dGFjaEV2ZW50KCdvbicgKyBldmVudCwgZm4pO1xuICB9XG59XG5cblxuLyoqXG4gKiBSZW1vdmVzIGEgcHJldmlvdXNseSBhZGRlZCBldmVudCBoYW5kbGVyIGZyb20gYSBET00gbm9kZS5cbiAqIEBwYXJhbSB7Tm9kZX0gbm9kZSBUaGUgRE9NIG5vZGUgdG8gcmVtb3ZlIHRoZSBldmVudCBoYW5kbGVyIGZyb20uXG4gKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZXZlbnQgaGFuZGxlciB0byByZW1vdmUuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IG9wdF91c2VDYXB0dXJlIElmIHRoZSBldmVudCBoYW5kbGVyIHdhcyBhZGRlZCB3aXRoIHRoaXNcbiAqICAgICBmbGFnIHNldCB0byB0cnVlLCBpdCBzaG91bGQgYmUgc2V0IHRvIHRydWUgaGVyZSBpbiBvcmRlciB0byByZW1vdmUgaXQuXG4gKi9cbmZ1bmN0aW9uIHJlbW92ZUV2ZW50KG5vZGUsIGV2ZW50LCBmbiwgb3B0X3VzZUNhcHR1cmUpIHtcbiAgaWYgKHR5cGVvZiBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIgPT0gJ2Z1bmN0aW9uJykge1xuICAgIG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgZm4sIG9wdF91c2VDYXB0dXJlIHx8IGZhbHNlKTtcbiAgfVxuICBlbHNlIGlmICh0eXBlb2Ygbm9kZS5kZXRhdGNoRXZlbnQgPT0gJ2Z1bmN0aW9uJykge1xuICAgIG5vZGUuZGV0YXRjaEV2ZW50KCdvbicgKyBldmVudCwgZm4pO1xuICB9XG59XG5cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBpbnRlcnNlY3Rpb24gYmV0d2VlbiB0d28gcmVjdCBvYmplY3RzLlxuICogQHBhcmFtIHtPYmplY3R9IHJlY3QxIFRoZSBmaXJzdCByZWN0LlxuICogQHBhcmFtIHtPYmplY3R9IHJlY3QyIFRoZSBzZWNvbmQgcmVjdC5cbiAqIEByZXR1cm4gez9PYmplY3R9IFRoZSBpbnRlcnNlY3Rpb24gcmVjdCBvciB1bmRlZmluZWQgaWYgbm8gaW50ZXJzZWN0aW9uXG4gKiAgICAgaXMgZm91bmQuXG4gKi9cbmZ1bmN0aW9uIGNvbXB1dGVSZWN0SW50ZXJzZWN0aW9uKHJlY3QxLCByZWN0Mikge1xuICB2YXIgdG9wID0gTWF0aC5tYXgocmVjdDEudG9wLCByZWN0Mi50b3ApO1xuICB2YXIgYm90dG9tID0gTWF0aC5taW4ocmVjdDEuYm90dG9tLCByZWN0Mi5ib3R0b20pO1xuICB2YXIgbGVmdCA9IE1hdGgubWF4KHJlY3QxLmxlZnQsIHJlY3QyLmxlZnQpO1xuICB2YXIgcmlnaHQgPSBNYXRoLm1pbihyZWN0MS5yaWdodCwgcmVjdDIucmlnaHQpO1xuICB2YXIgd2lkdGggPSByaWdodCAtIGxlZnQ7XG4gIHZhciBoZWlnaHQgPSBib3R0b20gLSB0b3A7XG5cbiAgcmV0dXJuICh3aWR0aCA+PSAwICYmIGhlaWdodCA+PSAwKSAmJiB7XG4gICAgdG9wOiB0b3AsXG4gICAgYm90dG9tOiBib3R0b20sXG4gICAgbGVmdDogbGVmdCxcbiAgICByaWdodDogcmlnaHQsXG4gICAgd2lkdGg6IHdpZHRoLFxuICAgIGhlaWdodDogaGVpZ2h0XG4gIH07XG59XG5cblxuLyoqXG4gKiBTaGltcyB0aGUgbmF0aXZlIGdldEJvdW5kaW5nQ2xpZW50UmVjdCBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG9sZGVyIElFLlxuICogQHBhcmFtIHtFbGVtZW50fSBlbCBUaGUgZWxlbWVudCB3aG9zZSBib3VuZGluZyByZWN0IHRvIGdldC5cbiAqIEByZXR1cm4ge09iamVjdH0gVGhlIChwb3NzaWJseSBzaGltbWVkKSByZWN0IG9mIHRoZSBlbGVtZW50LlxuICovXG5mdW5jdGlvbiBnZXRCb3VuZGluZ0NsaWVudFJlY3QoZWwpIHtcbiAgdmFyIHJlY3Q7XG5cbiAgdHJ5IHtcbiAgICByZWN0ID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIC8vIElnbm9yZSBXaW5kb3dzIDcgSUUxMSBcIlVuc3BlY2lmaWVkIGVycm9yXCJcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vdzNjL0ludGVyc2VjdGlvbk9ic2VydmVyL3B1bGwvMjA1XG4gIH1cblxuICBpZiAoIXJlY3QpIHJldHVybiBnZXRFbXB0eVJlY3QoKTtcblxuICAvLyBPbGRlciBJRVxuICBpZiAoIShyZWN0LndpZHRoICYmIHJlY3QuaGVpZ2h0KSkge1xuICAgIHJlY3QgPSB7XG4gICAgICB0b3A6IHJlY3QudG9wLFxuICAgICAgcmlnaHQ6IHJlY3QucmlnaHQsXG4gICAgICBib3R0b206IHJlY3QuYm90dG9tLFxuICAgICAgbGVmdDogcmVjdC5sZWZ0LFxuICAgICAgd2lkdGg6IHJlY3QucmlnaHQgLSByZWN0LmxlZnQsXG4gICAgICBoZWlnaHQ6IHJlY3QuYm90dG9tIC0gcmVjdC50b3BcbiAgICB9O1xuICB9XG4gIHJldHVybiByZWN0O1xufVxuXG5cbi8qKlxuICogUmV0dXJucyBhbiBlbXB0eSByZWN0IG9iamVjdC4gQW4gZW1wdHkgcmVjdCBpcyByZXR1cm5lZCB3aGVuIGFuIGVsZW1lbnRcbiAqIGlzIG5vdCBpbiB0aGUgRE9NLlxuICogQHJldHVybiB7T2JqZWN0fSBUaGUgZW1wdHkgcmVjdC5cbiAqL1xuZnVuY3Rpb24gZ2V0RW1wdHlSZWN0KCkge1xuICByZXR1cm4ge1xuICAgIHRvcDogMCxcbiAgICBib3R0b206IDAsXG4gICAgbGVmdDogMCxcbiAgICByaWdodDogMCxcbiAgICB3aWR0aDogMCxcbiAgICBoZWlnaHQ6IDBcbiAgfTtcbn1cblxuLyoqXG4gKiBDaGVja3MgdG8gc2VlIGlmIGEgcGFyZW50IGVsZW1lbnQgY29udGFpbnMgYSBjaGlsZCBlbGVtbnQgKGluY2x1ZGluZyBpbnNpZGVcbiAqIHNoYWRvdyBET00pLlxuICogQHBhcmFtIHtOb2RlfSBwYXJlbnQgVGhlIHBhcmVudCBlbGVtZW50LlxuICogQHBhcmFtIHtOb2RlfSBjaGlsZCBUaGUgY2hpbGQgZWxlbWVudC5cbiAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgdGhlIHBhcmVudCBub2RlIGNvbnRhaW5zIHRoZSBjaGlsZCBub2RlLlxuICovXG5mdW5jdGlvbiBjb250YWluc0RlZXAocGFyZW50LCBjaGlsZCkge1xuICB2YXIgbm9kZSA9IGNoaWxkO1xuICB3aGlsZSAobm9kZSkge1xuICAgIGlmIChub2RlID09IHBhcmVudCkgcmV0dXJuIHRydWU7XG5cbiAgICBub2RlID0gZ2V0UGFyZW50Tm9kZShub2RlKTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cblxuLyoqXG4gKiBHZXRzIHRoZSBwYXJlbnQgbm9kZSBvZiBhbiBlbGVtZW50IG9yIGl0cyBob3N0IGVsZW1lbnQgaWYgdGhlIHBhcmVudCBub2RlXG4gKiBpcyBhIHNoYWRvdyByb290LlxuICogQHBhcmFtIHtOb2RlfSBub2RlIFRoZSBub2RlIHdob3NlIHBhcmVudCB0byBnZXQuXG4gKiBAcmV0dXJuIHtOb2RlfG51bGx9IFRoZSBwYXJlbnQgbm9kZSBvciBudWxsIGlmIG5vIHBhcmVudCBleGlzdHMuXG4gKi9cbmZ1bmN0aW9uIGdldFBhcmVudE5vZGUobm9kZSkge1xuICB2YXIgcGFyZW50ID0gbm9kZS5wYXJlbnROb2RlO1xuXG4gIGlmIChwYXJlbnQgJiYgcGFyZW50Lm5vZGVUeXBlID09IDExICYmIHBhcmVudC5ob3N0KSB7XG4gICAgLy8gSWYgdGhlIHBhcmVudCBpcyBhIHNoYWRvdyByb290LCByZXR1cm4gdGhlIGhvc3QgZWxlbWVudC5cbiAgICByZXR1cm4gcGFyZW50Lmhvc3Q7XG4gIH1cbiAgcmV0dXJuIHBhcmVudDtcbn1cblxuXG4vLyBFeHBvc2VzIHRoZSBjb25zdHJ1Y3RvcnMgZ2xvYmFsbHkuXG53aW5kb3cuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIgPSBJbnRlcnNlY3Rpb25PYnNlcnZlcjtcbndpbmRvdy5JbnRlcnNlY3Rpb25PYnNlcnZlckVudHJ5ID0gSW50ZXJzZWN0aW9uT2JzZXJ2ZXJFbnRyeTtcblxufSh3aW5kb3csIGRvY3VtZW50KSk7XG4iLCIvKiBGb250IEZhY2UgT2JzZXJ2ZXIgdjIuMC4xMyAtIMKpIEJyYW0gU3RlaW4uIExpY2Vuc2U6IEJTRC0zLUNsYXVzZSAqLyhmdW5jdGlvbigpeyd1c2Ugc3RyaWN0Jzt2YXIgZixnPVtdO2Z1bmN0aW9uIGwoYSl7Zy5wdXNoKGEpOzE9PWcubGVuZ3RoJiZmKCl9ZnVuY3Rpb24gbSgpe2Zvcig7Zy5sZW5ndGg7KWdbMF0oKSxnLnNoaWZ0KCl9Zj1mdW5jdGlvbigpe3NldFRpbWVvdXQobSl9O2Z1bmN0aW9uIG4oYSl7dGhpcy5hPXA7dGhpcy5iPXZvaWQgMDt0aGlzLmY9W107dmFyIGI9dGhpczt0cnl7YShmdW5jdGlvbihhKXtxKGIsYSl9LGZ1bmN0aW9uKGEpe3IoYixhKX0pfWNhdGNoKGMpe3IoYixjKX19dmFyIHA9MjtmdW5jdGlvbiB0KGEpe3JldHVybiBuZXcgbihmdW5jdGlvbihiLGMpe2MoYSl9KX1mdW5jdGlvbiB1KGEpe3JldHVybiBuZXcgbihmdW5jdGlvbihiKXtiKGEpfSl9ZnVuY3Rpb24gcShhLGIpe2lmKGEuYT09cCl7aWYoYj09YSl0aHJvdyBuZXcgVHlwZUVycm9yO3ZhciBjPSExO3RyeXt2YXIgZD1iJiZiLnRoZW47aWYobnVsbCE9YiYmXCJvYmplY3RcIj09dHlwZW9mIGImJlwiZnVuY3Rpb25cIj09dHlwZW9mIGQpe2QuY2FsbChiLGZ1bmN0aW9uKGIpe2N8fHEoYSxiKTtjPSEwfSxmdW5jdGlvbihiKXtjfHxyKGEsYik7Yz0hMH0pO3JldHVybn19Y2F0Y2goZSl7Y3x8cihhLGUpO3JldHVybn1hLmE9MDthLmI9Yjt2KGEpfX1cbmZ1bmN0aW9uIHIoYSxiKXtpZihhLmE9PXApe2lmKGI9PWEpdGhyb3cgbmV3IFR5cGVFcnJvcjthLmE9MTthLmI9Yjt2KGEpfX1mdW5jdGlvbiB2KGEpe2woZnVuY3Rpb24oKXtpZihhLmEhPXApZm9yKDthLmYubGVuZ3RoOyl7dmFyIGI9YS5mLnNoaWZ0KCksYz1iWzBdLGQ9YlsxXSxlPWJbMl0sYj1iWzNdO3RyeXswPT1hLmE/XCJmdW5jdGlvblwiPT10eXBlb2YgYz9lKGMuY2FsbCh2b2lkIDAsYS5iKSk6ZShhLmIpOjE9PWEuYSYmKFwiZnVuY3Rpb25cIj09dHlwZW9mIGQ/ZShkLmNhbGwodm9pZCAwLGEuYikpOmIoYS5iKSl9Y2F0Y2goaCl7YihoKX19fSl9bi5wcm90b3R5cGUuZz1mdW5jdGlvbihhKXtyZXR1cm4gdGhpcy5jKHZvaWQgMCxhKX07bi5wcm90b3R5cGUuYz1mdW5jdGlvbihhLGIpe3ZhciBjPXRoaXM7cmV0dXJuIG5ldyBuKGZ1bmN0aW9uKGQsZSl7Yy5mLnB1c2goW2EsYixkLGVdKTt2KGMpfSl9O1xuZnVuY3Rpb24gdyhhKXtyZXR1cm4gbmV3IG4oZnVuY3Rpb24oYixjKXtmdW5jdGlvbiBkKGMpe3JldHVybiBmdW5jdGlvbihkKXtoW2NdPWQ7ZSs9MTtlPT1hLmxlbmd0aCYmYihoKX19dmFyIGU9MCxoPVtdOzA9PWEubGVuZ3RoJiZiKGgpO2Zvcih2YXIgaz0wO2s8YS5sZW5ndGg7ays9MSl1KGFba10pLmMoZChrKSxjKX0pfWZ1bmN0aW9uIHgoYSl7cmV0dXJuIG5ldyBuKGZ1bmN0aW9uKGIsYyl7Zm9yKHZhciBkPTA7ZDxhLmxlbmd0aDtkKz0xKXUoYVtkXSkuYyhiLGMpfSl9O3dpbmRvdy5Qcm9taXNlfHwod2luZG93LlByb21pc2U9bix3aW5kb3cuUHJvbWlzZS5yZXNvbHZlPXUsd2luZG93LlByb21pc2UucmVqZWN0PXQsd2luZG93LlByb21pc2UucmFjZT14LHdpbmRvdy5Qcm9taXNlLmFsbD13LHdpbmRvdy5Qcm9taXNlLnByb3RvdHlwZS50aGVuPW4ucHJvdG90eXBlLmMsd2luZG93LlByb21pc2UucHJvdG90eXBlW1wiY2F0Y2hcIl09bi5wcm90b3R5cGUuZyk7fSgpKTtcblxuKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gbChhLGIpe2RvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXI/YS5hZGRFdmVudExpc3RlbmVyKFwic2Nyb2xsXCIsYiwhMSk6YS5hdHRhY2hFdmVudChcInNjcm9sbFwiLGIpfWZ1bmN0aW9uIG0oYSl7ZG9jdW1lbnQuYm9keT9hKCk6ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcj9kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLGZ1bmN0aW9uIGMoKXtkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLGMpO2EoKX0pOmRvY3VtZW50LmF0dGFjaEV2ZW50KFwib25yZWFkeXN0YXRlY2hhbmdlXCIsZnVuY3Rpb24gaygpe2lmKFwiaW50ZXJhY3RpdmVcIj09ZG9jdW1lbnQucmVhZHlTdGF0ZXx8XCJjb21wbGV0ZVwiPT1kb2N1bWVudC5yZWFkeVN0YXRlKWRvY3VtZW50LmRldGFjaEV2ZW50KFwib25yZWFkeXN0YXRlY2hhbmdlXCIsayksYSgpfSl9O2Z1bmN0aW9uIHIoYSl7dGhpcy5hPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7dGhpcy5hLnNldEF0dHJpYnV0ZShcImFyaWEtaGlkZGVuXCIsXCJ0cnVlXCIpO3RoaXMuYS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShhKSk7dGhpcy5iPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO3RoaXMuYz1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTt0aGlzLmg9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7dGhpcy5mPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO3RoaXMuZz0tMTt0aGlzLmIuc3R5bGUuY3NzVGV4dD1cIm1heC13aWR0aDpub25lO2Rpc3BsYXk6aW5saW5lLWJsb2NrO3Bvc2l0aW9uOmFic29sdXRlO2hlaWdodDoxMDAlO3dpZHRoOjEwMCU7b3ZlcmZsb3c6c2Nyb2xsO2ZvbnQtc2l6ZToxNnB4O1wiO3RoaXMuYy5zdHlsZS5jc3NUZXh0PVwibWF4LXdpZHRoOm5vbmU7ZGlzcGxheTppbmxpbmUtYmxvY2s7cG9zaXRpb246YWJzb2x1dGU7aGVpZ2h0OjEwMCU7d2lkdGg6MTAwJTtvdmVyZmxvdzpzY3JvbGw7Zm9udC1zaXplOjE2cHg7XCI7XG50aGlzLmYuc3R5bGUuY3NzVGV4dD1cIm1heC13aWR0aDpub25lO2Rpc3BsYXk6aW5saW5lLWJsb2NrO3Bvc2l0aW9uOmFic29sdXRlO2hlaWdodDoxMDAlO3dpZHRoOjEwMCU7b3ZlcmZsb3c6c2Nyb2xsO2ZvbnQtc2l6ZToxNnB4O1wiO3RoaXMuaC5zdHlsZS5jc3NUZXh0PVwiZGlzcGxheTppbmxpbmUtYmxvY2s7d2lkdGg6MjAwJTtoZWlnaHQ6MjAwJTtmb250LXNpemU6MTZweDttYXgtd2lkdGg6bm9uZTtcIjt0aGlzLmIuYXBwZW5kQ2hpbGQodGhpcy5oKTt0aGlzLmMuYXBwZW5kQ2hpbGQodGhpcy5mKTt0aGlzLmEuYXBwZW5kQ2hpbGQodGhpcy5iKTt0aGlzLmEuYXBwZW5kQ2hpbGQodGhpcy5jKX1cbmZ1bmN0aW9uIHQoYSxiKXthLmEuc3R5bGUuY3NzVGV4dD1cIm1heC13aWR0aDpub25lO21pbi13aWR0aDoyMHB4O21pbi1oZWlnaHQ6MjBweDtkaXNwbGF5OmlubGluZS1ibG9jaztvdmVyZmxvdzpoaWRkZW47cG9zaXRpb246YWJzb2x1dGU7d2lkdGg6YXV0bzttYXJnaW46MDtwYWRkaW5nOjA7dG9wOi05OTlweDt3aGl0ZS1zcGFjZTpub3dyYXA7Zm9udC1zeW50aGVzaXM6bm9uZTtmb250OlwiK2IrXCI7XCJ9ZnVuY3Rpb24geShhKXt2YXIgYj1hLmEub2Zmc2V0V2lkdGgsYz1iKzEwMDthLmYuc3R5bGUud2lkdGg9YytcInB4XCI7YS5jLnNjcm9sbExlZnQ9YzthLmIuc2Nyb2xsTGVmdD1hLmIuc2Nyb2xsV2lkdGgrMTAwO3JldHVybiBhLmchPT1iPyhhLmc9YiwhMCk6ITF9ZnVuY3Rpb24geihhLGIpe2Z1bmN0aW9uIGMoKXt2YXIgYT1rO3koYSkmJmEuYS5wYXJlbnROb2RlJiZiKGEuZyl9dmFyIGs9YTtsKGEuYixjKTtsKGEuYyxjKTt5KGEpfTtmdW5jdGlvbiBBKGEsYil7dmFyIGM9Ynx8e307dGhpcy5mYW1pbHk9YTt0aGlzLnN0eWxlPWMuc3R5bGV8fFwibm9ybWFsXCI7dGhpcy53ZWlnaHQ9Yy53ZWlnaHR8fFwibm9ybWFsXCI7dGhpcy5zdHJldGNoPWMuc3RyZXRjaHx8XCJub3JtYWxcIn12YXIgQj1udWxsLEM9bnVsbCxFPW51bGwsRj1udWxsO2Z1bmN0aW9uIEcoKXtpZihudWxsPT09QylpZihKKCkmJi9BcHBsZS8udGVzdCh3aW5kb3cubmF2aWdhdG9yLnZlbmRvcikpe3ZhciBhPS9BcHBsZVdlYktpdFxcLyhbMC05XSspKD86XFwuKFswLTldKykpKD86XFwuKFswLTldKykpLy5leGVjKHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50KTtDPSEhYSYmNjAzPnBhcnNlSW50KGFbMV0sMTApfWVsc2UgQz0hMTtyZXR1cm4gQ31mdW5jdGlvbiBKKCl7bnVsbD09PUYmJihGPSEhZG9jdW1lbnQuZm9udHMpO3JldHVybiBGfVxuZnVuY3Rpb24gSygpe2lmKG51bGw9PT1FKXt2YXIgYT1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO3RyeXthLnN0eWxlLmZvbnQ9XCJjb25kZW5zZWQgMTAwcHggc2Fucy1zZXJpZlwifWNhdGNoKGIpe31FPVwiXCIhPT1hLnN0eWxlLmZvbnR9cmV0dXJuIEV9ZnVuY3Rpb24gTChhLGIpe3JldHVyblthLnN0eWxlLGEud2VpZ2h0LEsoKT9hLnN0cmV0Y2g6XCJcIixcIjEwMHB4XCIsYl0uam9pbihcIiBcIil9XG5BLnByb3RvdHlwZS5sb2FkPWZ1bmN0aW9uKGEsYil7dmFyIGM9dGhpcyxrPWF8fFwiQkVTYnN3eVwiLHE9MCxEPWJ8fDNFMyxIPShuZXcgRGF0ZSkuZ2V0VGltZSgpO3JldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihhLGIpe2lmKEooKSYmIUcoKSl7dmFyIE09bmV3IFByb21pc2UoZnVuY3Rpb24oYSxiKXtmdW5jdGlvbiBlKCl7KG5ldyBEYXRlKS5nZXRUaW1lKCktSD49RD9iKCk6ZG9jdW1lbnQuZm9udHMubG9hZChMKGMsJ1wiJytjLmZhbWlseSsnXCInKSxrKS50aGVuKGZ1bmN0aW9uKGMpezE8PWMubGVuZ3RoP2EoKTpzZXRUaW1lb3V0KGUsMjUpfSxmdW5jdGlvbigpe2IoKX0pfWUoKX0pLE49bmV3IFByb21pc2UoZnVuY3Rpb24oYSxjKXtxPXNldFRpbWVvdXQoYyxEKX0pO1Byb21pc2UucmFjZShbTixNXSkudGhlbihmdW5jdGlvbigpe2NsZWFyVGltZW91dChxKTthKGMpfSxmdW5jdGlvbigpe2IoYyl9KX1lbHNlIG0oZnVuY3Rpb24oKXtmdW5jdGlvbiB1KCl7dmFyIGI7aWYoYj0tMSE9XG5mJiYtMSE9Z3x8LTEhPWYmJi0xIT1ofHwtMSE9ZyYmLTEhPWgpKGI9ZiE9ZyYmZiE9aCYmZyE9aCl8fChudWxsPT09QiYmKGI9L0FwcGxlV2ViS2l0XFwvKFswLTldKykoPzpcXC4oWzAtOV0rKSkvLmV4ZWMod2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQpLEI9ISFiJiYoNTM2PnBhcnNlSW50KGJbMV0sMTApfHw1MzY9PT1wYXJzZUludChiWzFdLDEwKSYmMTE+PXBhcnNlSW50KGJbMl0sMTApKSksYj1CJiYoZj09diYmZz09diYmaD09dnx8Zj09dyYmZz09dyYmaD09d3x8Zj09eCYmZz09eCYmaD09eCkpLGI9IWI7YiYmKGQucGFyZW50Tm9kZSYmZC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGQpLGNsZWFyVGltZW91dChxKSxhKGMpKX1mdW5jdGlvbiBJKCl7aWYoKG5ldyBEYXRlKS5nZXRUaW1lKCktSD49RClkLnBhcmVudE5vZGUmJmQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChkKSxiKGMpO2Vsc2V7dmFyIGE9ZG9jdW1lbnQuaGlkZGVuO2lmKCEwPT09YXx8dm9pZCAwPT09YSlmPWUuYS5vZmZzZXRXaWR0aCxcbmc9bi5hLm9mZnNldFdpZHRoLGg9cC5hLm9mZnNldFdpZHRoLHUoKTtxPXNldFRpbWVvdXQoSSw1MCl9fXZhciBlPW5ldyByKGspLG49bmV3IHIoaykscD1uZXcgcihrKSxmPS0xLGc9LTEsaD0tMSx2PS0xLHc9LTEseD0tMSxkPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7ZC5kaXI9XCJsdHJcIjt0KGUsTChjLFwic2Fucy1zZXJpZlwiKSk7dChuLEwoYyxcInNlcmlmXCIpKTt0KHAsTChjLFwibW9ub3NwYWNlXCIpKTtkLmFwcGVuZENoaWxkKGUuYSk7ZC5hcHBlbmRDaGlsZChuLmEpO2QuYXBwZW5kQ2hpbGQocC5hKTtkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGQpO3Y9ZS5hLm9mZnNldFdpZHRoO3c9bi5hLm9mZnNldFdpZHRoO3g9cC5hLm9mZnNldFdpZHRoO0koKTt6KGUsZnVuY3Rpb24oYSl7Zj1hO3UoKX0pO3QoZSxMKGMsJ1wiJytjLmZhbWlseSsnXCIsc2Fucy1zZXJpZicpKTt6KG4sZnVuY3Rpb24oYSl7Zz1hO3UoKX0pO3QobixMKGMsJ1wiJytjLmZhbWlseSsnXCIsc2VyaWYnKSk7XG56KHAsZnVuY3Rpb24oYSl7aD1hO3UoKX0pO3QocCxMKGMsJ1wiJytjLmZhbWlseSsnXCIsbW9ub3NwYWNlJykpfSl9KX07XCJvYmplY3RcIj09PXR5cGVvZiBtb2R1bGU/bW9kdWxlLmV4cG9ydHM9QTood2luZG93LkZvbnRGYWNlT2JzZXJ2ZXI9QSx3aW5kb3cuRm9udEZhY2VPYnNlcnZlci5wcm90b3R5cGUubG9hZD1BLnByb3RvdHlwZS5sb2FkKTt9KCkpO1xuIiwiLyohIGxvemFkLmpzIC0gdjEuNC4wIC0gMjAxOC0wNC0yMlxuKiBodHRwczovL2dpdGh1Yi5jb20vQXBvb3J2U2F4ZW5hL2xvemFkLmpzXG4qIENvcHlyaWdodCAoYykgMjAxOCBBcG9vcnYgU2F4ZW5hOyBMaWNlbnNlZCBNSVQgKi9cbiFmdW5jdGlvbih0LGUpe1wib2JqZWN0XCI9PXR5cGVvZiBleHBvcnRzJiZcInVuZGVmaW5lZFwiIT10eXBlb2YgbW9kdWxlP21vZHVsZS5leHBvcnRzPWUoKTpcImZ1bmN0aW9uXCI9PXR5cGVvZiBkZWZpbmUmJmRlZmluZS5hbWQ/ZGVmaW5lKGUpOnQubG96YWQ9ZSgpfSh0aGlzLGZ1bmN0aW9uKCl7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gdCh0KXt0LnNldEF0dHJpYnV0ZShcImRhdGEtbG9hZGVkXCIsITApfXZhciBlPU9iamVjdC5hc3NpZ258fGZ1bmN0aW9uKHQpe2Zvcih2YXIgZT0xO2U8YXJndW1lbnRzLmxlbmd0aDtlKyspe3ZhciByPWFyZ3VtZW50c1tlXTtmb3IodmFyIG4gaW4gcilPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocixuKSYmKHRbbl09cltuXSl9cmV0dXJuIHR9LHI9ZG9jdW1lbnQuZG9jdW1lbnRNb2RlLG49e3Jvb3RNYXJnaW46XCIwcHhcIix0aHJlc2hvbGQ6MCxsb2FkOmZ1bmN0aW9uKHQpe2lmKFwicGljdHVyZVwiPT09dC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpKXt2YXIgZT1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW1nXCIpO3ImJnQuZ2V0QXR0cmlidXRlKFwiZGF0YS1pZXNyY1wiKSYmKGUuc3JjPXQuZ2V0QXR0cmlidXRlKFwiZGF0YS1pZXNyY1wiKSksdC5hcHBlbmRDaGlsZChlKX10LmdldEF0dHJpYnV0ZShcImRhdGEtc3JjXCIpJiYodC5zcmM9dC5nZXRBdHRyaWJ1dGUoXCJkYXRhLXNyY1wiKSksdC5nZXRBdHRyaWJ1dGUoXCJkYXRhLXNyY3NldFwiKSYmKHQuc3Jjc2V0PXQuZ2V0QXR0cmlidXRlKFwiZGF0YS1zcmNzZXRcIikpLHQuZ2V0QXR0cmlidXRlKFwiZGF0YS1iYWNrZ3JvdW5kLWltYWdlXCIpJiYodC5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2U9XCJ1cmwoJ1wiK3QuZ2V0QXR0cmlidXRlKFwiZGF0YS1iYWNrZ3JvdW5kLWltYWdlXCIpK1wiJylcIil9LGxvYWRlZDpmdW5jdGlvbigpe319LG89ZnVuY3Rpb24odCl7cmV0dXJuXCJ0cnVlXCI9PT10LmdldEF0dHJpYnV0ZShcImRhdGEtbG9hZGVkXCIpfSxhPWZ1bmN0aW9uKGUscil7cmV0dXJuIGZ1bmN0aW9uKG4sYSl7bi5mb3JFYWNoKGZ1bmN0aW9uKG4pe24uaW50ZXJzZWN0aW9uUmF0aW8+MCYmKGEudW5vYnNlcnZlKG4udGFyZ2V0KSxvKG4udGFyZ2V0KXx8KGUobi50YXJnZXQpLHQobi50YXJnZXQpLHIobi50YXJnZXQpKSl9KX19LGk9ZnVuY3Rpb24odCl7cmV0dXJuIHQgaW5zdGFuY2VvZiBFbGVtZW50P1t0XTp0IGluc3RhbmNlb2YgTm9kZUxpc3Q/dDpkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHQpfTtyZXR1cm4gZnVuY3Rpb24oKXt2YXIgcj1hcmd1bWVudHMubGVuZ3RoPjAmJnZvaWQgMCE9PWFyZ3VtZW50c1swXT9hcmd1bWVudHNbMF06XCIubG96YWRcIixkPWFyZ3VtZW50cy5sZW5ndGg+MSYmdm9pZCAwIT09YXJndW1lbnRzWzFdP2FyZ3VtZW50c1sxXTp7fSx1PWUoe30sbixkKSxjPXUucm9vdE1hcmdpbixzPXUudGhyZXNob2xkLGc9dS5sb2FkLGY9dS5sb2FkZWQsbD12b2lkIDA7cmV0dXJuIHdpbmRvdy5JbnRlcnNlY3Rpb25PYnNlcnZlciYmKGw9bmV3IEludGVyc2VjdGlvbk9ic2VydmVyKGEoZyxmKSx7cm9vdE1hcmdpbjpjLHRocmVzaG9sZDpzfSkpLHtvYnNlcnZlOmZ1bmN0aW9uKCl7Zm9yKHZhciBlPWkociksbj0wO248ZS5sZW5ndGg7bisrKW8oZVtuXSl8fChsP2wub2JzZXJ2ZShlW25dKTooZyhlW25dKSx0KGVbbl0pLGYoZVtuXSkpKX0sdHJpZ2dlckxvYWQ6ZnVuY3Rpb24oZSl7byhlKXx8KGcoZSksdChlKSxmKGUpKX19fX0pO1xuIiwiLyoqXG4gKiBGcm9udGVuZCBoZWxwZXIgZnVuY3Rpb25zXG4gKlxuICogQGF1dGhvciBNYXJ0aW4gU3p5bWFuc2tpIDxtYXJ0aW5AZWxmYWNodC5jb20+XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBIZWxwZXIgPSB7XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGVsZW1lbnQgaGFzIGEgY2VydGFpbiBjbGFzc1xuICAgKiBAcGFyYW0ge09iamVjdH0gJHRhcmdldCDigJMgdGhlIHRhcmdldCBlbGVtZW50XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBjbGFzc05hbWUg4oCTIHRoZSBjbGFzcyBuYW1lIHRvIGNoZWNrXG4gICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAqL1xuICBlbEhhc0NsYXNzKCR0YXJnZXQsIGNsYXNzTmFtZSkge1xuICAgIHJldHVybiBuZXcgUmVnRXhwKCcoXFxcXHN8XiknICsgY2xhc3NOYW1lICsgJyhcXFxcc3wkKScpLnRlc3QoJHRhcmdldC5jbGFzc05hbWUpO1xuICB9LFxuXG5cbiAgLyoqXG4gICAqIFRvZ2dsZSBDU1MgY2xhc3NlcyBvZiBlbGVtZW50XG4gICAqXG4gICAqIEBwYXJhbSAge09iamVjdH0gJGVsZW1lbnQgIFt0YXJnZXQgZWxlbWVudF1cbiAgICogQHBhcmFtICB7U3RyaW5nfSBjbGFzc05hbWUgW0NTUyBjbGFzcyBuYW1lLCB3aXRob3V0ICcuJ11cbiAgICogQHJldHVybiB7RnVuY3Rpb259IHRvZ2dsZSBjbGFzc2VzXG4gICAqL1xuICB0b2dnbGVDbGFzc2VzKCRlbGVtZW50LCBjbGFzc05hbWUpIHtcbiAgICBpZiAoJGVsZW1lbnQuY2xhc3NMaXN0KSB7XG4gICAgICAkZWxlbWVudC5jbGFzc0xpc3QudG9nZ2xlKGNsYXNzTmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGNsYXNzZXMgPSAkZWxlbWVudC5jbGFzc05hbWUuc3BsaXQoJyAnKTtcbiAgICAgIGNvbnN0IGV4aXN0aW5nSW5kZXggPSBjbGFzc2VzLmluZGV4T2YoY2xhc3NOYW1lKTtcblxuICAgICAgaWYgKGV4aXN0aW5nSW5kZXggPj0gMClcbiAgICAgICAgY2xhc3Nlcy5zcGxpY2UoZXhpc3RpbmdJbmRleCwgMSk7XG4gICAgICBlbHNlXG4gICAgICAgIGNsYXNzZXMucHVzaChjbGFzc05hbWUpO1xuXG4gICAgICAkZWxlbWVudC5jbGFzc05hbWUgPSBjbGFzc2VzLmpvaW4oJyAnKTtcbiAgICB9XG4gIH0sXG5cblxuICAvKipcbiAgICogQWRkIGNsYXNzZXMgdG8gYW4gZWxlbWVudFxuICAgKiBAcGFyYW0ge09iamVjdH0gJGVsZW1lbnRcbiAgICogQHBhcmFtIHtTdHJpbmd9IGNsYXNzTmFtZVxuICAgKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAgICovXG4gIGFkZENsYXNzZXMoJGVsZW1lbnQsIGNsYXNzTmFtZSkge1xuICAgICAgaWYgKCRlbGVtZW50LmNsYXNzTGlzdCkge1xuICAgICAgICAgICRlbGVtZW50LmNsYXNzTGlzdC5hZGQoY2xhc3NOYW1lKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJGVsZW1lbnQuY2xhc3NOYW1lICs9ICcgJyArIGNsYXNzTmFtZTtcbiAgICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogUmVtb3ZlIGNsYXNzZXMgZnJvbSBhbiBlbGVtZW50XG4gICAqIEBwYXJhbSB7T2JqZWN0fSAkZWxlbWVudFxuICAgKiBAcGFyYW0ge1N0cmluZ30gY2xhc3NOYW1lXG4gICAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICAgKi9cbiAgcmVtb3ZlQ2xhc3NlcygkZWxlbWVudCwgY2xhc3NOYW1lKSB7XG4gICAgICBpZiAoJGVsZW1lbnQuY2xhc3NMaXN0KSB7XG4gICAgICAgICAgJGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShjbGFzc05hbWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkZWxlbWVudC5jbGFzc05hbWUgPSAkZWxlbWVudC5jbGFzc05hbWUucmVwbGFjZShuZXcgUmVnRXhwKCcoXnxcXFxcYiknICsgY2xhc3NOYW1lLnNwbGl0KCcgJykuam9pbignfCcpICsgJyhcXFxcYnwkKScsICdnaScpLCAnICcpO1xuICAgICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBGaW5kIGNsb3Nlc3QgZWxlbWVudCAoY2xhc3MpIG9mIGdpdmVuIGVsZW1lbnRcbiAgICogU291cmNlOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8yNDEwNzU1MFxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gZWwg4oCTIGdpdmVuIGVsZW1lbnQgfCByZXF1aXJlZFxuICAgKiBAcGFyYW0ge1N0cmluZ30gc2VsZWN0b3Ig4oCTIGNsb3Nlc3Qgc2VsZWN0b3IgdG8gZmluZGUgfCByZXF1aXJlZFxuICAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICAqL1xuICBmaW5kQ2xvc2VzdChlbCwgc2VsZWN0b3IpIHtcbiAgICAgIGxldCBtYXRjaGVzRm47XG5cbiAgICAgIC8vIGZpbmQgdmVuZG9yIHByZWZpeFxuICAgICAgWydtYXRjaGVzJywgJ3dlYmtpdE1hdGNoZXNTZWxlY3RvcicsICdtb3pNYXRjaGVzU2VsZWN0b3InLCAnbXNNYXRjaGVzU2VsZWN0b3InLCAnb01hdGNoZXNTZWxlY3RvciddLnNvbWUoZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBkb2N1bWVudC5ib2R5W2ZuXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICBtYXRjaGVzRm4gPSBmbjtcbiAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0pO1xuXG4gICAgICBsZXQgcGFyZW50O1xuXG4gICAgICAvLyB0cmF2ZXJzZSBwYXJlbnRzXG4gICAgICB3aGlsZSAoZWwpIHtcbiAgICAgICAgICBwYXJlbnQgPSBlbC5wYXJlbnRFbGVtZW50O1xuICAgICAgICAgIGlmIChwYXJlbnQgJiYgcGFyZW50W21hdGNoZXNGbl0oc2VsZWN0b3IpKSB7XG4gICAgICAgICAgICByZXR1cm4gcGFyZW50O1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbCA9IHBhcmVudDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG51bGw7XG4gIH0sXG5cblxuXG4gIC8qKlxuICAgKiBHZXQgZG9jdW1lbnQgaGVpZ2h0XG4gICAqXG4gICAqIEByZXR1cm4ge051bWJlcn0gW3JldHVybnMgaGVpZ2h0XVxuICAgKi9cbiAgZ2V0RG9jdW1lbnRIZWlnaHQoKSB7XG4gICAgY29uc3QgYm9keSA9IGRvY3VtZW50LmJvZHk7XG4gICAgY29uc3QgaHRtbCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcbiAgICBjb25zdCBoZWlnaHQgPSBNYXRoLm1heCggYm9keS5zY3JvbGxIZWlnaHQsIGJvZHkub2Zmc2V0SGVpZ2h0LCBodG1sLmNsaWVudEhlaWdodCwgaHRtbC5zY3JvbGxIZWlnaHQsIGh0bWwub2Zmc2V0SGVpZ2h0ICk7XG5cbiAgICByZXR1cm4gaGVpZ2h0O1xuICB9XG59O1xuIiwiLyoqXG4gKiBBZGRpbmcgU1ZHIHNwcml0ZSB0byBsb2NhbFN0b3JhZ2Ugd2l0aFxuICogZmFsbGJhY2sgZm9yIG9sZGVyIGJyb3dzZXJzLlxuICpcbiAqIElNUE9SVEFOVDogVXBkYXRlIGByZXZpc2lvbmAgaWYgdGhlIFNWRyBmaWxlIGhhcyBhbnkgY2hhbmdlcyFcbiAqXG4gKiBAc2VlIGh0dHBzOi8vb3N2YWxkYXMuaW5mby9jYWNoaW5nLXN2Zy1zcHJpdGUtaW4tbG9jYWxzdG9yYWdlXG4gKiBAc2VlIGh0dHBzOi8vb3N2YWxkYXMuaW5mby9leGFtcGxlcy9jYWNoaW5nLXN2Zy1zcHJpdGUtaW4tbG9jYWxzdG9yYWdlL1xuICpcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8vIEEgcGFydCBvZiB0aGUgZmFsbGJhY2sgZm9yIGJyb3dzZXJzIHRoYXQgZG8gbm90IHN1cHBvcnQgU1ZHXG5pZiggIWRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyB8fCAhZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCAnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCAnc3ZnJyApLmNyZWF0ZVNWR1JlY3QgKSB7XG5cdGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N2ZycpO1xuXHRkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd1c2UnKTtcbn1cblxuLy8gU3RvcmluZyBTVkcgU3ByaXRlIGluIGxvY2FsU3RvcmFnZVxuXG47KCBmdW5jdGlvbiggd2luZG93LCBkb2N1bWVudCkge1xuXHQvLyAndXNlIHN0cmljdCc7XG5cbiAgLyoqXG4gICAqIFRPRE86IFVwZGF0ZSBmaWxlbmFtZSBoZXJlISEhXG4gICAqIEB0eXBlIHtTdHJpbmd9XG4gICAqL1xuXHR2YXIgZmlsZVx0ID0gJy9hc3NldHMvc3ZnL3N2Zy5odG1sJyxcblxuICAgICAgLy8gVE9ETzogTXVzdCBiZSB1cGRhdGVkIGFmdGVyIGZpbGVjaGFuZ2UhXG4gICAgICAvLyBUT0RPOiBVc2UgdGhlIFBIUCBzb2x1dGlvbjogaHR0cHM6Ly9vc3ZhbGRhcy5pbmZvL2NhY2hpbmctc3ZnLXNwcml0ZS1pbi1sb2NhbHN0b3JhZ2Vcblx0XHQgIHJldmlzaW9uID0gOTtcblxuXHRpZiAoIWRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyB8fCAhZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsICdzdmcnKS5jcmVhdGVTVkdSZWN0KSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHR2YXIgaXNMb2NhbFN0b3JhZ2UgPSAnbG9jYWxTdG9yYWdlJyBpbiB3aW5kb3cgJiYgd2luZG93WyAnbG9jYWxTdG9yYWdlJyBdICE9PSBudWxsLFxuXHRcdHJlcXVlc3QsXG5cdFx0ZGF0YSxcblx0XHRpbnNlcnRJVCA9IGZ1bmN0aW9uKCkge1xuXG5cdFx0XHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuanMtc3ZnJykuaW5zZXJ0QWRqYWNlbnRIVE1MKCdhZnRlcmJlZ2luJywgZGF0YSk7XG5cdFx0fSxcblxuXHRcdGluc2VydCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKGRvY3VtZW50LmJvZHkpIHtcblx0XHRcdFx0aW5zZXJ0SVQoKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoICdET01Db250ZW50TG9hZGVkJywgaW5zZXJ0SVQpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0aWYgKGlzTG9jYWxTdG9yYWdlICYmIGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdpbmxpbmVTVkdyZXYnKSA9PT0gcmV2aXNpb24pe1xuXHRcdGRhdGEgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSggJ2lubGluZVNWR2RhdGEnICk7XG5cdFx0aWYoZGF0YSkge1xuXHRcdFx0aW5zZXJ0KCk7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdH1cblxuXHR0cnkge1xuXHRcdHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblx0XHRyZXF1ZXN0Lm9wZW4oJ0dFVCcsIGZpbGUsIHRydWUpO1xuXHRcdHJlcXVlc3Qub25sb2FkID0gZnVuY3Rpb24oKSB7XG5cblx0XHRcdGlmIChyZXF1ZXN0LnN0YXR1cyA+PSAyMDAgJiYgcmVxdWVzdC5zdGF0dXMgPCA0MDApIHtcblx0XHRcdFx0ZGF0YSA9IHJlcXVlc3QucmVzcG9uc2VUZXh0O1xuXHRcdFx0XHRpbnNlcnQoKTtcblxuXHRcdFx0XHRpZiAoaXNMb2NhbFN0b3JhZ2UpIHtcblx0XHRcdFx0XHRsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnaW5saW5lU1ZHZGF0YScsXHRkYXRhKTtcblx0XHRcdFx0XHRsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnaW5saW5lU1ZHcmV2JyxcdHJldmlzaW9uKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRyZXF1ZXN0LnNlbmQoKTtcblx0fVxuXG5cdGNhdGNoKGUpe31cblxufSh3aW5kb3csIGRvY3VtZW50KSk7XG5cbi8vIEZhbGxiYWNrIGZvciBicm93c2VycyB0aGF0IGRvIG5vdCBzdXBwb3J0IFNWR1xuXG47KGZ1bmN0aW9uKHdpbmRvdywgZG9jdW1lbnQpe1xuXHRpZiAoZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TICYmIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCAnc3ZnJykuY3JlYXRlU1ZHUmVjdCkge1xuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cbiAgdmFyIHVzZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgndXNlJyksIHVzZTtcblx0d2hpbGUoKHVzZSA9IHVzZXNbMF0pKSB7XG5cdFx0dmFyIHN2ZyA9IHVzZS5wYXJlbnROb2RlLCBpbWcgPSBuZXcgSW1hZ2UoKTtcblx0XHRpbWcuc3JjID0gdXNlLmdldEF0dHJpYnV0ZSgnZGF0YS1pbWcnKTtcblx0XHRzdmcucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoaW1nLCBzdmcpO1xuXHR9XG5cbn0od2luZG93LCBkb2N1bWVudCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuICAvKipcbiAgICogSW50ZXJzZWN0aW9uIG9ic2VydmVyIGZvciBsb3phZC5qc1xuICAgKi9cbiAgY29uc3Qgb2JzZXJ2ZXIgPSBsb3phZCgpOyAvLyBsYXp5IGxvYWRzIGVsZW1lbnRzIHdpdGggZGVmYXVsdCBzZWxlY3RvciBhcyBcIi5sb3phZFwiXG4gIG9ic2VydmVyLm9ic2VydmUoKTtcblxuXG5cblxuXG4gIC8qKlxuICAgKiBGb250IE9ic2VydmVyXG4gICAqL1xuICB2YXIgZm9udCA9IG5ldyBGb250RmFjZU9ic2VydmVyKCdTcGlsbG91dFNhbnMnKTtcblxuICBmb250LmxvYWQoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xhc3NOYW1lICs9ICcgZm9udHMtLWxvYWRlZCc7XG4gIH0pO1xuXG5cblxuXG5cbn0pO1xuIl19
