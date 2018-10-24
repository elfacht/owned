/**
 * Cookie consent layer
 *
 * -  checks for cookie and triggers DOM element
 *
 * @param object  $el  – DOM element | required
 */
import {constConsent} from './Constants.js';
import removeClasses from './utils/ClassRemove.js';
import addClasses from './utils/ClassAdd.js';
import bindLink from './ConsentLink.js';

/**
 * Show layer when cookie is not set
 * @return {Function}
 */
export function consent($el) {
  const _this = this;
  const cookie = document.cookie;

  if (document.cookie.indexOf('cookieConsent=1') != -1) {
    removeClasses($el, constConsent.activeClass);
  } else {
    addClasses($el, constConsent.activeClass);
    bindLink($el);
  }
}
