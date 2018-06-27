/**
 * Adding SVG sprite to localStorage with
 * fallback for older browsers.
 *
 * IMPORTANT: Update `revision` if the SVG file has any changes!
 *
 * @see https://osvaldas.info/caching-svg-sprite-in-localstorage
 * @see https://osvaldas.info/examples/caching-svg-sprite-in-localstorage/
 *
 */

'use strict';

// A part of the fallback for browsers that do not support SVG
if( !document.createElementNS || !document.createElementNS( 'http://www.w3.org/2000/svg', 'svg' ).createSVGRect ) {
	document.createElement('svg');
	document.createElement('use');
}

// Storing SVG Sprite in localStorage

;( function( window, document) {
	// 'use strict';

  /**
   * TODO: Update filename here!!!
   * @type {String}
   */
	var file	 = '/assets/svg/svg.html',

      // TODO: Must be updated after filechange!
      // TODO: Use the PHP solution: https://osvaldas.info/caching-svg-sprite-in-localstorage
		  revision = 9;

	if (!document.createElementNS || !document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect) {
		return true;
	}

	var isLocalStorage = 'localStorage' in window && window[ 'localStorage' ] !== null,
		request,
		data,
		insertIT = function() {

			document.querySelector('.js-svg').insertAdjacentHTML('afterbegin', data);
		},

		insert = function() {
			if (document.body) {
				insertIT();
			} else {
				document.addEventListener( 'DOMContentLoaded', insertIT);
			}
		};

	if (isLocalStorage && localStorage.getItem('inlineSVGrev') === revision){
		data = localStorage.getItem( 'inlineSVGdata' );
		if(data) {
			insert();
			return true;
		}
	}

	try {
		request = new XMLHttpRequest();
		request.open('GET', file, true);
		request.onload = function() {

			if (request.status >= 200 && request.status < 400) {
				data = request.responseText;
				insert();

				if (isLocalStorage) {
					localStorage.setItem('inlineSVGdata',	data);
					localStorage.setItem('inlineSVGrev',	revision);
				}
			}
		};

		request.send();
	}

	catch(e){}

}(window, document));

// Fallback for browsers that do not support SVG

;(function(window, document){
	if (document.createElementNS && document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect) {
		return true;
	}

  var uses = document.getElementsByTagName('use'), use;
	while((use = uses[0])) {
		var svg = use.parentNode, img = new Image();
		img.src = use.getAttribute('data-img');
		svg.parentNode.replaceChild(img, svg);
	}

}(window, document));
