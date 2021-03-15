import i18n from 'i18next';
import onChange from 'on-change';
import axios from 'axios';

import view from './view.js';
import resources from './locales/locales.js';
import parseXML from './xml-parser.js';
import validateURL from './validate-url.js';

const DEFAULT_LANGUAGE = 'ru';

const routes = {
  allOrigins: (url) => {
    const encoded = encodeURIComponent(url);
    return `https://hexlet-allorigins.herokuapp.com/get?url=${encoded}`;
  },
};

const errorMessages = {
  network: {
    message: i18n.t('downloadFeed.failed'),
  },
};

export default () => {
  const state = {
    language: DEFAULT_LANGUAGE,
    requestForm: {
      state: 'filling',
      inputValue: null,
      errors: [],
    },
    feeds: [],
  };

  i18n.init({ lng: DEFAULT_LANGUAGE, resources })
    .then(() => {
      const watchedState = onChange(state, view);

      const requestForm = document.querySelector('#request-form');
      requestForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const { value } = e.target.elements.addressInput;
        watchedState.requestForm.inputValue = value;

        const downloadedURLS = Object.keys(watchedState.feeds);
        validateURL(value, downloadedURLS).then((errors) => {
          watchedState.requestForm.errors = errors;

          if (errors.length > 0) {
            return;
          }

          watchedState.requestForm.state = 'sending';
          axios.get(routes.allOrigins(value))
            .then((response) => {
              const feed = parseXML(response.data.contents);

              watchedState.feeds.unshift(feed);
              watchedState.requestForm.state = 'finished';
            })
            .catch((err) => {
              console.log(err.message);
              watchedState.requestForm.state = 'failed';
              if (axios.isAxiosError(err)) {
                watchedState.requestForm.errors.push(errorMessages.network);
              } else {
                watchedState.requestForm.errors.push(err);
              }
            });
        });
      });

      const buttons = document.querySelectorAll('[data-language]');
      buttons.forEach((button) => {
        button.addEventListener('click', (e) => {
          const { language } = e.target.dataset;
          watchedState.language = language;
        });
      });
    });
};
