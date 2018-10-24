/**
 * Bind animated scrolling
 *
 * @param  object   $el       – element with data-scrolling attribute | required
 * @return function
 */
import scrollTo   from './utils/ScrollToElement.js';

export default function($el) {
  for (let i = 0; i < $el.length; i++) {
    $el[i].addEventListener('click', function(e) {
      e.preventDefault();
      scrollTo(this);
    }, false);
  }
}
