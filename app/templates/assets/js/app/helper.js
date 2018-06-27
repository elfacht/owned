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

      if (existingIndex >= 0)
        classes.splice(existingIndex, 1);
      else
        classes.push(className);

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
    const height = Math.max( body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight );

    return height;
  }
};
