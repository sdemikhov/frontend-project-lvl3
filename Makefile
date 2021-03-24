develop:
	npx webpack serve

install:
	npm ci

build:
	rm -rf dist
	NODE_ENV=production npx webpack

test:
	npm test

test-coverage:
	npm test -- --coverage --coverageProvider=v8

lint:
	npx eslint .

check: lint test build

.PHONY: develop install build test test-coverage lint check
