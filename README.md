# Craft Boilerplate

## Setup

### 1. Gulp

Install packages:

`$ /source yarn`

#### 1.1 Browser Sync

Set [browser-sync](source/gulp-tasks/browser-sync.js) proxy:

```js
gulp.defs = {
 ...
 bsProxy           : 'craft-boiler.local' // vhost url
}
```
#### 1.2 Critical CSS

Set proxy path for **criticalcss** task in [source/package.json](source/package.json#L56-L58):

```json
"urls": {
	"critical": "http://spillout.local/"
},
```

Define templates to create CSS in [source/package.json](source/package.json#L62-L73):

```json
"globs": {
    "critical": [
      {
        "url": "",
        "template": "index"
      },
      {
        "url": "404",
        "template": "404"
      }
    ]
  }
```

#### 1.3 JavaScript

Change absolute path for `js` task in [source/gulp-tasks/js.js](source/gulp-tasks/js.js#L27):

```js
.pipe(babel({
	presets: ['/Users/elfacht/htdocs/_sandbox/craft-boiler/source/node_modules/babel-preset-es2016'],
}))
```

### 2. Craft CMS

#### 2.1 Download

Run following command in `app/` to install the CMS and its packages:

```sh
composer install
```

#### 2.2 Setup database

Create the database table before the next step.

#### 2.3 .env file

Add an `.env` file in `app/` and enter the credentials, use the `.env.example` as template.

#### 2.4 Setup vhost

Setup a vhost like [http://craft-boiler.local](http://craft-boiler.local) and map it to:

```
app/web/
```

#### 2.5 Install Craft

Go to [http://craft-boiler.local/admin/install](http://craft-boiler.local/admin/install) and follow the instructions.

#### 2.6 Install default architecture

Go to `Settings -> Plugins` and install the **Architecure** plugin. Go to the the Architecture settings and copy the contents from [source/craft-architecture.json](source/craft-architecture.json).

#### 2.7 Setup .htaccess

Rename [app/web/.htaccess.example](app/web/.htaccess.example) to `app/.htaccess`.
