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

XPCOMUtils.defineLazyGetter(this, "_", function()
  l10nHelper("chrome://irc-ignore/locale/irc.properties")
);

function privmsg(aMessage) {
  // Store an array on the account.
  if (!this.ignoredNicks)
    return false;


  // Check if this nick is in the list of ignored nicks and block further
  // processing.
  let nick = this.normalize(aMessage.nickname);
  return this.ignoredNicks.has(nick);
}

var ircIgnore = {
  // Parameters
  name: "IRC Ignore", // Name identifier
  priority: ircHandlers.HIGH_PRIORITY,
  isEnabled: function() true,

  commands: {
    "PRIVMSG": privmsg,
    "NOTICE": privmsg
  }
};

function getNicks(aMsg) aMsg.split(/\s/).map(n => n.trim()).filter(n => !!n);

var commands = [{
  name: "ignore",
  get helpString() _("command.ignore", "ignore"),
  usageContext: Ci.imICommand.CMD_CONTEXT_ALL,
  priority: Ci.imICommand.CMD_PRIORITY_DEFAULT,
  run: function(aMsg, aConv) {
    // Support multiple nicks, split by space, filter on empty nicks.
    let nicks = getNicks(aMsg);
    // No nicks (e.g. only spaces or no message given).
    if (!nicks.length)
      return false;

    // Get the JavaScript conversation and account object.
    let conv = aConv.wrappedJSObject;
    let account = conv._account;

    // If this is the first ignored nick, create a new set for it.
    if (!account.ignoredNicks)
      account.ignoredNicks = new Set();

    // Add each normalized nick.
    nicks.forEach(n => account.ignoredNicks.add(account.normalize(n)));

    conv.writeMessage(account._currentServerName,
                      _("message.ignore", nicks.join(", ")),
                      {system: true});

    return true;
  }
},
{
  name: "unignore",
  get helpString() _("command.unignore", "unignore"),
  usageContext: Ci.imICommand.CMD_CONTEXT_ALL,
  priority: Ci.imICommand.CMD_PRIORITY_DEFAULT,
  run: function(aMsg, aConv) {
    // Support multiple nicks, split by space, filter on empty nicks.
    let nicks = getNicks(aMsg);
    // No nicks (e.g. only spaces or no message given).
    if (!nicks.length)
      return false;

    // Get the JavaScript conversation and account object.
    let conv = aConv.wrappedJSObject;
    let account = conv._account;

    // If this is the first ignored nick, create a new set for it.
    if (!account.ignoredNicks)
      account.ignoredNicks = new Set();

    // Add each normalized nick.
    nicks.forEach(n => account.ignoredNicks.delete(account.normalize(n)));

    conv.writeMessage(account._currentServerName,
                      _("message.unignore", nicks.join(", ")),
                      {system: true, noLog: true});

    return true;
  }
},
{
  name: "ignored",
  get helpString() _("command.ignored", "ignored"),
  usageContext: Ci.imICommand.CMD_CONTEXT_ALL,
  priority: Ci.imICommand.CMD_PRIORITY_DEFAULT,
  run: function(aMsg, aConv) {
    if (aMsg)
      return false;

    // Get the JavaScript conversation and account object.
    let conv = aConv.wrappedJSObject;
    let account = conv._account;

    // If this is the first ignored nick, create a new set for it.
    if (!account.ignoredNicks)
      account.ignoredNicks = new Set();

    // The ignore list is empty.
    if (!account.ignoredNicks.size) {
      conv.writeMessage(account._currentServerName, _("message.noIgnored"),
                        {system: true, noLog: true});
      return true;
    }

    // Add each normalized nick.
    let nicks = [n for (n of account.ignoredNicks)];
    conv.writeMessage(account._currentServerName,
                      _("message.ignored", nicks.join(", ")),
                      {system: true, noLog: true});

    return true;
  }
}];

function registerCommands() {
  ircHandlers.registerHandler(ircIgnore);
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
  ircHandlers.unregisterHandler(ircIgnore);
  commands.forEach(cmd => Services.cmd.unregisterCommand(cmd));
}

function install(aData, aReason) {}
function uninstall(aData, aReason) {}
