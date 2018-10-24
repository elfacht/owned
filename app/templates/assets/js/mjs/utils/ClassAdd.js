/**
 * Add classes to an element
 *
 * @param object  $element      – DOM element | required
 * @param string  className     – CSS class to be added | required
 * @return function
 */
export default function($element, className) {
  if ($element.classList) {
    $element.classList.add(className);
  } else {
    $element.className += ' ' + className;
  }
}
