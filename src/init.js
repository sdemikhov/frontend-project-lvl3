/* eslint-disable no-param-reassign */
import i18n from 'i18next';
import onChange from 'on-change';
import * as yup from 'yup';

import view from './view.js';
import resources from './locales';

const DEFAULT_LANGUAGE = 'ru';

const validateURL = (url, downloadedURLS) => {
  const schema = yup.string().required().url().notOneOf(downloadedURLS);
  return schema
    .validate(url, { abortEarly: false })
    .then(() => [])
    .catch((e) => e.inner);
};

export default () => {
  const state = {
    language: DEFAULT_LANGUAGE,
    requestForm: {
      state: 'filling',
      inputValue: null,
      errors: [],
    },
    feeds: {},
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
        });
      });
    });
};
