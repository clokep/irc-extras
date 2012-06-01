/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * This is an example of sending messages after an IRC account is connected.
 */

Components.utils.import("resource:///modules/imXPCOMUtils.jsm");
Components.utils.import("resource:///modules/ircHandlers.jsm");

var ircExample = {
  name: "IRC Example",
  // Slightly above the default priority so we run before the main IRC handler.
  priority: ircHandlers.DEFAULT_PRIORITY + 10,
  // Ensure this is only run for a particular account, alternately you could
  // return true and choose what to do in the handler below.
  isEnabled: function() this.name == "<your nick>@irc.mozilla.org",

  commands: {
    "001": function(aMessage) {
      // At the 001 response we've successfully connected to the server.

      // Send an IDENTIFY command to NickServ
      this.sendMessage("PRIVMSG", ["NickServ", "IDENTIFY <password>"]);

      // Return false so the default handler still runs.
      return false;
    }
  }
}

function startup(aData, aReason) {
  ircHandlers.registerHandler(ircExample);
}
function shutdown(aData, aReason) {
  ircHandlers.unregisterHandler(ircExample);
}

// Shut up warnings.
function install(aData, aReason) {}
function uninstall(aData, aReason) {}
