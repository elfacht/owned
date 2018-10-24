/**
 * Re-position carousel arrows
 *
 * @param  event   event | required
 * @return function
 */
export default function(event) {
  var current = event.index,
      $target = event.event.path[3],
      $item = $target.querySelectorAll('.tns-item')[current],
      $arrow = $target.querySelectorAll('.tns-controls [data-controls]'),
      dotsOffset = 16,
      $image;

  if ($item) {
    $image = $item.querySelector('.c-image');

    if ($image) {

      // Get image height
      var imageHeight = $image ? $image.offsetHeight : 0;

      if ($arrow.length) {
        for (var i = 0; i < $arrow.length; i++) {
          var arrowHeight = $arrow[i].offsetHeight, // Get arrow height
              topPosition = (imageHeight / 2) - (arrowHeight / 2);

          $arrow[i].style.top = topPosition + 'px';
        }
      }
    }

  }
}
