/**
 * Bind link to set cookie and hide that element
 *
 * @param  object   $wrapper  – DOM element | required
 * @return function
 */
import {constConsent} from './Constants.js';

export default function($wrapper) {
  const $link = document.querySelector(constConsent.link);

  if ($link && $wrapper) {

    $link.addEventListener('click', function(e) {
      e.preventDefault();

      // Set cookie
      var expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      document.cookie = 'cookieConsent=1;path=/;' + 'expires=' + expiryDate.toGMTString();

      // Hide layer
      $wrapper.parentNode.removeChild($wrapper);
    });
  }
}
