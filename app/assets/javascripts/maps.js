var map;
var spinner;
var mapContainerEl;
var infoContainerEl;
var labels = [];
var selectedTheater;

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

  var mapOptions = {
    center: new google.maps.LatLng(37.000, -120.000),
    zoom: 7
  };

  infoContainerEl = document.getElementById('theater-info-container');
  map = new google.maps.Map(document.getElementById("map-canvas"),
      mapOptions);

  mapContainerEl = document.getElementById('map-canvas');
  spinner = new Spinner(opts);

  map.data.loadGeoJson('/map.json');
  map.data.setStyle(function(feature) {
    var theaterName = feature.getProperty('name');
    return {
      visible: true,
      clickable: true,
      title: theaterName
    };
  });

  // Define the circle
  var circleL = new google.maps.Circle({
      map: map,
      clickable: false,
      // metres
      radius: 16093,
      strokeColor: '#313131',
      fillOpacity: 0,
      strokeOpacity: .8,
      strokeWeight: .8
  });

  // Define the circle
  var circleM = new google.maps.Circle({
      map: map,
      clickable: false,
      // metres
      radius: 8000,
      strokeColor: '#313131',
      fillOpacity: 0,
      strokeOpacity: .8,
      strokeWeight: .8
  });

    // Define the circle
  var circleS = new google.maps.Circle({
      map: map,
      clickable: false,
      // metres
      radius: 1000,
      strokeColor: '#313131',
      fillOpacity: 0,
      strokeOpacity: .8,
      strokeWeight: .8
  });

  // Set mouseover event for each feature.
  map.data.addListener('click', function(event) {
    if (selectedTheater != null) map.data.overrideStyle(selectedTheater, {icon: R_ICON});

    // RESET EVERYTHING
    selectedTheater = event.feature;
    for (var label in labels) {
      labels[label].setMap(null);
    }
    labels = [];

    // Start loader
    spinner.spin(mapContainerEl);

    var theaterId = selectedTheater.getProperty('rentrak_id');
    var latlng = selectedTheater.getGeometry().get();
    map.panTo(latlng);
    if (map.getZoom() < 11) {
      map.setZoom(11);
    }
    getTheaterInfo(theaterId, latlng);

    // UPDATE icon for selected theater!
    map.data.overrideStyle(selectedTheater, {icon: G_ICON});

    // Attach circle to marker
    circleL.bindTo('center', selectedTheater.getGeometry(), 'position');
    circleM.bindTo('center', selectedTheater.getGeometry(), 'position');
    circleS.bindTo('center', selectedTheater.getGeometry(), 'position');
    var bounds = circleL.getBounds();

    map.data.forEach(function(feature) {
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
           labelAnchor: new google.maps.Point(50, 0),
           labelClass: "distance-labels", // the CSS class for the label
           icon: {}
         });

        labels.push(marker);
      }
    });
  });
}

function getTheaterInfo(theaterId, latlng) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/map/theater_info/' + theaterId, true);
    xhr.onreadystatechange = function() {
      if (this.readyState != 4) {
          return;
      }
      if (this.status == 200) {
        spinner.stop();
        infoContainerEl.style.visibility = 'visible';
        infoContainerEl.innerHTML = this.responseText;

        // var mapHeight = window.innerHeight - infoContainerEl.clientHeight;
        // mapContainerEl.style.height = mapHeight + "px";
        // google.maps.event.trigger(map, 'resize');
        // map.panTo(latlng);

        return;
      } else {
        // Handle error
      }
    };
    xhr.send();
}

google.maps.event.addDomListener(window, 'load', initialize);