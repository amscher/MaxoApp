function Census() {
  this.key = "a7d38ab4777793266ccb65ef0bfe9375e7d208c3";
  this.url ="http://api.census.gov/data/2011/acs5?key=" + this.key + "&get=";
  this.dataCodes = {
    "totalPop": "P0010001",
    "totalHouseHolds": "P0180001",
    "medianAge": "P0130001",
    "malePop": "P0120002",
    "femalePop": "P0120026",
    "whitePop": "P0030002",
    "hispanicPop": "P0050010",
    "blackPop": "P0030003",
    "amerIndPop": "P0030004",
    "asianPop": "P0030005",
    "hawaiiPop": "P0030006"
  };

  this.dataCodes = [
    "B01001_001E",
    "B08201_001E",
    "B01002_001E",
    "B01001_002E",
    "B03002_012E",
    "B01001_026E",
    "B02001_002E",
    "B02001_003E",
    "B02001_004E",
    "B02001_005E",
    "B02001_006E"];

  for (var i in this.dataCodes) {
    this.url += this.dataCodes[i];
    if (i < this.dataCodes.length - 1) this.url += ",";
  }

}

Census.prototype.getDemographics = function(handler) {
  var script = document.createElement('script');
  script.src = this.url + "&jsonp="+ handler;
  document.getElementsByTagName('head')[0].appendChild(script);


  // var xhr = new XMLHttpRequest();
  // xhr.open('GET', this.url + "&jsonp=handler", true);
  // xhr.onreadystatechange = function() {
  //   if (this.readyState != 4) {
  //       return;
  //   }
  //   if (this.status == 200) {
  //     var results = JSON.parse(this.responseText);
  //     handler(results);
  //     return;
  //   } else {
  //     // Handle error
  //   }
  // };
  // xhr.send();
}

Census.prototype.getData = function(lat, lng, radiusMiles, handler) {
  var fipsUrl = "http://data.fcc.gov/api/block/find?latitude=" + lat + "&longitude=" + lng + "&format=json&showall=true"
  // Get tract info for latlng
  var self = this;
  var xhr = new XMLHttpRequest();
  xhr.open('GET', '/map/population_info?latitude=' + lat + '&longitude=' + lng, true);
  xhr.onreadystatechange = function() {
    if (this.readyState != 4) {
        return;
    }
    if (this.status == 200) {
      var results = JSON.parse(this.responseText);
      var FIPS = results["Block"]["FIPS"];
      var state = FIPS.slice(0, 2);
      var county = FIPS.slice(2, 5);
      var tract = FIPS.slice(5, 11);
      self.url += "&for=tract:" + tract + "&in=state:" + state + "+county:" + county;
      self.getDemographics(handler);
      return;
    } else {
      // Handle error
    }
  };
  xhr.send();
};