function createTable(data) {
  headers = data["headers"];
  movies = data["movies"];

  tableEl = $("<table>").
      attr({cellSpacing: 0});

  theadEl = $("<tr>");
  for (var h in headers) {
    var header = headers[h];
    if (h == 0) continue; // Don't include rank.
    if (h == 1) header = "Movie"
    if (header.match("%.+")) {
      var last = theadEl.children().last();
      // TODO:: add class for negative/positive growth
      last.append($("<span>").html("(%)"))
    } else {
      theadEl.append($("<td>").html(header));
    }
  }
  tableEl.append($("<thead>").append(theadEl));

  for (var m in movies) {
    movie = movies[m];
    trowEl = $("<tr>");
    for (var h in headers) {
      if (h == 0) continue; // Don't include rank.
      var addToLast = headers[h].match("%.+") ? true : false;

      data = movie[headers[h]];
      addEl = addToLast ? $("<span>").html(" (" + data + ")") : $("<td>").html(data); // Create element to add.
      parentEl = addToLast ? trowEl.children().last() : trowEl; // Get parent element.
      parentEl.append(addEl);
    }
    trowEl.appendTo(tableEl);
  }

  return $("<div>").addClass("theater-data-table").append(tableEl);
}