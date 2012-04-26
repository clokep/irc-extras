/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * Some commands from RFCs 2811 & 2812 (which obsoletes RFC 1459) for which are
 * unhandled in Instantbird.
 */

Components.utils.import("resource:///modules/imXPCOMUtils.jsm");
Components.utils.import("resource:///modules/ircHandlers.jsm");

XPCOMUtils.defineLazyGetter(this, "_", function()
  l10nHelper("chrome://irc-extras/locale/irc.properties")
);


var ircExtras = {
  // Parameters
  name: "IRC Extras", // Name identifier
  priority: ircHandlers.DEFAULT_PRIORITY + 5,

  commands: {
    "333": function(aMessage) { // nonstandard
      // <channel> <nickname> <time>
      let conversation = this.getConversation(aMessage.params[1]);
      conversation.setTopic(null, aMessage.params[2]);
      // Need to convert the time from seconds to milliseconds for JavaScript.
      let msg = _("message.topicSetter", conversation.name, aMessage.params[2],
                  new Date(parseInt(aMessage.params[3]) * 1000));
      conversation.writeMessage(null, msg, {system: true});
      return true;
    }
  }
};

function startup(aData, aReason) {
  ircHandlers.registerHandler(ircExtras);
}
function shutdown(aData, aReason) {
  ircHandlers.unregisterHandler(ircExtras);
}

function install(aData, aReason) {}
function uninstall(aData, aReason) {}
