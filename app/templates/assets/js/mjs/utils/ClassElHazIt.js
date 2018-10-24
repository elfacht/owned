/**
 * Check if element has a certain class
 *
 * @param object  $target       – the target element | required
 * @param string  className     – the CSS class name to check | required
 * @return {Boolean}
 */
export default function($target, className) {
  return new RegExp('(\\s|^)' + className + '(\\s|$)').test($target.className);
}
