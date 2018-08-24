let restaurant;
var map;
var db;
let reviews;
let idbreviews;

function getQueryVariable(variable)
{
       var query = window.location.search.substring(1);
       var vars = query.split("&");
       for (var i=0;i<vars.length;i++) {
               var pair = vars[i].split("=");
               if(pair[0] == variable){return pair[1];}
       }
       return(false);
}

// listen for network status change back to online
  window.addEventListener('online', () => {
    var restID = parseInt(getQueryVariable("id"));
    console.log("Back online! ID is " + restID);
    // Add any offline reviews
    // Retrieve offline reviews (having id >= 1000), if any
    db = new Dexie("reviews1-db");
    db.version(1).stores({
      ny: 'id,restaurant_id,[id+restaurant_id]'
    });
    db.ny
    .where("[id+restaurant_id]").between([1000,restID],[2000,restID])
    .toArray()
    .then(function(j) {
      return j;
    }).then(function(j) {
      if (typeof(j) == 'undefined' || j == null || j.length == 0) {
        console.log("No offline reviews added.")
      }
      else 
      {
        j.forEach(function (jItem) {
          var id = jItem.restaurant_id;
          var name = jItem.name;
          var rating = jItem.rating;
          var comments = jItem.comments;
          // Add the review
          var newReviewID = addReview(id, name, rating, comments);
          newReviewID.then((rev) => {
          // insert into the idb store
          var table = db.table("ny");
          table.put({ id: rev.id, restaurant_id: id, name: name, createdAt: rev.createdAt, updatedAt: rev.updatedAt, rating: rating, comments: comments });
          });
        });

        // delete offline reviews in idb
        db = new Dexie("reviews1-db");
        db.version(1).stores({
          ny: 'id,restaurant_id,[id+restaurant_id]'
        });
        db.ny
        .where("[id+restaurant_id]").between([1000,restID],[2000,restID])
        .delete()
        .then(function (deleteCount) {
          console.log( "Deleted " + deleteCount + " objects");
        });
      } 
    });
  });

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant[0].latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    document.getElementById("id").value = id;
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant[0].name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant[0].address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant[0]);
  image.alt = 'Image of restaurant ' + restaurant[0].name; 

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant[0].cuisine_type;

  // fill operating hours
  if (restaurant[0].operating_hours) {
    fillRestaurantHoursHTML(); 
  }

