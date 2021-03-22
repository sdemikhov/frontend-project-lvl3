import {
  test, expect, beforeEach, describe, beforeAll, afterAll, afterEach,
} from '@jest/globals';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import testingLibrary from '@testing-library/dom';
import userEventHelpers from '@testing-library/user-event';
import '@testing-library/jest-dom';
import nock from 'nock';
import axios from 'axios';
import adapter from 'axios/lib/adapters/http';

import init from '../src/init.js';

const { screen, waitFor } = testingLibrary;
const userEvent = userEventHelpers.default;

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const getFixturePath = (name) => path.join(dirname, '__fixtures__', name);
const readFile = (name) => fs.promises.readFile(getFixturePath(name), 'utf-8');

beforeAll(() => {
  axios.defaults.adapter = adapter;
  nock.disableNetConnect();
});

afterAll(() => {
  nock.enableNetConnect();
});

beforeEach(() => (fs.promises
  .readFile(path.join(dirname, '..', 'index.html'), 'utf-8')
  .then((initHtml) => {
    document.body.innerHTML = initHtml.toString();
    return init();
  })
));

afterEach(() => {
  nock.cleanAll();
  document.body.innerHTML = '';
});

describe('RSS Reader displays messages:', () => {
  test('then provided invalid URL should display error message', () => {
    userEvent.type(screen.getByRole('textbox', { name: 'url' }), 'www.urlwithoutschema.example.com');
    userEvent.click(screen.getByRole('button', { name: 'add' }));

    return screen.findByText(/Ссылка должна быть валидным URL/i)
      .then((nodeWithInvalidUrlMessage) => {
        expect(nodeWithInvalidUrlMessage).toBeInTheDocument();
      });
  });

  test('then provided valid URL and network error occurs should display error message', () => {
    nock('https://hexlet-allorigins.herokuapp.com')
      .get(/.*/)
      .reply(500, 'Servers are crashed.');

    userEvent.type(screen.getByRole('textbox', { name: 'url' }), 'http://networkerror.example.com');
    userEvent.click(screen.getByRole('button', { name: 'add' }));

    return screen.findByText(/Ошибка сети/i)
      .then((nodeWithNetworkerror) => {
        expect(nodeWithNetworkerror).toBeInTheDocument();
      });
  });

  test('then provided valid URL should display success message, if provide same URL should display error message', () => readFile('rss-unupdatable-feed.xml')
    .then((fixtureContent) => {
      const response = { contents: fixtureContent };

      nock('https://hexlet-allorigins.herokuapp.com')
        .persist()
        .get(/.*/)
        .reply(200, response);

      userEvent.type(screen.getByRole('textbox', { name: 'url' }), 'http://example.com');
      userEvent.click(screen.getByRole('button', { name: 'add' }));

      return screen.findByText(/RSS успешно загружен/i);
    })
    .then((nodeWithSuccessMessage) => expect(nodeWithSuccessMessage).toBeInTheDocument())
    .then(() => {
      userEvent.type(screen.getByRole('textbox', { name: 'url' }), 'http://example.com');
      userEvent.click(screen.getByRole('button', { name: 'add' }));
      return screen.findByText(/RSS уже существует/i);
    })
    .then((nodeWithExistanceErrorMessage) => {
      expect(nodeWithExistanceErrorMessage).toBeInTheDocument();
    }));

  test('then provided valid URL and downloaded invalid XML/HTML should display error message', () => readFile('rss-feed-without-channel-tag.xml')
    .then((fixtureContent) => {
      const response = { contents: fixtureContent };

      nock('https://hexlet-allorigins.herokuapp.com')
        .persist()
        .get(/.*/)
        .reply(200, response);

      userEvent.type(screen.getByRole('textbox', { name: 'url' }), 'http://invalidxml.example.com');
      userEvent.click(screen.getByRole('button', { name: 'add' }));

      return screen.findByText(/Ресурс не содержит валидный RSS/i);
    })
    .then((nodeWithInvalidXMLErrorMessage) => {
      expect(nodeWithInvalidXMLErrorMessage).toBeInTheDocument();
    }));
});

describe('RSS Reader disables form controls', () => {
  test('Then network request is sending, should disable form controls', () => readFile('rss-unupdatable-feed.xml')
    .then((fixtureContent) => {
      const response = { contents: fixtureContent };

      nock('https://hexlet-allorigins.herokuapp.com')
        .persist()
        .get(/.*/)
        .reply(200, response);

      userEvent.type(screen.getByRole('textbox', { name: 'url' }), 'http://example.com');
      userEvent.click(screen.getByRole('button', { name: 'add' }));

      return waitFor(() => {
        expect(screen.getByRole('textbox', { name: 'url' })).toHaveAttribute('readonly');
      });
    })
    .then(() => {
      expect(screen.getByRole('button', { name: 'add' })).toBeDisabled();
    }));
});
