/**
 * Check if checkbox is checked
 *
 * @param object   $checkbox      – checkbox DOM element | required
 * @return boolean
 */
export default function($checkbox) {
  return $checkbox.checked ? true : false;
}
