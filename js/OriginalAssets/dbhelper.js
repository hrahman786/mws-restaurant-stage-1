/**
 * Common database helper functions.
 */

class DBHelper {

  /*
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to read from the development server
    return `http://localhost:${port}/restaurants/`;
  }

  static get DATABASE_REVIEW_URL() {
    const port = 1337 // Change this to read from the development server
    return `http://localhost:${port}/reviews/?restaurant_id=`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    var db = new Dexie("restaurants1-db");
    db.version(1).stores({
      ny: 'id'
    });
    db.ny
    .orderBy('id')
    .toArray()
    .then(function(j) {
      // Return the JavaScript object
      callback(null, j);
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    var db = new Dexie("restaurants1-db");
    db.version(1).stores({
      ny: 'id'
    });
    db.ny
    .orderBy('id')
    .toArray()
    .then(function(j) {
      const jfilter = j.filter(r => r.id == Number(id));
      // Return the filtered JavaScript object
      callback(null, jfilter);
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    var db = new Dexie("restaurants1-db");
    db.version(1).stores({
      ny: 'id'
    });
    db.ny
    .orderBy('id')
    .toArray()
    .then(function(j) {
      // Filter restaurants to have only given cuisine type
      const results = j.filter(r => r.cuisine_type == cuisine);
      callback(null, results);
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    var db = new Dexie("restaurants1-db");
    db.version(1).stores({
      ny: 'id'
    });
    db.ny
    .orderBy('id')
    .toArray()
    .then(function(j) {
      // Filter restaurants to have only given cuisine type
      const results = j.filter(r => r.neighborhood == neighborhood);
      callback(null, results);
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    var db = new Dexie("restaurants1-db");
    db.version(1).stores({
      ny: 'id'
    });
    db.ny
    .orderBy('id')
    .toArray()
    .then(function(restaurants) {
      let results = restaurants
      if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
      }
      if (neighborhood != 'all') { // filter by neighborhood
        results = results.filter(r => r.neighborhood == neighborhood);
      }
      callback(null, results);
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    fetch(DBHelper.DATABASE_URL).then(function(response) { 
      // Convert to JSON
      return response.json();
    }).then(function(restaurants) {
      // Get all neighborhoods from all restaurants
      const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
      // Remove duplicates from neighborhoods
      const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
      callback(null, uniqueNeighborhoods);
    }).catch(function() {
      // Read from Indexdb if network error
      var db = new Dexie("restaurants1-db");
      db.version(1).stores({
      ny: 'id'
      });
      db.ny
      .orderBy('id')
      .toArray()
      .then(function(restaurants) {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      });
        console.log("Network error in Neighbourhoods");
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    fetch(DBHelper.DATABASE_URL).then(function(response) { 
      // Convert to JSON
      return response.json();
    }).then(function(restaurants) {
      // Get all cuisines from all restaurants
      const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
      // Remove duplicates from cuisines
      const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
      callback(null, uniqueCuisines);
    }).catch(function() {
      // Read from Indexdb if network error
      var db = new Dexie("restaurants1-db");
      db.version(1).stores({
      ny: 'id'
      });
      db.ny
      .orderBy('id')
      .toArray()
      .then(function(restaurants) {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      });
      console.log("Network error in Cuisines");
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}.webp`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

  // Reviews
  /**
  * Fetch all reviews.
  */
  static fetchReviews(id, callback) {
    var db = new Dexie("reviews1-db");
      db.version(1).stores({
      ny: 'id,restaurant_id,[id+restaurant_id]'
    });
    var restid = parseInt(id); 
    db.open().then(function(){
    return db.ny
      .where('restaurant_id')
      .equals(restid)
      .toArray();
    }).then(function(idbreviews){
      //self.reviews = JSON.stringify(idbreviews, null, 2); 
      console.log("fetchReviews log - Reviews found from idb: " + JSON.stringify(idbreviews, null, 2));
      callback(null, idbreviews);
    }).catch (function (e) {
      //console.log (e);
      callback(e, null);
    });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchReviewsByRestaurantId(id, callback) {
    //fetch(DBHelper.DATABASE_REVIEW_URL + id, {cache: "no-cache"}).then(function(response) {
    fetch(DBHelper.DATABASE_REVIEW_URL + id).then(function(response) { 
      // Convert to JSON
      if (!response.ok) {
        throw Error("fetchReviewsByRestaurantId API Server error: " + response.statusText);
      }
      return response.json();
    }).then(function(j) {
      // Return the JavaScript object
      //console.log("fetchReviewsByRestaurantId log - Reviews found from API Server: " + JSON.stringify(j, null, 2));
      callback(null, j);
    }).catch(function(error) {
        console.log("fetchReviewsByRestaurantId error: " + error);
        callback(error, null);
    });
  }

//end of class
}
