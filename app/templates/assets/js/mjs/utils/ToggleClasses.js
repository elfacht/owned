/**
 * Toggle CSS classes of element
 *
 * @param  object   $el         – target element | reuqired
 * @param  string className     – CSS class name, without '.' | required
 * @return function
 */
export default function($el, className) {
  if ($el.classList) {
    $el.classList.toggle(className);
  } else {
    const classes = $el.className.split(' ');
    const existingIndex = classes.indexOf(className);

    if (existingIndex >= 0) {
      classes.splice(existingIndex, 1);
    } else {
      classes.push(className);
      $el.className = classes.join(' ');
    }
  }
}
