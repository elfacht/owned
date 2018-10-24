// Plugins
require('./vendor/intersection-observer');
const FontFaceObserver = require('./vendor/fontfaceobserver.js');
const lozad = require('./vendor/lozad.js');
// const videojs = require('./vendor/video.min.js');
// import videojs from '../vendor/video.min.js';

// Modules
import {constConsent} from './mjs/Constants.js';
import video from './mjs/Video.js';
import scroller from './mjs/Scroller.js';
import backToTop from './mjs/BackToTop.js';
import isChecked from './mjs/utils/IsChecked.js';
import removeClasses from './mjs/utils/ClassRemove.js';
import addClasses from './mjs/utils/ClassAdd.js';
import {consent}  from './mjs/Consent.js';


// DOM ready
(function() {

  /**
   * Check if all fonts are loaded and add
   * class to document.
   *
   * @type array
   */
  let fontObservers = [
    new FontFaceObserver('Quicksand'),
    new FontFaceObserver('Quicksand', {weight: 'bold'}),
    new FontFaceObserver('Lato'),
    new FontFaceObserver('Lato', {style: 'italic'}),
    new FontFaceObserver('Lato', {style: 'bold'}),
    new FontFaceObserver('Lato', {weight: 300})
  ];

  Promise.all(fontObservers).then(function() {
    document.documentElement.className += ' fonts--loaded';
  });


  /**
   * Init lazy loading images
   */
  const observer = lozad(); // lazy loads elements with default selector as ".lozad"
  observer.observe();



  /**
   * Cookie consent
   */
  const $consent = document.querySelector(constConsent.wrapper);
  if ($consent) {
    consent($consent);
  }


  /**
   * Init back to top link
   */
  const $backtotop = document.querySelector('[data-backtotop]');
  if ($backtotop) {
    backToTop($backtotop);
  }




  /**
   * Init animated scrolling
   */
  const $scroller = document.querySelectorAll('[data-scroller]');
  if ($scroller) {
    scroller($scroller);
  }



   /**
    * Disable scrolling while mobile
    * menu is open
    */
   const $menu = document.querySelector('.js-menu-checkbox');
   if ($menu) {
     $menu.addEventListener('change', function(e) {
       if (isChecked(this)) {
         addClasses(document.body, 'overflow-hidden');
       } else {
         removeClasses(document.body, 'overflow-hidden');
       }
     });
   }


   const $video = document.querySelectorAll('[data-video]');
   if ($video) {
     video($video);
   }


})();
