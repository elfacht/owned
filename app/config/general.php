<?php

/**
 * General Configuration
 *
 * All of your system's general configuration settings go in here.
 * You can see a list of the default settings in craft/app/etc/config/defaults/general.php
 */

 // Ensure our urls have the right scheme
 if (!empty($_SERVER['HTTP_X_FORWARDED_PROTO'])) {
   // Support Cloudflare SSL
   define('URI_SCHEME', $_SERVER['HTTP_X_FORWARDED_PROTO'].'://');
 } else {
   // Standard SSL support
   define('URI_SCHEME',  (isset($_SERVER['HTTPS'] ) ) ? 'https://' : 'http://');
 }

 define('SITE_URL', URI_SCHEME . $_SERVER['SERVER_NAME'] . '/');


return [

	// All environments
	'*' => [
		'omitScriptNameInUrls' => true,
		'cpTrigger' => 'admin',

		// Environment-specific variables (see https://craftcms.com/docs/multi-environment-configs#environment-specific-variables)
		'aliases' => array(
			'staticAssetsVersion' => '010',
			'assetsFolder' => SITE_URL . 'assets/'
		),

		'siteUrl' => array(
			'default' => SITE_URL
		),

		// Default Week Start Day (0 = Sunday, 1 = Monday...)
		'defaultWeekStartDay' => 1,

		// Enable CSRF Protection (recommended, will be enabled by default in Craft 3)
		'enableCsrfProtection' => true,
		'imageDriver' => 'imagick',
		'defaultImageQuality' => 100,
		'securityKey' => getenv('SECURITY_KEY'),
		'phpSessionName' => 'SessionId',
    'sendPoweredByHeader' => false,

    // Chose plugins and functions
    'setup' => array(
      'criticalCss' => false,
      'fontsLoaded' => false, // cookies required
      'cookies' => false // cookies plugin required
    )
	],

	// Dev site URL
	'dev' => [
		// 'siteUrl' => 'http://craft-boiler.local',
		'devMode' => true,
		'cache' => false,
		'membersOnly' => false,
		'trackerId' => 3,
		'enableTracking' => false,
		'enableTemplateCaching' => false,
		'aliases' => array(
			'staticAssetsVersion' => time(),
		),

  ],

	// Public site URL
  'staging' => [
		'devMode' => false,
		'cache' => true,
		'membersOnly' => false,
		'trackerId' => 2,
		'enableTracking' => true,
		'enableTemplateCaching' => true,
		'aliases' => array(
			'staticAssetsVersion' => time(),
		),
	],

	// Public site URL
  'production' => [
		'devMode' => false,
		'cache' => true,
		'membersOnly' => false,
		'trackerId' => 1,
		'enableTracking' => true,
		'enableTemplateCaching' => true
	],

];
