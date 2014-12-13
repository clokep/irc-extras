/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

function updateStats(aStats) {
  // Generate some statistics.
  var clients = new Map();
  var products = new Map();
  // The total number of clients.
  var total = 0;
  // The number of clients which a request has been sent and no response has
  // been received.
  var pendingResponses = 0;

  for (var result of aStats) {
    // Still waiting for a response...
    if (result.pendingVersion) {
      ++pendingResponses;
      continue;
    }

    var version = result.version;
    // Try to get a 'family' for the version, e.g. the product without the
    // version.
    var family = version;
    if (family)
      family = family.split(" ")[0];

    // If this client/family has been seen before, initialize.
    if (!clients.has(version))
      clients.set(version, 0);
    if (!products.has(family))
      products.set(family, 0);

    // Tally the version and total.
    clients.set(version, clients.get(version) + 1);
    products.set(family, products.get(family) + 1);
    ++total;
  }

  // Now display the stats.
  displayStats(total, pendingResponses, clients, products);
}

function displayStats(aTotal, aPendingResponses, aClients, aProducts) {
  // Update some numbers.
  document.getElementById("total").innerHTML = aTotal;
  document.getElementById("pending").innerHTML = aPendingResponses;

  // Update the plots.
  createPlot("client-count", "Clients", aClients);
  createPlot("family-count", "Families", aProducts);
}

function createPlot(aId, aTitle, aData) {
  // Put the data in order from biggest to smallest.
  var data = [d for (d of aData.entries())];
  data.sort(function(a, b) a[1] < b[1]);
  var labels = data.map(function(a) a[0]);
  var values = data.map(function(a) a[1]);

  var plot = new AwesomeChart(aId);
  plot.title = aTitle;
  plot.data = values;
  plot.labels = labels;
  plot.draw();
}

function logMessage(aMsg) {
  var logs = document.getElementById("logs");
  var log = document.createElement("span");
  log.innerHTML = aMsg;
  logs.appendChild(log);
}

/*
for (let [version, count] of clients.entries()) {
  let percentage = Math.round((count / total) * 100) / 100;
  str += "'" + version + "': " + percentage + "% (" + count + ")\n";
}
*/
