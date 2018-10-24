/**
 * Remove classes from an element
 *
 * @param object  $element        – DOM element | required
 * @param string  className       – CSS class to be removed | required
 * @return {Function}
 */
export default function($element, className) {
  if ($element.classList) {
    $element.classList.remove(className);
  } else {
    $element.className = $element.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
  }
}
