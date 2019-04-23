<?php

use craft\elements\Entry;
use craft\elements\GlobalSet;
use craft\elements\User;
use craft\helpers\UrlHelper;


return [
  'defaults' => [
    'elementsPerPage' => 50,
    'transformer' => function(Entry $entry) {

      /**
       * Get corportations
       * @var array
       */

      if ($entry->corporations->all()) {
        $corporations = [];
        foreach ($entry->corporations->all() as $corporation) {
          $corporations[] = [
            'id' => $corporation->id,
            'title' => $corporation->title,
            'slug' => $corporation->slug,
          ];
        }
      } else {
        $corporations = null;
      }


      /**
       * Get brand country
       * @var array
       */
      $entryCountry = $entry->country->one();
      if ($entryCountry) {
        $country = [
          'id' => $entryCountry->id,
          'title' => $entryCountry->title,
          'slug' => $entryCountry->slug,
        ];
      } else {
        $country = null;
      }



      $ownership = [
        'is_private' => $entry->isPrivate || false,
        'owned_since' => $entry->ownedSince ? $entry->ownedSince->format(\DateTime::ATOM) : null,
        'corporations' => $corporations,
      ];

      return [
        'id' => $entry->id,
        'title' => $entry->title,
        'slug' => $entry->slug,
        'date_created' => $entry->postDate->format(\DateTime::ATOM),
        'date_modified' => $entry->dateUpdated->format(\DateTime::ATOM),
        'jsonUrl' => UrlHelper::url("api/breweries/{$entry->slug}"),
        // 'is_private' => $entry->isPrivate || false,
        // 'corporation' => $corporations,
        'country' => $country,
        'ownership' => $ownership,
        'note' => $entry->note,
      ];
    },
    // 'transformer' => function(Entry $entry) {
    //
    //   /**
    //    * Get corportations
    //    * @var array
    //    */
    //
    //   if ($entry->corporations->all()) {
    //     $corporations = [];
    //     foreach ($entry->corporations->all() as $corporation) {
    //       $corporations[] = [
    //         'id' => $corporation->id,
    //         'title' => $corporation->title,
    //         'slug' => $corporation->slug,
    //         'url' => '/corporations/' . $corporation->slug,
    //       ];
    //     }
    //   } else {
    //     $corporations = null;
    //   }
    //
    //
    //   /**
    //    * Get brand country
    //    * @var array
    //    */
    //   $country = [
    //     'id' => $entry->country->one()->id || null,
    //     'title' => $entry->country->one()->title || null,
    //     'slug' => $entry->country->one()->slug || null,
    //   ];
    //
    //   return [
    //     'id' => $entry->id,
    //     'title' => $entry->title,
    //     'slug' => $entry->slug,
    //     'date_created' => $entry->postDate->format(\DateTime::ATOM),
    //     'date_modified' => $entry->dateUpdated->format(\DateTime::ATOM),
    //     'jsonUrl' => UrlHelper::url("api/breweries/{$entry->slug}"),
    //     'is_private' => $entry->isPrivate || false,
    //     'corporation' => $corporations,
    //     'country' => $country,
    //     'note' => $entry->note,
    //   ];
    // },
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
    'api/breweries' => function() {
      // Craft::$app->getResponse()->getHeaders()->set('Access-Control-Allow-Origin', '*');

      return [
        'elementType' => Entry::class,
        'criteria' => [
          'section' => 'breweries',
          'orderBy' => 'title asc',
          'search' =>
            (Craft::$app->request->getParam('q'))
            ? 'corporations:'.Craft::$app->request->getParam('q')
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
    'api/corporations' => function() {
      // Craft::$app->getResponse()->getHeaders()->set('Access-Control-Allow-Origin', '*');

      return [
        'elementType' => Entry::class,
        'criteria' => [
          'section' => 'corporations',
          'orderBy' => 'title asc',
        ],
        'paginate' => false,
        // 'cache' => 'PT10M',
        'pretty' => true,
        'transformer' => function(Entry $entry) {
          return [
            'id' => $entry->id,
            'title' => $entry->title,
            'slug' => $entry->slug,
            'date_created' => $entry->postDate->format(\DateTime::ATOM),
            'date_modified' => $entry->dateUpdated->format(\DateTime::ATOM),
            'jsonUrl' => UrlHelper::url("api/corporations/{$entry->slug}"),
          ];
        }
      ];
    },
    'api/corporations/<entryId:{slug}+>' => function($entryId) {
      return [
        'elementType' => Entry::class,
        'criteria' => [
          'slug' => $entryId,
        ],
        'one' => true,
        'transformer' => function(Entry $entry) {
          $criteria = Entry::find()->section('breweries');
          $getBreweries = $criteria->relatedTo($entry, [
            'targetElement' => $entry,
            'field' => 'corporations'
          ])->all();

          if ($getBreweries) {
            $breweries = [];
            foreach ($getBreweries as $brewery) {
              $breweryCountry = [
                'id' => $brewery->country->one()->id,
                'title' => $brewery->country->one()->title,
                'slug' => $brewery->country->one()->slug,
              ];

              $breweries[] = [
                'id' => $brewery->id,
                'title' => $brewery->title,
                'url' => '/breweries/' . $brewery->slug . '/',
                'country' => $breweryCountry,
              ];
            }
          } else {
            $breweries = null;
          }


          /**
           * Get brand country
           * @var array
           */
          $country = [
            'id' => $entry->country->one()->id,
            'title' => $entry->country->one()->title,
            'slug' => $entry->country->one()->slug,
          ];

          return [
            'id' => $entry->id,
            'title' => $entry->title,
            'slug' => $entry->slug,
            'date_created' => $entry->postDate->format(\DateTime::ATOM),
            'date_modified' => $entry->dateUpdated->format(\DateTime::ATOM),
            'country' => $country,
            'breweries' => $breweries,
          ];
        }
      ];
    },
    'api/search' => [
      'elementType' => Entry::class,
      'paginate' => false,
      'criteria' => [
          'section' => ['breweries', 'corporations'],
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
        $country = [
          'id' => $entry->country->one()->id,
          'title' => $entry->country->one()->title,
          'slug' => $entry->country->one()->slug,
        ];

        return [
          'id' => $entry->id,
          'title' => $entry->title,
          'url' => '/'.$entry->type .'/' . $entry->slug . '/',
          'country' => $country,
        ];
      },
    ]
  ]
];
