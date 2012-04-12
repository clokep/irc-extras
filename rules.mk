# ***** BEGIN LICENSE BLOCK *****
# Version: MPL 1.1/GPL 2.0/LGPL 2.1
#
# The contents of this file are subject to the Mozilla Public License Version
# 1.1 (the "License"); you may not use this file except in compliance with
# the License. You may obtain a copy of the License at
# http://www.mozilla.org/MPL/
#
# Software distributed under the License is distributed on an "AS IS" basis,
# WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
# for the specific language governing rights and limitations under the
# License.
#
# The Original Code is the Instantbird addons build system.
#
# The Initial Developer of the Original Code is
#   Florian QUEZE <florian@instantbird.org>
# Portions created by the Initial Developer are Copyright (C) 2010
# the Initial Developer. All Rights Reserved.
#
# Contributor(s):
#
# Alternatively, the contents of this file may be used under the terms of
# either the GNU General Public License Version 2 or later (the "GPL"), or
# the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
# in which case the provisions of the GPL or the LGPL are applicable instead
# of those above. If you wish to allow use of your version of this file only
# under the terms of either the GPL or the LGPL, and not to allow others to
# use your version of this file under the terms of the MPL, indicate your
# decision by deleting the provisions above and replace them with the notice
# and other provisions required by the GPL or the LGPL. If you do not delete
# the provisions above, a recipient may use your version of this file under
# the terms of any one of the MPL, the GPL or the LGPL.
#
# ***** END LICENSE BLOCK *****

GLOBAL_DEPS = Makefile ../rules.mk
LOCALES := $(foreach locale,$(wildcard ./locales/*),$(shell basename $(locale)))
ifndef DEBUG
BASE_PKG := jar:chrome/$(PACKAGE).jar!
MANIFEST_FILE := chrome.manifest
else
BASE_PKG := $(shell pwd)
MANIFEST_FILE := $(PACKAGE).manifest
endif

blank :=

ifdef OPTION_URL
INCLUDE := $(blank)	<em:optionsURL>$(OPTION_URL)</em:optionsURL>
else
INCLUDE :=
endif

ifeq ($(wildcard bootstrap.js),bootstrap.js)
BOOTSTRAP := $(blank)	<em:bootstrap>true</em:bootstrap>
else
BOOTSTRAP :=
endif

default: xpi

manifest:
	rm -f $(MANIFEST_FILE)
ifneq ($(wildcard content),)
	echo content $(PACKAGE) $(BASE_PKG)/content/ xpcnativewrappers=yes >> $(MANIFEST_FILE)
endif
ifneq ($(wildcard skin),)
	echo skin $(PACKAGE) classic/1.0 $(BASE_PKG)/skin/ >> $(MANIFEST_FILE)
endif
ifdef MESSAGE_STYLE
	echo skin $(PACKAGE) classic/1.0 $(BASE_PKG)/ >> $(MANIFEST_FILE)
endif
ifneq ($(wildcard overlay.mn),)
	cat ./overlay.mn >> $(MANIFEST_FILE)
endif
	$(foreach locale,$(LOCALES),echo locale $(PACKAGE) $(locale) locales/$(locale)/ >> $(MANIFEST_FILE) ;)

ifdef MESSAGE_STYLE
JAR_CONTENT := $(wildcard ./Info.plist ./main.css \
                 $(foreach file,Footer Header Status NextStatus,./$(file).html) \
                 $(foreach dir,Incoming Outgoing, \
                   $(foreach file,Content Context NextContent NextContext,./$(dir)/$(file).html)) \
                 Variants/*.css $(EXTRA_FILES))
endif

jar:
	rm -f $(PACKAGE).jar
ifneq ($(JAR_CONTENT),)
	zip -0 $(PACKAGE).jar $(JAR_CONTENT)
endif

install.rdf: ../install.rdf.in $(GLOBAL_DEPS)
	sed "s/@PACKAGE_ID@/$(PACKAGE_ID)/; \
             s/@PACKAGE_NAME@/$(PACKAGE_NAME)/; \
             s/@PACKAGE_VERSION@/$(PACKAGE_VERSION)/; \
             s/@PACKAGE_DESCRIPTION@/$(PACKAGE_DESCRIPTION)/; \
             s/@PACKAGE_AUTHOR@/$(PACKAGE_AUTHOR)/; \
             s|@INCLUDE@|$(INCLUDE)|; \
             s|@BOOTSTRAP@|$(BOOTSTRAP)|; \
             s/@PACKAGE_MIN_VERSION@/$(PACKAGE_MIN_VERSION)/; \
             s/@PACKAGE_MAX_VERSION@/$(PACKAGE_MAX_VERSION)/" \
	  < ../install.rdf.in > install.rdf

xpi: jar manifest install.rdf
ifneq ($(wildcard $(PACKAGE).jar),)
	mkdir -p chrome
	mv $(PACKAGE).jar chrome/
endif
	zip $(PACKAGE)-$(PACKAGE_VERSION).xpi install.rdf $(wildcard bootstrap.js chrome.manifest chrome/$(PACKAGE).jar components/*.js defaults/preferences/*.js locales/*/*.properties)

clean:
	rm -rf chrome $(PACKAGE).jar install.rdf chrome.manifest

distclean: clean
	rm -f $(PACKAGE)-$(PACKAGE_VERSION).xpi
