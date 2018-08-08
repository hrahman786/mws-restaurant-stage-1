self.importScripts("js/dexie.js");self.importScripts("js/dbhelper.js");var cacheName="v1";
function createDB(){fetch(DBHelper.DATABASE_URL).then(function(a){return a.json()}).then(function(a){var b=new Dexie("rest30-db");b.version(1).stores({ny:"id,data"});b.ny.bulkPut(a).then(function(a){console.log("Copying data to indexed db");console.log("Last data id was: "+a)})["catch"](Dexie.BulkError,function(a){console.error("Copying did not fully succeed.")})})["catch"](function(){console.log("Network error in Service Worker")})}self.addEventListener("install",function(a){a.waitUntil(caches.open(cacheName).then(function(a){return a.addAll("/ /index.html /restaurant.html service-worker.js manifest.json /js/app.js /js/dbhelper.js /js/main.js /js/restaurant_info.js /js/dexie.js /css/responsive.css /css/styles.css /img/1.webp /img/2.webp /img/3.webp /img/4.webp /img/5.webp /img/6.webp /img/7.webp /img/8.webp /img/9.webp /img/10.webp".split(" "))}))});
self.addEventListener("activate",function(a){a.waitUntil(caches.keys().then(function(a){return Promise.all(a.map(function(a){if(-1===cacheName.indexOf(a))return caches["delete"](a)}))}));a.waitUntil(createDB())});
self.addEventListener("fetch",function(a){a.respondWith(caches.match(a.request).then(function(b){return void 0!==b?b:fetch(a.request).then(function(b){var c=b.clone();caches.open(cacheName).then(function(b){b.put(a.request,c)});return b})["catch"](function(a){console.log("ServiceWorker Error Fetching & Caching Data",a)})}))});