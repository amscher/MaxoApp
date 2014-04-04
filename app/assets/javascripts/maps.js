var SELECTED_ZOOM_LEVEL = 13;

var map;
var spinner;
var mapContainerEl;
var infoContainerEl;
var labels = [];
var compareTheaters = [];
var selectedTheater;
var circleL;
var circleM;
var circleS;


G_ICON = "http://mt.google.com/vt/icon?psize=30&font=fonts/arialuni_t.ttf&color=ff304C13&name=icons/spotlight/spotlight-waypoint-a.png&ax=43&ay=48&text=%E2%80%A2";
R_ICON = "https://mts.googleapis.com/vt/icon/name=icons/spotlight/spotlight-poi.png&scale=1";
B_ICON = "https://mt.google.com/vt/icon?psize=20&font=fonts/Roboto-Regular.ttf&color=ff330000&name=icons/spotlight/spotlight-waypoint-blue.png&ax=44&ay=48&scale=1&text=%E2%80%A2";


function initialize() {
  var opts = {
    lines: 13, // The number of lines to draw
    length: 10, // The length of each line
    width: 5, // The line thickness
    radius: 15, // The radius of the inner circle
    corners: 1, // Corner roundness (0..1)
    rotate: 0, // The rotation offset
    direction: 1, // 1: clockwise, -1: counterclockwise
    color: '#8b8989', // #rgb or #rrggbb or array of colors
    speed: 1, // Rounds per second
    trail: 60, // Afterglow percentage
    shadow: false, // Whether to render a shadow
    hwaccel: false, // Whether to use hardware acceleration
    className: 'spinner', // The CSS class to assign to the spinner
    zIndex: 2e9, // The z-index (defaults to 2000000000)
    top: '50%', // Top position relative to parent in px
    left: '50%' // Left position relative to parent in px
  };
  spinner = new Spinner(opts);

  var mapOptions = {
    center: new google.maps.LatLng(37.000, -120.000),
    zoom: 7
  };

  infoContainerEl = document.getElementById('theater-info-container');
  mapContainerEl = document.getElementById('map-canvas');
  map = new google.maps.Map(mapContainerEl, mapOptions);

  var createCircle = function(radius) {
    return new google.maps.Circle({
      map: map,
      clickable: false,
      radius: radius, // metres
      strokeColor: '#313131',
      fillOpacity: 0,
      strokeOpacity: .8,
      strokeWeight: .8
    });
  };

  // Define distance cirlcs from selected theater.
  circleL = createCircle(16093.4);
  circleM = createCircle(8046.72);
  circleS = createCircle(1609.34);

  map.data.loadGeoJson('/map.json');
  map.data.setStyle(function(feature) {
    var theaterName = feature.getProperty('name');
    return {
      visible: true,
      clickable: true,
      title: theaterName
    };
  });

  // Set mouseover event for each feature.
  map.data.addListener('click', theaterSelectionHandler);
  map.data.addListener('mouseover', theaterHoverHandler);
}

function theaterHoverHandler(event) {

}

function resetSelectedTheater() {
  map.data.overrideStyle(selectedTheater, {icon: R_ICON});
  // Delete old labels
  for (var label in labels) {
    labels[label].setMap(null);
  }
  labels = [];
  selectedTheater = null;
  circleL.setMap(null);
  circleS.setMap(null);
  circleM.setMap(null);
  for (var t in compareTheaters) {
    map.data.overrideStyle(compareTheaters[t], {icon: R_ICON});
  }
  compareTheaters = [];
}

/**
 *
 */
