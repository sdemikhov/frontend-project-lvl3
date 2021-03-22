import { test, expect, describe } from '@jest/globals';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import parseXML from '../src/xml-parser.js';
import validateURL from '../src/validate-url.js';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const getFixturePath = (name) => path.join(dirname, '__fixtures__', name);
const readFile = (name) => fs.promises.readFile(getFixturePath(name), 'utf-8');

describe('Parsing XML for RSS channel', () => {
  test('Then valid XML provided should return RSS channel object', () => {
    const readFixture = readFile('rss-feed.xml');
    const readResult = readFile('parsed-xml-result.json');

    return Promise.all([readFixture, readResult])
      .then(([stringWithXML, stringWithJSON]) => {
        const actual = parseXML(stringWithXML);
        const expected = JSON.parse(stringWithJSON, 'utf-8');

        expect(actual).toEqual(expected);
      });
  });

  test('Then called with zero arguments should throw error', () => {
    expect(() => parseXML()).toThrow();
  });

  test('Then called with XML/HTML without channel tag should throw error', () => (
    readFile('rss-feed-without-channel-tag.xml')
      .then((stringWithInvalidXML) => (
        expect(() => parseXML(stringWithInvalidXML).toThrow())
      ))
  ));
});

describe('Validate URL function', () => {
  describe.each([
    [
      'unique URL and not empty already downloaded URLs array ',
      'http://unique.example.com',
      ['http://a.example.com', 'http://b.example.com'],
      true,
    ],
    [
      'empty string as URL and empty already downloaded URLs array ',
      '',
      [],
      false,
    ],
    [
      'Not unique URL and not empty already downloaded urls array ',
      'http://notunique.example.com',
      ['http://a.example.com', 'http://notunique.example.com'],
      false,
    ],
  ])('Then called with %s', (description, url, downloadedURLS, result) => {
    test(`should return errors array, check it for zero length is ${result}`, () => (
      validateURL(url, downloadedURLS)
        .then((errors) => expect(errors.length === 0).toBe(result))
    ));
  });
});
