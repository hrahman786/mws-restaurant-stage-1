
let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []

/**
 * Update Restaurants, fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  document.getElementById('map-container').style.display = 'none'; // ensure View Map button is hidden on load
  updateRestaurants();
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML - Not used
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
}

/**
 * Display/Hide Google map, when button is clicked
 */
function displayMap()
{
  if (document.getElementById('map-container').style.display == 'none') {
    document.getElementById('toggleMap').value = 'Hide Map';
    document.getElementById('map-container').style.display = 'block';
    initialize();
    updateRestaurants();
  }
  else {
    document.getElementById('toggleMap').value = 'View Map';
    document.getElementById('map-container').style.display = 'none';
  }
}

/**
 * Initialize Google maps
 */
function initialize()
{
  var myOptions = {
    zoom: 12,
    center: new google.maps.LatLng( 40.722216, -73.987501 ),
    scrollwheel: false
  }
  // create the map
  map = new google.maps.Map( document.getElementById( "map" ),myOptions );
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');
  // Add tab index for accessibility
  li.tabIndex = 0;

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = 'Image of restaurant ' + restaurant.name;
  li.append(image);

  const name = document.createElement('h1');
  name.innerHTML = restaurant.name; 
  li.append(name);

  // Add favorite
  const fav = document.createElement('button');
  fav.innerHTML = '❤';
  fav.classList.add("fav_btn");
  // Change fav status on click
  fav.onclick = function() {
    const isFavNow = !restaurant.is_favorite;
    console.log("isFavNow:" + isFavNow);
    // fetch from API server
    fetch(`http://localhost:1337/restaurants/${restaurant.id}/?is_favorite=${isFavNow}`, {
        method: 'PUT'
    });
    // Modify idb
    var db = new Dexie("restaurants1-db");
    db.version(1).stores({
      ny: 'id'
    });
    db.ny.where("id").equals(restaurant.id).modify({is_favorite: isFavNow});

    restaurant.is_favorite = !restaurant.is_favorite
    changeFavElementClass(fav, restaurant.is_favorite)
  };
  changeFavElementClass(fav, restaurant.is_favorite)
  li.append(fav);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more)

  return li
}

/**
 * Change the favorite symbol when it is toggled.
 */
changeFavElementClass = (el, fav) => {
  if (!fav) {
    el.classList.remove('favorite_yes');
    el.classList.add('favorite_no');
    el.setAttribute('aria-label', 'mark as favorite');
  } 
  else 
  {
    el.classList.remove('favorite_no');
    el.classList.add('favorite_yes');
    el.setAttribute('aria-label', 'remove as favorite');
  }
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}
