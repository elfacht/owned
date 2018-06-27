(function() {
  /**
   * Intersection observer for lozad.js
   */
  const observer = lozad(); // lazy loads elements with default selector as ".lozad"
  observer.observe();





  /**
   * Font Observer
   */
  var font = new FontFaceObserver('SpilloutSans');

  font.load().then(function () {
    document.documentElement.className += ' fonts--loaded';
  });





});