// Check if online or not
if (navigator.onLine) {
    
  DBHelper.fetchReviewsByRestaurantId(restaurant[0].id, (error, reviews) => {

    self.reviews = reviews;
    if (!reviews) {
      // error occurred on api server, populate from idb
      if (error) {
        DBHelper.fetchReviews(restaurant[0].id, (error, idbreviews) => {
          self.reviews = idbreviews;
          if (!idbreviews) {
            //console.log(error);
            return;
          }
          fillReviewsHTML();
          callback(null, idbreviews)
        });
      }
      else 
      {
        console.log("no reviews");
        return;
      }
    }
    // reviews found, populate idb with reviews from API server and then add any offline reviews both to api server and idb
    else {
      
      db = new Dexie("reviews1-db");
      db.version(1).stores({
        ny: 'id,restaurant_id,[id+restaurant_id]'
      });

      // Add reviews from api server
      db.ny.bulkPut(self.reviews).then(function(lastkey) {
        console.log("Copying data to indexed db");
        console.log("Last data id was: " + lastkey);
      }).catch(Dexie.BulkError, function (e) {
        console.error ("Copying did not fully succeed.");
      });

      //fillReviewsHTML();

      // Add any offline reviews
      // Retrieve offline reviews (having id >= 1000), if any
      db.ny
      .where("[id+restaurant_id]").between([1000,restaurant[0].id],[2000,restaurant[0].id])
      .toArray()
      .then(function(j) {
        return j;
      }).then(function(j) {
        if (typeof(j) == 'undefined' || j == null || j.length == 0) {
          console.log("No offline reviews added.")
        }
        else 
        {
          j.forEach(function (jItem) {
            var id = jItem.restaurant_id;
            var name = jItem.name;
            var rating = jItem.rating;
            var comments = jItem.comments;
            // Add the review
            var newReviewID = addReview(id, name, rating, comments);
            newReviewID.then((rev) => {
              // insert into the idb store
              var table = db.table("ny");
              table.put({ id: rev.id, restaurant_id: id, name: name, createdAt: rev.createdAt, updatedAt: rev.updatedAt, rating: rating, comments: comments });
            });
          });

          // delete offline reviews in idb
          db = new Dexie("reviews1-db");
          db.version(1).stores({
            ny: 'id,restaurant_id,[id+restaurant_id]'
          });
          db.ny
          .where("[id+restaurant_id]").between([1000,restaurant[0].id],[2000,restaurant[0].id])
          .delete()
          .then(function (deleteCount) {
              console.log( "Deleted " + deleteCount + " objects");
          });
        } 
      });

      DBHelper.fetchReviews(restaurant[0].id, (error, idbreviews) => {
        self.idbreviews = idbreviews;
        if (!idbreviews) {
          //console.log(error);
          return;
        }
        fillIDBReviewsHTML();
        callback(null, idbreviews)
      });

    }
    
    return;
    
  });
}
else 
{
  // offline
  DBHelper.fetchReviews(restaurant[0].id, (error, idbreviews) => {
    self.reviews = idbreviews;
    if (!idbreviews) {
      //console.log(error);
      return;
    }
    fillReviewsHTML();
    callback(null, idbreviews)
  });
}

}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant[0].operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.reviews) => {
  const container = document.getElementById('reviews-container');

  /*const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  title.tabIndex = 0;
  container.appendChild(title);*/

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillIDBReviewsHTML = (reviews = self.idbreviews) => {
  const container = document.getElementById('reviews-container');

  /*const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  title.tabIndex = 0;
  container.appendChild(title);*/

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  ul.innerHTML = "";
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  // Add tab index for accessibility
  li.tabIndex = 0;
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  //date.innerHTML = review.date;
  var d = new Date(review.updatedAt); 
  //console.log( d.toLocaleString() );
  date.innerHTML = d.toLocaleString();
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant[0].name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * Add Review to the API Server.
 */
function addReview(id, name, rating, comments) {

  let reviewSend = {
  	"name": name,
    "rating": parseInt(rating),
    "comments": comments,
    "restaurant_id": parseInt(id) //parseInt(review.restaurant_id)
	};
  console.log('Sending review: ', reviewSend);
  var fetch_options = {
  	method: 'POST',
    body: JSON.stringify(reviewSend),
    headers: new Headers({
   		'Content-Type': 'application/json'
    })
  };
 return fetch(`http://localhost:1337/reviews`, fetch_options).then((response) => {
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.indexOf('application/json') !== -1) {
  	return response.json();
  } 
  else { 
  	return 'API call successfull'
  }
	}).then((data) => { 
      //console.log(`addReview - Fetch successful!`);
      return data
  }).catch(function(err){
    console.log('error:', err);
  });

}

function generateRandomInteger(min, max) {
  return Math.floor(min + Math.random()*(max+1 - min))
}

//Form validation
var formValid;

/**
 * Validates and action the html form.
 */
function validateForm(e) {
  //Set initial value of formValid to true
  formValid = 1;
  //Get form values
  const id = parseInt(document.forms["myForm"]["id"].value);
  const name = document.forms["myForm"]["name"].value;
  const rating = parseInt(document.forms["myForm"]["rating"].value);
  const comments = document.forms["myForm"]["comments"].value;
  resetErrors();
  document.getElementById("reviewAddedMessage").innerHTML = "";

  //validate select menu
  var z = document.forms["myForm"]["rating"].value;
  if (z == 0) {
    applyError("rating","&nbsp;You must choose a rating.");
  }

  //validate input field
  var y = document.forms["myForm"]["name"].value;
  if (y == "") {
    document.getElementById("nameErrorHidden").innerHTML = "You must enter your name.";
    applyError("name","&nbsp;You must enter your name.");
  }

  //if a form field is not valid, do not submit form
  if (formValid == 0) {
    e.preventDefault();
    return false;
  }
  else {
    e.preventDefault();
    // get the current time
    var id1;
    var unix;
    unix = Date.now();
    let reviewSend = {
      "name": name,
      "rating": rating,
      "comments": comments,
      "updatedAt": unix
    };

    //If offline, insert review into idb with an id >= 1000
    if (!navigator.onLine) {
      e.preventDefault();
      db = new Dexie("reviews1-db");
      db.version(1).stores({
        ny: 'id,restaurant_id,[id+restaurant_id]'
      });

      // get random id >= 1000
      id1 = generateRandomInteger(1000, 1999);

      // insert into the idb store
      var table = db.table("ny");
      table.put({ id: id1, restaurant_id: id, name: name, createdAt: unix, updatedAt: unix, rating: rating, comments: comments });

      DBHelper.fetchReviews(id, (error, idbreviews) => {
        self.idbreviews = idbreviews;
        if (!idbreviews) {
          //console.log(error);
          return;
        }
        fillIDBReviewsHTML();
        callback(null, idbreviews)
      });
      
      document.getElementById("reviewAddedMessage").innerHTML = "Review Added!"; //puts error in span tag
      document.forms["myForm"].reset();
      //window.location = window.location.href.split("&")[0];
      //window.location.reload(true);
      return false;  
    }
    else 
    {
      // user is online, send review data to server and return the id
      var newReviewID = addReview(id, name, rating, comments);
      newReviewID.then((rev) => {
        // copy data into idb
        db = new Dexie("reviews1-db");
        db.version(1).stores({
        ny: 'id,restaurant_id,[id+restaurant_id]'
        });
      
        // insert into the idb store
        var table = db.table("ny");
        table.put({ id: rev.id, restaurant_id: id, name: name, createdAt: rev.createdAt, updatedAt: rev.updatedAt, rating: rating, comments: comments });

        DBHelper.fetchReviews(id, (error, idbreviews) => {
          self.idbreviews = idbreviews;
          if (!idbreviews) {
            //console.log(error);
            return;
          }
          // Update HTML Reviews from IDB
          fillIDBReviewsHTML();
          callback(null, idbreviews)
        });
      });

      document.getElementById("reviewAddedMessage").innerHTML = "Review Added!"; //puts error in span tag
      document.forms["myForm"].reset();
    } 
  }
}

//Appends error message to label, puts focus on field with error message
function applyError(errorFieldId,errorMessage){
  var errorMessageId = errorFieldId + "Error";
  document.getElementById(errorMessageId).innerHTML = errorMessage; //puts error in span tag
  document.getElementById(errorFieldId).focus(); //puts focus on field with error
  formValid = 0; //sets global formValid variable to false
}

//resets error messages so they are turned off
function resetErrors(){
  document.getElementById("nameError").innerHTML = "";
  document.getElementById("nameErrorHidden").innerHTML = "";
  document.getElementById("ratingError").innerHTML = "";
}