import { test, expect, describe } from '@jest/globals';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import buildRSSChannel from '../src/rss-channel.js';
import validators from '../src/validators.js';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const getFixturePath = (name) => path.join(dirname, '__fixtures__', name);
const readFile = (name) => fs.promises.readFile(getFixturePath(name), 'utf-8');

describe('Parsing XML for RSS channel', () => {
  test('Then valid XML provided should return RSS channel', () => {
    const readFixture = readFile('rss-feed.xml');
    const readResult = readFile('parsed-xml-result.json');

    return Promise.all([readFixture, readResult])
      .then(([stringWithXML, stringWithJSON]) => {
        const actual = buildRSSChannel(stringWithXML);
        const expected = JSON.parse(stringWithJSON, 'utf-8');

        expect(actual).toEqual(expected);
      });
  });

  test('Then called with zero arguments should throw error', () => {
    expect(() => buildRSSChannel()).toThrow();
  });

  test('Then called with XML/HTML without channel tag should throw error', () => (
    readFile('rss-feed-without-channel-tag.xml')
      .then((stringWithInvalidXML) => (
        expect(() => buildRSSChannel(stringWithInvalidXML).toThrow())
      ))
  ));
});

describe('Validate URL function', () => {
  describe.each([
    [
      'unique URL and not empty already added URLs array ',
      'http://unique.example.com',
      ['http://a.example.com', 'http://b.example.com'],
      null,
    ],
    [
      'incorrect URL',
      'incorrect.example.com',
      ['http://a.example.com', 'http://b.example.com'],
      'validation.url',
    ],
    [
      'empty string as URL',
      '',
      [],
      'validation.required',
    ],
    [
      'Not unique URL and not empty already added urls array ',
      'http://notunique.example.com',
      ['http://a.example.com', 'http://notunique.example.com'],
      'validation.notOneOf',
    ],
  ])('Then called with %s', (description, url, addedURLS, result) => {
    test(`should return ${result}`, () => {
      const { validateURL } = validators;
      const error = validateURL(url, addedURLS);
      expect(error).toBe(result);
    });
  });
});