function theaterSelectionHandler(event) {
  // Start loader
  spinner.spin(mapContainerEl);
  if (selectedTheater != null) {
    compareTheaters.push(event.feature);
    map.data.overrideStyle(event.feature, {icon: B_ICON});
    displayTheaterInfo(event.feature, true /* A comparison theater */);
    return;
  }
  // Update map to center on selected theater
  selectedTheater = event.feature;
  map.data.overrideStyle(selectedTheater, {icon: G_ICON});
  var latlng = selectedTheater.getGeometry().get();
  map.panTo(latlng);

  if (map.getZoom() < SELECTED_ZOOM_LEVEL) {
    map.setZoom(SELECTED_ZOOM_LEVEL);
  }

  // Attach circle to marker
  circleL.setCenter(latlng)
  circleL.setMap(map);
  circleM.setCenter(latlng)
  circleM.setMap(map);
  circleS.setCenter(latlng)
  circleS.setMap(map);
  // circleL.bindTo('center', selectedTheater.getGeometry(), 'position');
  // circleM.bindTo('center', selectedTheater.getGeometry(), 'position');
  // circleS.bindTo('center', selectedTheater.getGeometry(), 'position');
  var bounds = circleL.getBounds();

  map.data.forEach(function(feature){
    labelNearbyTheater(feature, latlng, bounds);
  });

  // Retrieve and display box office information
  displayTheaterInfo(selectedTheater, false /* select as central theater */);
}

function labelNearbyTheater(feature, latlng, bounds) {
  nearLatLng = feature.getGeometry().get();
  if (nearLatLng != latlng && bounds.contains(nearLatLng)) {
    // Get distance from selected theater, and display label.
    var distance =
        google.maps.geometry.spherical.computeDistanceBetween(nearLatLng, latlng);
    distance = (distance * 0.000621371).toFixed(2);

    // Create marker to hold distance info
    var marker = new MarkerWithLabel({
       position: nearLatLng,
       map: map,
       labelContent: feature.getProperty("name") + " (" + distance + "mi)",
       labelAnchor: new google.maps.Point(0, 0),
       labelClass: "distance-labels", // the CSS class for the label
       icon: {}
     });
    labels.push(marker);
  }
}

/**
 * Retrieves info for given theater from rentrak database.
 */
function displayTheaterInfo(selectedTheater, compare) {
  var results = selectedTheater.getProperty("currentWeek");
  if (results != null) {
    addDataToMap(selectedTheater, results, compare);
    return;
  }
  var theaterId = selectedTheater.getProperty('rentrak_id');
  var xhr = new XMLHttpRequest();
  xhr.open('GET', '/map/theater_info/' + theaterId, true);
  xhr.onreadystatechange = function() {
    if (this.readyState != 4) {
        return;
    }
    if (this.status == 200) {
      var results = JSON.parse(this.responseText);
      selectedTheater.setProperty("currentWeek", results);
      addDataToMap(selectedTheater, results, compare);
      return;
    } else {
      // Handle error
    }
  };
  xhr.send();
}

var REMOVE_BUTTON = "remove-compare-button-container"

function addDataToMap(theater, results, isCompare) {
  if (isCompare && $(infoContainerEl).children().length > 4) {
    // TODO:: trigger click on last 2nd remove button
    return;
  }

  var theaterId = theater.getProperty('rentrak_id');
  var theaterName = theater.getProperty('name');
  var latlng = theater.getGeometry().get();

  var titleEl = $("<h3>").text(theaterName);
  var tableEl = createTable(results);

  // Create Remove Button.
  var removeEl = $("<div>").addClass(REMOVE_BUTTON).text("remove");
  var containerEl = $("<div>").
      addClass("theater-info-content").
      append(titleEl).
      append(tableEl).
      append(removeEl);

  // Add event handler.
  removeEl.on('click', function(event) {
    // Unselect theater
    map.data.overrideStyle(theater, {icon: R_ICON});
    if (!isCompare) resetSelectedTheater();
    // Remove container from infoContainer
    if (isCompare) {
      containerEl.remove();
    } else {
      $(infoContainerEl).empty();
    }
  });

  if (!isCompare) {
    mapContainerEl.style.width = "65%";
    infoContainerEl.style.width = "34.5%";
    infoContainerEl.style.visibility = 'visible';
    google.maps.event.trigger(map, 'resize');
    map.panTo(latlng);
  }

  if (isCompare) $(infoContainerEl).append(containerEl);
  else $(infoContainerEl).html(containerEl);
  spinner.stop();
}


google.maps.event.addDomListener(window, 'load', initialize);

