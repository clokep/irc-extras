/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * Add hacky /ignore, /unignore and /ignored commands to Instantbird.
 */

const {interfaces: Ci, utils: Cu} = Components;

Cu.import("resource:///modules/imXPCOMUtils.jsm");
Cu.import("resource:///modules/imServices.jsm");
Cu.import("resource:///modules/ircHandlers.jsm");
Cu.import("resource:///modules/NormalizedMap.jsm");

XPCOMUtils.defineLazyGetter(this, "_", function()
  l10nHelper("chrome://irc-stats/locale/irc.properties")
);

const kStatsDelay = 5 * 1000; // 5 seconds

function requestVersion(aAccount, aNick) {
  // Do not re-request a version for a known nick.
  if (aAccount.stats.has(aNick)) {
    // Jump to the next nick.
    requestVersion(aAccount, aAccount.statsQueue.shift());
    return;
  }

  // Create a note that this nick is waiting for a version.
  aAccount.stats.set(aNick, {pendingVersion: true});

  // Request version.
  aAccount.sendCTCPMessage(aNick, false, "VERSION");

  // Call this again after a timeout.
  aAccount.statsTimer = setTimeout(function() {
    // Nothing left to do.
    if (!aAccount.statsQueue.length) {
      aAccount.statsTimer = null;
      return;
    }

    // Request the next nick.
    requestVersion(aAccount, aAccount.statsQueue.shift());
  }, kStatsDelay);
}

/*
 * Only request new versions once every few seconds.
 */
function queueVersion(aAccount, aNick) {
  // Do not re-queue someone.
  if (aAccount.stats.has(aNick))
    return;

  // If there's nothing pending, immediately request it.
  if (!aAccount.statsTimer) {
    requestVersion(aAccount, aNick);
    return;
  }

  // Otherwise throw it on the queue.
  aAccount.statsQueue.push(aNick);
}

var ircStats = {
  // Parameters
  name: "IRC Stats", // Name identifier
  priority: ircHandlers.HIGH_PRIORITY,
  isEnabled: function() this.stats,

  commands: {
    "JOIN": function(aMessage) {
      // Add this nick to the list of nicks.
      queueVersion(this, aMessage.nickname);

      // Ensure the normal handler runs.
      return false;
    },
    "353": function(aMessage) {
      // Queue each nick for a version request.
      aMessage.params[3].trim().split(" ").forEach(aNick =>
        queueVersion(this, aNick));

      // Ensure the normal handler runs.
      return false;
    },
    "NICK": function(aMessage) {
      // Queue the new nick, leave the old one which is kind of dirty.
      queueVersion(this, aMessage.params[0]);
    }
  }
};

// Save the version response (or undefined if an error occurred) into the Map.
function versionResponse(aAccount, aMessage, aError = false) {
  // If the nick is not in the map, fall through to the normal handler.
  if (!aAccount.stats.has(aMessage.nickname))
    return false;

  let stats = aAccount.stats.get(aMessage.nickname);

  // If there is not a pending version, fall through.
  if (!stats.pendingVersion)
    return false;

  // Save the version response and the time.
  delete stats.pendingVersion;
  if (aError)
    stats.version = undefined;
  else
    stats.version = aMessage.ctcp.param;

  return true;
}
var ctcpStats = {
  // Parameters
  name: "CTCP Stats", // Name identifier
  priority: ircHandlers.HIGH_PRIORITY,
  isEnabled: function() this.stats,

  commands: {
    "VERSION": function (aMessage) versionResponse(this, aMessage),
    "ERRMSG": function (aMessage) versionResponse(this, aMessage, true)
  }
};

// Get the JavaScript account object.
function getAccount(aConv) aConv.wrappedJSObject._account;
var commands = [{
  name: "statsstart",
  get helpString() _("command.stats.start", "statsstart"),
  usageContext: Ci.imICommand.CMD_CONTEXT_ALL,
  priority: Ci.imICommand.CMD_PRIORITY_DEFAULT,
  run: function(aMsg, aConv) {
    let account = getAccount(aConv);

    if (account.stats)
      return false;

    // Start keeping stats on this server.
    account.stats = new NormalizedMap(account.normalizeNick.bind(account));
    account.statsQueue = [];
    account.statsTimer = null;

    return true;
  }
},
{
  name: "statsstop",
  get helpString() _("command.stats.stop", "statsstop"),
  usageContext: Ci.imICommand.CMD_CONTEXT_ALL,
  priority: Ci.imICommand.CMD_PRIORITY_DEFAULT,
  run: function(aMsg, aConv) {
    let account = getAccount(aConv);

    if (!account.stats)
      return false;

    // Stop keeping stats on this server.
    delete account.stats;
    delete account.statsQueue;
    delete account.statsTimer;

    return true;
  }
},
{
  name: "stats",
  get helpString() _("command.stats", "stats"),
  usageContext: Ci.imICommand.CMD_CONTEXT_ALL,
  priority: Ci.imICommand.CMD_PRIORITY_DEFAULT,
  run: function(aMsg, aConv) {
    let account = getAccount(aConv);

    if (!account.stats)
      return false;

    // TODO Display stats in a tab.
    let str = ""
    for (let [nick, result] of account.stats.entries())
      str += nick + ": " + result.version + "\n";
    Components.utils.reportError(str);

    return true;
  }
}];

function registerCommands() {
  ircHandlers.registerHandler(ircStats);
  ircHandlers.registerCTCPHandler(ctcpStats);
  commands.forEach(cmd => Services.cmd.registerCommand(cmd));
}

function initializer() {
  registerCommands();
  Services.obs.removeObserver(initializer, "prpl-init")
}

function startup(aData, aReason) {
  if (Services.core.initialized)
    registerCommands()
  else
    Services.obs.addObserver(initializer, "prpl-init", false);
}
function shutdown(aData, aReason) {
  ircHandlers.unregisterHandler(ircStats);
  ircHandlers.unregisterCTCPHandler(ctcpStats);
  commands.forEach(cmd => Services.cmd.unregisterCommand(cmd));
}

function install(aData, aReason) {}
function uninstall(aData, aReason) {}
