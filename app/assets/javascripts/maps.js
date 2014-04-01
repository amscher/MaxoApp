var map;

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

  var infoContainerEl = document.getElementById('theater-info-container');
  map = new google.maps.Map(document.getElementById("map-canvas"),
      mapOptions);

  var mapContainerEl = document.getElementById('map-canvas');
  var spinner = new Spinner(opts);

  map.data.loadGeoJson('/map.json');
  map.data.setStyle(function(feature) {
    var theaterName = feature.getProperty('name');
    console.log(theaterName);
    return {
      visible: true,
      clickable: true,
      title: theaterName
    };
  });

  // Set mouseover event for each feature.
  map.data.addListener('click', function(event) {
    spinner.spin(mapContainerEl);
    var theaterId = event.feature.getProperty('rentrak_id');
    var latlng = event.feature.getGeometry().get();
    map.panTo(latlng);
    map.setZoom(11);

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

        var mapHeight = window.innerHeight - infoContainerEl.clientHeight;
        mapContainerEl.style.height = mapHeight + "px";
        google.maps.event.trigger(map, 'resize');
        map.panTo(latlng);

        return;
      } else {
        // Handle error
      }
    };
    xhr.send();
  });
}

google.maps.event.addDomListener(window, 'load', initialize);