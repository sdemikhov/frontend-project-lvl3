import i18n from 'i18next';

import buildwatchedState from './watchers.js';
import resources from './locales/locales.js';
import handlers from './handlers.js';

const DEFAULT_LANGUAGE = 'ru';

export default () => {
  const state = {
    language: DEFAULT_LANGUAGE,
    requestForm: {
      state: 'filling',
      errors: [],
    },
    feeds: [],
    posts: [],
    postIdForModal: null,
    visitedPostsIds: new Set(),
  };

  const i18nextInstance = i18n.createInstance();

  i18nextInstance.init({ lng: DEFAULT_LANGUAGE, resources })
    .then(() => {
      const form = document.querySelector('#request-form');
      const input = form.querySelector('#addressInput');
      const feedback = form.querySelector('#validationAddressInput');
      const submit = form.querySelector('[type="submit"]');
      const changeLanguageButtons = document.querySelectorAll('[data-language]');
      const feedsContainer = document.querySelector('#feeds');
      const postsContainer = document.querySelector('#posts');
      const modal = document.querySelector('#modal');
      const modalTitle = modal.querySelector('.modal-title');
      const modalBody = modal.querySelector('.modal-body');
      const modalA = modal.querySelector('a');

      const elements = {
        form,
        input,
        feedback,
        submit,
        changeLanguageButtons,
        feedsContainer,
        postsContainer,
        modal,
        modalTitle,
        modalBody,
        modalA,
      };
      const watchedState = buildwatchedState(state, elements, i18nextInstance);

      changeLanguageButtons.forEach((button) => {
        button.addEventListener('click', handlers.handleChangeLanguageClick(watchedState));
      });

      form.addEventListener('submit', handlers.handleFormSubmit(watchedState));
    });
};
