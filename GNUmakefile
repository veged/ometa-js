SUFFIX=.ometajs

all: lib/ometajs/grammars/bsjs.js

lib/ometajs/grammars/%.js: lib/ometajs/grammars/%.ometajs
	./bin/ometajs2js -b --root "../../../" -i $< -o $@

test:
	mocha --ui tdd --growl --reporter spec test/unit/*-test.js

docs:
	docco lib/ometajs/*.js

.PHONY: all docs
