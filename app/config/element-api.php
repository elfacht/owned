<?php

use craft\elements\Entry;
use craft\elements\GlobalSet;
use craft\elements\User;
use craft\helpers\UrlHelper;


return [
  'defaults' => [
    'elementsPerPage' => 100,
    'transformer' => function(Entry $entry) {

      /**
       * Get corportations
       * @var array
       */

      if ($entry->owners->all()) {
        $owners = [];
        foreach ($entry->owners->all() as $owner) {
          $owners[] = [
            'id' => $owner->id,
            'title' => $owner->title,
            'slug' => $owner->slug,
          ];
        }
      } else {
        $owners = null;
      }


      /**
       * Get brand country
       * @var array
       */
      $countrySlug = $entry->country->value;
      if ($countrySlug && $countrySlug !== 'null') {
        $country = [
          'title' => $entry->country->label,
          'slug' => $entry->country->value,
        ];
      } else {
        $country = null;
      }


      $ownership = [
        'is_independent' => $entry->isPrivate || false,
        'owned_since' => $entry->ownedSince ? $entry->ownedSince->format(\DateTime::ATOM) : null,
        'owners' => $owners,
      ];

      return [
        'id' => $entry->id,
        'title' => $entry->title,
        'slug' => $entry->slug,
        'date_created' => $entry->postDate->format(\DateTime::ATOM),
        'date_modified' => $entry->dateUpdated->format(\DateTime::ATOM),
        'jsonUrl' => UrlHelper::url("api/breweries/{$entry->slug}"),
        // 'is_private' => $entry->isPrivate || false,
        // 'owner' => $owners,
        'city' => $entry->city,
        'country' => $country,
        'ownership' => $ownership,
        'note' => $entry->note,
      ];
    },
  ],


  /**
   *
   * Settings endpoints
   *
   *
   *
   *
   *
   *
   *
   */
  'endpoints' => [
    'api/user' => function() {
      return [
        'elementType' => craft\elements\User::class,
        'one' => true,
        'transformer' => function(craft\elements\User $user) {
          $isLoggedIn = $user->isCurrent;

          return [
            // 'user' => $user,
            'loggedIn' => (bool) $user->isCurrent
          ];
        }
      ];
    },

    'api/breweries' => function() {
      // Craft::$app->getResponse()->getHeaders()->set('Access-Control-Allow-Origin', '*');

      return [
        'elementType' => Entry::class,
        'criteria' => [
          'section' => 'breweries',
          'orderBy' => 'title asc',
          'search' =>
            (Craft::$app->request->getParam('q'))
            ? 'owners:'.Craft::$app->request->getParam('q')
            .' OR ' . 'country:'.Craft::$app->request->getParam('q')
            .' OR ' . 'isPrivate:'.Craft::$app->request->getParam('q')
            : ''
        ],
        // 'cache' => 'PT10M',
        'pretty' => true,
      ];
    },
    'api/breweries/<entryId:{slug}+>' => function($entryId) {
      // Craft::$app->getResponse()->getHeaders()->set('Access-Control-Allow-Origin', '*');

      return [
        'elementType' => Entry::class,
        'criteria' => ['slug' => $entryId],
        'one' => true,
      ];
    },
    'api/owners' => function() {
      // Craft::$app->getResponse()->getHeaders()->set('Access-Control-Allow-Origin', '*');

      return [
        'elementType' => Entry::class,
        'criteria' => [
          'section' => 'owners',
          'orderBy' => 'title asc',
        ],
        'elementsPerPage' => 1000,
        // 'cache' => 'PT10M',
        'pretty' => true,
        'transformer' => function(Entry $entry) {
          $criteria = Entry::find()->section('breweries');
          $getBreweries = $criteria->relatedTo($entry, [
            'targetElement' => $entry,
            'field' => 'owners'
          ])->all();

          return [
            'id' => $entry->id,
            'title' => $entry->title,
            'slug' => $entry->slug,
            'date_created' => $entry->postDate->format(\DateTime::ATOM),
            'date_modified' => $entry->dateUpdated->format(\DateTime::ATOM),
            'jsonUrl' => UrlHelper::url("api/owners/{$entry->slug}"),
            'breweries' => (int) count($getBreweries),
          ];
        }
      ];
    },
    'api/owners/<entryId:{slug}+>' => function($entryId) {
      return [
        'elementType' => Entry::class,
        'criteria' => [
          'slug' => $entryId,
          'section' => 'owners'
        ],
        'one' => true,
        'transformer' => function(Entry $entry) {
          $criteria = Entry::find()->section('breweries');
          $getBreweries = $criteria->relatedTo($entry, [
            'targetElement' => $entry,
            'field' => 'owners'
          ])->all();

          if (count($getBreweries) >= 1) {
            $breweries = [];
            foreach ($getBreweries as $brewery) {
              $breweryCountrySlug = $brewery->country->value;

              if ($breweryCountrySlug && $breweryCountrySlug !== 'null') {
                $breweryCountry = [
                  'title' => $brewery->country->label,
                  'slug' => $brewery->country->value,
                ];
              } else {
                $breweryCountry = null;
              }


              $breweries[] = [
                'id' => $brewery->id,
                'title' => $brewery->title,
                'slug' => $brewery->slug,
                'country' => $breweryCountry,
                'owned_since' => $brewery->ownedSince,
              ];
            }
          } else {
            $breweries = null;
          }


          /**
           * Subsidiaries
           */
          if ($entry->subsidiary->all() ?? null) {
            $subsidiaries = [];
            foreach ($entry->subsidiary->all() as $subsidiary) {
              $subsidiaries[] = [
                'id' => $subsidiary->id,
                'title' => $subsidiary->title,
                'slug' => $subsidiary->slug,
              ];
            }
          } else {
            $subsidiaries = null;
          }


          /**
           * Get brand country
           * @var array
           */
          $countrySlug = $entry->country->value;

          if ($countrySlug !== 'null') {
            $country = [
              'title' => $entry->country->label,
              'slug' => $entry->country->value,
            ];
          } else {
            $country = null;
          }



          return [
            'id' => $entry->id,
            'title' => $entry->title,
            'slug' => $entry->slug,
            'date_created' => $entry->postDate->format(\DateTime::ATOM),
            'date_modified' => $entry->dateUpdated->format(\DateTime::ATOM),
            'country' => $country,
            'subsidiaries' => $subsidiaries,
            'breweries' => $breweries,
            'note' => $entry->note,
            'source' => $entry->sourceUrl,
          ];
        }
      ];
    },
    'api/search' => [
      'elementType' => Entry::class,
      'paginate' => false,
      'criteria' => [
          'section' => ['breweries', 'owners'],
          'limit' => 10,
          'search' =>
            (Craft::$app->request->getParam('q'))
            ? 'title:'.'*'.Craft::$app->request->getParam('q').'*'
            .' OR ' . 'country:'.'*'.Craft::$app->request->getParam('q').'*'
            .' OR ' . 'tags:'.'*'.Craft::$app->request->getParam('q').'*'
            : ''
          ],
      'transformer' => function(Entry $entry) {
        /**
         * Get all course categories
         * @var array
         */
        $countrySlug = $entry->country->value;

        if ($countrySlug && $countrySlug !== 'null') {
          $country = [
            'title' => $entry->country->label,
            'slug' => $entry->country->value,
          ];
        } else {
          $country = null;
        }

        $entryType = ($entry->type->handle == 'breweries') ? 'brewery' : 'owner';

        return [
          'id' => $entry->id,
          'title' => $entry->title,
          'url' => '/'.$entry->type .'/' . $entry->slug . '/',
          'country' => $country,
          'type' => $entryType
        ];
      },
    ],

    'api/latest/breweries' => [
      'elementType' => Entry::class,
      'paginate' => false,
      'criteria' => [
          'section' => 'breweries',
          'limit' => 5,
          'orderBy' => 'postDate desc',
          'search' =>
            (Craft::$app->request->getParam('q'))
            ? 'section:'.'*'.Craft::$app->request->getParam('q').'*'
            : ''
          ],
      'transformer' => function(Entry $entry) {
        return [
          'id' => $entry->id,
          'title' => $entry->title,
          'date_created' => $entry->postDate->format(\DateTime::ATOM),
          'slug' => $entry->slug,
        ];
      },
    ],

    'api/latest/owners' => [
      'elementType' => Entry::class,
      'paginate' => false,
      'criteria' => [
          'section' => 'owners',
          'limit' => 5,
          'orderBy' => 'postDate desc',
          'search' =>
            (Craft::$app->request->getParam('q'))
            ? 'section:'.'*'.Craft::$app->request->getParam('q').'*'
            : ''
          ],
      'transformer' => function(Entry $entry) {
        return [
          'id' => $entry->id,
          'title' => $entry->title,
          'date_created' => $entry->postDate->format(\DateTime::ATOM),
          'slug' => $entry->slug,
        ];
      },
    ]
  ]
];
