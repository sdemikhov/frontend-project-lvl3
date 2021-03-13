import { test, expect } from '@jest/globals';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import parseXML from '../src/xml-parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getFixturePath = (filename) => path.join(__dirname, '__fixtures__', filename);
const readFile = (filename) => fs.promises.readFile(getFixturePath(filename), 'utf-8');

test('parseXML(validXML)', () => {
  const readFixture = readFile('rss-feed.xml');
  const readResult = readFile('parsed-xml-result.json');

  return Promise.all([readFixture, readResult])
    .then(([stringWithXML, stringWithJSON]) => {
      const actual = parseXML(stringWithXML);
      const expected = JSON.parse(stringWithJSON, 'utf-8');
      expect(actual).toEqual(expected);
    });
});

test('parseXML()', () => {
  expect(() => parseXML()).toThrow();
});
