<?php

/**
 * General Configuration
 *
 * All of your system's general configuration settings go in here.
 * You can see a list of the default settings in craft/app/etc/config/defaults/general.php
 */

return [

	// All environments
	'*' => [
		'omitScriptNameInUrls' => true,
		'cpTrigger' => 'admin',

		// Environment-specific variables (see https://craftcms.com/docs/multi-environment-configs#environment-specific-variables)
		'aliases' => array(
			'staticAssetsVersion' => '1',
		),

		// Default Week Start Day (0 = Sunday, 1 = Monday...)
		'defaultWeekStartDay' => 1,

		// Enable CSRF Protection (recommended, will be enabled by default in Craft 3)
		'enableCsrfProtection' => true,
		'imageDriver' => 'imagick',
		'defaultImageQuality' => 100,
		'securityKey' => getenv('SECURITY_KEY'),
		'phpSessionName' => 'SessionId'
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
		'membersOnly' => true,
		'trackerId' => 1,
		'enableTracking' => true,
		'enableTemplateCaching' => true
	],

];
