var restaurant,map;window.initMap=function(){fetchRestaurantFromURL(function(a,b){a?console.error(a):(self.map=new google.maps.Map(document.getElementById("map"),{zoom:16,center:b[0].latlng,scrollwheel:!1}),fillBreadcrumb(),DBHelper.mapMarkerForRestaurant(self.restaurant,self.map))})};
fetchRestaurantFromURL=function(a){if(self.restaurant)a(null,self.restaurant);else{var b=getParameterByName("id");b?DBHelper.fetchRestaurantById(b,function(c,b){(self.restaurant=b)?(fillRestaurantHTML(),a(null,b)):console.error(c)}):(error="No restaurant id in URL",a(error,null))}};
fillRestaurantHTML=function(a){a=void 0===a?self.restaurant:a;document.getElementById("restaurant-name").innerHTML=a[0].name;document.getElementById("restaurant-address").innerHTML=a[0].address;var b=document.getElementById("restaurant-img");b.className="restaurant-img";b.src=DBHelper.imageUrlForRestaurant(a[0]);b.alt="Image of restaurant "+a[0].name;document.getElementById("restaurant-cuisine").innerHTML=a[0].cuisine_type;a[0].operating_hours&&fillRestaurantHoursHTML();fillReviewsHTML()};
fillRestaurantHoursHTML=function(a){a=void 0===a?self.restaurant[0].operating_hours:a;var b=document.getElementById("restaurant-hours"),c;for(c in a){var d=document.createElement("tr"),e=document.createElement("td");e.innerHTML=c;d.appendChild(e);e=document.createElement("td");e.innerHTML=a[c];d.appendChild(e);b.appendChild(d)}};
fillReviewsHTML=function(a){a=void 0===a?self.restaurant[0].reviews:a;var b=document.getElementById("reviews-container"),c=document.createElement("h2");c.innerHTML="Reviews";c.tabIndex=0;b.appendChild(c);if(a){var d=document.getElementById("reviews-list");a.forEach(function(a){d.appendChild(createReviewHTML(a))});b.appendChild(d)}else a=document.createElement("p"),a.innerHTML="No reviews yet!",b.appendChild(a)};
createReviewHTML=function(a){var b=document.createElement("li");b.tabIndex=0;var c=document.createElement("p");c.innerHTML=a.name;b.appendChild(c);c=document.createElement("p");c.innerHTML=a.date;b.appendChild(c);c=document.createElement("p");c.innerHTML="Rating: "+a.rating;b.appendChild(c);c=document.createElement("p");c.innerHTML=a.comments;b.appendChild(c);return b};
fillBreadcrumb=function(a){a=void 0===a?self.restaurant:a;var b=document.getElementById("breadcrumb"),c=document.createElement("li");c.innerHTML=a[0].name;b.appendChild(c)};getParameterByName=function(a,b){b||(b=window.location.href);a=a.replace(/[\[\]]/g,"\\$&");var c=(new RegExp("[?&]"+a+"(=([^&#]*)|&|#|$)")).exec(b);return c?c[2]?decodeURIComponent(c[2].replace(/\+/g," ")):"":null};