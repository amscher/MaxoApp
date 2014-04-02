var map;
var spinner;
var mapContainerEl;
var infoContainerEl;
var labels = [];
var selectedTheater;
var circleL;
var circleM;
var circleS;


G_ICON = "http://mt.google.com/vt/icon?psize=30&font=fonts/arialuni_t.ttf&color=ff304C13&name=icons/spotlight/spotlight-waypoint-a.png&ax=43&ay=48&text=%E2%80%A2";
R_ICON = "https://mts.googleapis.com/vt/icon/name=icons/spotlight/spotlight-poi.png&scale=1";

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
}


function theaterSelectionHandler(event) {
  if (selectedTheater != null) map.data.overrideStyle(selectedTheater, {icon: R_ICON});

  // RESET EVERYTHING
  selectedTheater = event.feature;
  map.data.overrideStyle(selectedTheater, {icon: G_ICON});
  var theaterId = selectedTheater.getProperty('rentrak_id');
  var latlng = selectedTheater.getGeometry().get();
  var theaterName = selectedTheater.getProperty('name');
  // Delete old labels
  for (var label in labels) {
    labels[label].setMap(null);
  }
  labels = [];


  map.panTo(latlng);
  if (map.getZoom() < 11) {
    map.setZoom(11);
  }
  // Retrieve box office information
  getTheaterInfo(theaterId, latlng, theaterName);

  // Start loader
  spinner.spin(mapContainerEl);

  // Attach circle to marker
  circleL.bindTo('center', selectedTheater.getGeometry(), 'position');
  circleM.bindTo('center', selectedTheater.getGeometry(), 'position');
  circleS.bindTo('center', selectedTheater.getGeometry(), 'position');
  var bounds = circleL.getBounds();

  // Find all theaters nearby
  map.data.forEach(function(feature){
    labelDistancesNearby(feature, latlng, bounds);
  });
}

function labelDistancesNearby(feature, latlng, bounds) {
  nearLatLng = feature.getGeometry().get();
  if (nearLatLng != latlng && bounds.contains(nearLatLng)) {
    // Get distance, display label
    var distance =
        google.maps.geometry.spherical.computeDistanceBetween(nearLatLng, latlng);
    distance = (distance * 0.000621371).toFixed(2);

    var marker = new MarkerWithLabel({
       position: nearLatLng,
       map: map,
       labelContent: feature.getProperty("name") + " (" + distance + "mi)",
       labelAnchor: new google.maps.Point(45, 0),
       labelClass: "distance-labels", // the CSS class for the label
       icon: {}
     });

    labels.push(marker);
  }
}

function getTheaterInfo(theaterId, latlng, theaterName) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/map/theater_info/' + theaterId, true);
    xhr.onreadystatechange = function() {
      if (this.readyState != 4) {
          return;
      }
      if (this.status == 200) {
        spinner.stop();
        mapContainerEl.style.height = "75%";
        infoContainerEl.style.height = "25%";
        google.maps.event.trigger(map, 'resize');
        infoContainerEl.style.visibility = 'visible';
        infoContainerEl.innerHTML = "<h3>" + theaterName + "</h3> <div class=\"theater-data-table\">" + this.responseText + "</div>";
        return;
      } else {
        // Handle error
      }
    };
    xhr.send();
}

google.maps.event.addDomListener(window, 'load', initialize);

