/**
 * Scroll to element with transition
 *
 * @param  object  $el            – clicked element | required
 * @param  integer duration       – scrolling duration | optional
 * @param  boolean isOption       – checks if element is <option> | optional
 * @return function
 */
import getelementYPos   from './getelementYPos.js';

export default function($el, duration, isOption) {
  const dur = duration ? duration : 300;

  // check if <option> or <a>
  const target = isOption ? $el.value : $el.getAttribute('href');

  const startingY = window.pageYOffset;

  const dataOffset = $el.dataset.scrollOffset;
  const offset = dataOffset ? dataOffset : 0;
  const elementY = getelementYPos(target) - offset;

  // If element is close to page's bottom then window will scroll only to some position above the element.
  var targetY = document.body.scrollHeight - elementY < window.innerHeight ? document.body.scrollHeight - window.innerHeight : elementY;
  var diff = targetY - startingY;

  // Easing function: easeInOutCubic
  // From: https://gist.github.com/gre/1650294
  const easing = function (t) { return t<0.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1; };
  let start;

  if (!diff) { return; }

  // Bootstrap our animation - it will get called right before next frame shall be rendered.
  window.requestAnimationFrame(function step(timestamp) {
    if (!start) { start = timestamp; }
    // Elapsed miliseconds since start of scrolling.
    const time = timestamp - start;
    // Get percent of completion in range [0, 1].
    let percent = Math.min(time / dur, 1);

    // Apply the easing.
    // It can cause bad-looking slow frames in browser performance tool, so be careful.
    percent = easing(percent);

    window.scrollTo(0, startingY + diff * percent);

    // Proceed with animation as long as we wanted it to.
    if (time < dur) {
      window.requestAnimationFrame(step);
    }
  });
}
