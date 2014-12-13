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

  for (var result of aStats.values()) {
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

  // Re-arrange the data to be plotted into two arrays: one is a set of points
  // of x-index to value, the other is x-index to label.
  var labels = [];
  for (var i = 0; i < data.length; i++) {
    // Sometimes the labels are stupid long.
    labels[i] = [i, data[i][0].slice(0, 25)];
    data[i] = [i, data[i][1]];
  }

  var options = {
    title: aTitle,
    HtmlText: false,
    bars: {
      show: true,
      shadowSize: 0,
      barWidth: 0.5
    },
    mouse: {
      track: true,
      relative: true
    },
    xaxis: {
      ticks: labels,
      labelsAngle: 90
    },
    yaxis: {
      min: 0,
      autoscaleMargin: 1,
      title: "Count",
      titleAngle: 90
    }
  };

  var plot = document.getElementById(aId);
  Flotr.draw(plot, [data], options);
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

// DEBUG
if (false) {
  document.addEventListener("DOMContentLoaded", function() {
    var clients = new Map();
    clients.set("Instantbird 1.6pre", 3);
    clients.set("Instantbird 1.5", 1);
    clients.set("Thunderbird", 2);
    clients.set(undefined, 1);

    var families = new Map();
    families.set("Instantbird", 4);
    families.set("Thunderbird", 2);
    families.set(undefined, 1);

    displayStats(10, 3, clients, families)

    logMessage("Test 1");
    logMessage("Test 2");
    logMessage("Test 3 longer test");
  });
}
if (false) {
  document.addEventListener("DOMContentLoaded", function() {
    var data = new Map();
    updateStats(data);
  });
}
