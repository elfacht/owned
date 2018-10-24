/**
 * Back to top link
 *
 * -  triggers DOM element by scrolling up
 *    after X of pixels
 *
 * @type function
 */
import removeClasses from './utils/ClassRemove.js';
import addClasses from './utils/ClassAdd.js';

export default function($el) {
  const $element = document.querySelector('[data-backtotop]');
  const activeClass = 'm-backtotop--active';
  const offset = 900;
  let lastScrollTop = 0;

  window.addEventListener('scroll', () => {
    let st = window.pageYOffset || document.documentElement.scrollTop;

    // if scroll direction is DOWN
    if (st > lastScrollTop) {

      // hide
      removeClasses($el, activeClass);

    // if scroll direction is UP
    } else {
      if (st > offset) {
        addClasses($el, activeClass);
      } else {
        removeClasses($el, activeClass);
      }
    }

    lastScrollTop = st;

  }, false);
}
