self.importScripts('js/dexie.js');
self.importScripts('js/dbhelper.js');

// Set a name for the current cache
var cacheName = 'v1';

/**
 * Create the Indexed DB store and store the json data from the dev server
 * Using the Dexie library
 */
function createDB()
{
  fetch(DBHelper.DATABASE_URL).then(function(response) { 
    // Convert to JSON
    return response.json();
  }).then(function(j) {
    // Declare Database
    var db = new Dexie("rest30-db");
    db.version(1).stores({
    ny: 'id,data'
    });
    db.ny.bulkPut(j).then(function(lastkey) {
    console.log("Copying data to indexed db");
    console.log("Last data id was: " + lastkey);
    }).catch(Dexie.BulkError, function (e) {
      console.error ("Copying did not fully succeed.");
    });
  }).catch(function() {
    console.log("Network error in Service Worker");   
  });
}

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.addAll([
  '/',
	'/index.html',
	'/restaurant.html',
	'service-worker.js',
  'manifest.json',
	'/js/app.js',
	'/js/dbhelper.js',
	'/js/main.js',
	'/js/restaurant_info.js',
  '/js/dexie.js',
	'/css/responsive.css',
	'/css/styles.css',
	'/img/1.jpg',
	'/img/2.jpg',
	'/img/3.jpg',
	'/img/4.jpg',
	'/img/5.jpg',
	'/img/6.jpg',
	'/img/7.jpg',
	'/img/8.jpg',
	'/img/9.jpg',
	'/img/10.jpg',
  'restaurant-128.ico',
  'restaurant-256.ico',
  'restaurant-512.ico'
      ]);
    })
  );
});

self.addEventListener('activate', function(event) {

  event.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (cacheName.indexOf(key) === -1) {
          return caches.delete(key);
        }
      }));
    })
  );

  // Create the Indexed DB store and store the json data from the dev server 
  event.waitUntil(createDB());

});

self.addEventListener('fetch', function(event) {
  event.respondWith(caches.match(event.request).then(function(response) {
    // caches.match() always resolves
    // but in case of success response will have value
    if (response !== undefined) {
      return response;
    } else {
      return fetch(event.request).then(function (response) {
        // response may be used only once
        // we need to save clone to put one copy in cache
        // and serve second one

        //event.waitUntil(createDB());

        let responseClone = response.clone();
        
        caches.open(cacheName).then(function (cache) {
          cache.put(event.request, responseClone);
        });
        return response;
      }).catch(function(err) {
						console.log('ServiceWorker Error Fetching & Caching Data', err);
      });
    }
  }));
});