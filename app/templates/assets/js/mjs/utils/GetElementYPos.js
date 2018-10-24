/**
 * Get Y position of element
 *
 * @param  string   query       – query selector | required
 * @return integer       
 */
export default function(query) {
  return window.pageYOffset + document.querySelector(query).getBoundingClientRect().top;
}
