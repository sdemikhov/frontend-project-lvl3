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

describe('RSS Reader display posts:', () => {
  test('then provided valid URL should display feed with posts and fill modal', () => {
    const filenames = [
      'rss-unupdatable-feed.xml',
      'rss-updatable-feed-first-request.xml',
      'rss-updatable-feed-last-request.xml',
    ];

    const promises = filenames.map(readFile);
    return Promise.all(promises)
      .then(([unupdatableFeedContent, updatableFeedFirstContent, updatableFeedLastContent]) => {
        const responseForUnupdatable = { contents: unupdatableFeedContent };
        const responseForUpdatableFirst = { contents: updatableFeedFirstContent };
        const responseForUpdatableLast = { contents: updatableFeedLastContent };
        nock('https://hexlet-allorigins.herokuapp.com')
          .persist()
          .get(/unupdatablefeed/)
          .reply(201, responseForUnupdatable);

        nock('https://hexlet-allorigins.herokuapp.com')
          .get(/feedupdatable/)
          .reply(201, responseForUpdatableFirst);

        nock('https://hexlet-allorigins.herokuapp.com')
          .persist()
          .get(/feedupdatable/)
          .reply(201, responseForUpdatableLast);

        userEvent.type(screen.getByRole('textbox', { name: 'url' }), 'http://unupdatablefeed.example.com');
        userEvent.click(screen.getByRole('button', { name: 'add' }));

        return waitFor(() => {
          expect(screen.getByText(/Lorem ipsum feed for an interval of 1 years with 2 item\(s\)/)).toBeInTheDocument();
          expect(screen.getByText(/This is a nonupdating lorem ipsum feed/)).toBeInTheDocument();

          expect(screen.getByRole('link', { name: /Lorem ipsum 2021-01-01T00:00:00Z/i })).toBeInTheDocument();
          expect(screen.getByRole('link', { name: /Lorem ipsum 2020-01-01T00:00:00Z/i })).toBeInTheDocument();
        });
      })
      .then(() => {
        userEvent.type(screen.getByRole('textbox', { name: 'url' }), 'http://feedupdatablefeed.example.com');
        userEvent.click(screen.getByRole('button', { name: 'add' }));

        return waitFor(() => {
          expect(screen.getByText(/Lorem ipsum feed for an interval of 1 minutes with 2 item\(s\)/)).toBeInTheDocument();
          expect(screen.getByText(/Lorem ipsum feed for an interval of 1 years with 2 item\(s\)/)).toBeInTheDocument();

          expect(screen.getByText(/This is a constantly updating lorem ipsum feed/)).toBeInTheDocument();
          expect(screen.getByText(/This is a nonupdating lorem ipsum feed/)).toBeInTheDocument();

          expect(screen.getByRole('link', { name: /Lorem ipsum 2021-03-23T13:28:00Z/i })).toBeInTheDocument();
          expect(screen.getByRole('link', { name: /Lorem ipsum 2021-03-23T13:27:00Z/i })).toBeInTheDocument();
          expect(screen.getByRole('link', { name: /Lorem ipsum 2021-01-01T00:00:00Z/i })).toBeInTheDocument();
          expect(screen.getByRole('link', { name: /Lorem ipsum 2020-01-01T00:00:00Z/i })).toBeInTheDocument();
        });
      })
      .then(() => (waitFor(() => {
        expect(screen.getByText(/Lorem ipsum feed for an interval of 1 minutes with 2 item\(s\)/)).toBeInTheDocument();
        expect(screen.getByText(/Lorem ipsum feed for an interval of 1 years with 2 item\(s\)/)).toBeInTheDocument();
        expect(screen.getAllByText(/Lorem ipsum feed/).length).toBe(2);

        expect(screen.getByText(/This is a constantly updating lorem ipsum feed/)).toBeInTheDocument();
        expect(screen.getByText(/This is a nonupdating lorem ipsum feed/)).toBeInTheDocument();

        expect(screen.getByRole('link', { name: /Lorem ipsum 2021-03-23T13:29:00Z/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Lorem ipsum 2021-03-23T13:28:00Z/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Lorem ipsum 2021-03-23T13:27:00Z/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Lorem ipsum 2021-01-01T00:00:00Z/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Lorem ipsum 2020-01-01T00:00:00Z/i })).toBeInTheDocument();
        expect(screen.getAllByRole('link', { name: /Lorem ipsum \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/i }).length).toBe(5);
      }, { timeout: 8000 })
      ))
      .then(() => {
        const previewButtons = screen.getAllByRole('button', { name: /Просмотр/i });
        expect(previewButtons.length).toBe(5);

        expect(screen.getByRole('link', { name: /Lorem ipsum 2021-03-23T13:29:00Z/i })).toHaveClass('font-weight-bold');
        userEvent.click(previewButtons[0]);
        return screen.findByText('Aliquip proident non ut veniam.');
      })
      .then((nodeWithDescriptionInsideModal) => {
        expect(nodeWithDescriptionInsideModal).toBeVisible();
        expect(screen.getByRole('link', { name: /Lorem ipsum 2021-03-23T13:29:00Z/i })).not.toHaveClass('font-weight-bold');
      });
  }, 10000);
});
