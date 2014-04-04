function toggleSelected(feature) {
  var isSelected = feature.getProperty("selected");
  feature.setProperty("selected", !isSelected);
}

function selectionHandler(property) {
  if (property.name == "selected") {
    var isSelected = property.newValue;
    if (isSelected) {


    } else {



    }
  }
}