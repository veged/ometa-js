compiledname = $(addsuffix .js, $(addprefix lib/ometajs/ometa/, \
							 $(notdir $(basename $1))))

SUFFIX=.ometajs

all: empty-parsers $(wildcard src/*.ometajs) swap-parsers

empty-parsers:
	@rm -f lib/ometajs/ometa/parsers.js.tmp
	@rm -f lib/ometajs/ometa/parsers.js.tmp.2

swap-parsers:
	@bin/ometajs2js --root "../../ometajs" -i lib/ometajs/ometa/parsers.js.tmp \
		-o lib/ometajs/ometa/parsers.js.tmp.2
	@uglifyjs -b -ns -nm lib/ometajs/ometa/parsers.js.tmp.2 >\
		lib/ometajs/ometa/parsers.js
	@rm -f lib/ometajs/ometa/parsers.js.tmp
	@rm -f lib/ometajs/ometa/parsers.js.tmp.2

%.ometajs:
	@cat $@ >> lib/ometajs/ometa/parsers.js.tmp

test:
	mocha --ui tdd --growl --reporter spec test/unit/*-test.js

docs:
	docco lib/ometajs/*.js

.PHONY: all docs
