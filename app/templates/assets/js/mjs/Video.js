/**
 * Video player
 *
 * – using videojs for custom style
 * - appends responsive video elements to DOM element
 *
 * @param object $el    – DOM video object | required
 */

export default function($el) {
  for (let i = 0; i < $el.length; i++) {
    const $video = $el[i];
    const videoId = $video.dataset.video;
    const viewport = window.innerWidth;

    // Get video URLs
    const mp4 = $video.dataset.videoMp4;
    const mp4Mobile = $video.dataset.videoMp4mobile;
    const webm = $video.dataset.videoWebm;
    const webmMobile = $video.dataset.videoWebmMobile;

    // Define mobile URLs with fallback
    const mp4MobileVideo = mp4Mobile ? mp4Mobile : mp4;
    const webmMobileVideo = webmMobile ? webmMobile : mp4;

    // Hide context menu
    if ($video.addEventListener) {
      $video.addEventListener('contextmenu', function(e) {
        e.preventDefault();
      }, false);
    } else {
      $video.attachEvent('oncontextmenu', function() {
        window.event.returnValue = false;
      });
    }

    // Append videos
    if (viewport < 769) {
      if (mp4MobileVideo) {
        $video.insertAdjacentHTML('beforeend', '<source src="' + mp4MobileVideo + '" type="video/mp4">');
      }

      if (webmMobileVideo) {
        $video.insertAdjacentHTML('beforeend', '<source src="' + webmMobileVideo + '" type="video/webm">');
      }
    } else {
      if (mp4) {
        $video.insertAdjacentHTML('beforeend', '<source src="' + mp4 + '" type="video/mp4">');
      }

      if (webm) {
        $video.insertAdjacentHTML('beforeend', '<source src="' + webm + '" type="video/webm">');
      }
    }
  }
}
