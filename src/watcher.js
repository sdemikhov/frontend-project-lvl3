import onChange from 'on-change';

import renders from './renders.js';

export default (state, elements, i18nextInstance) => {
  const watchedState = onChange(state, (path, value) => {
    if (path === 'requestForm.errors') {
      renders.renderErrors(value, elements, i18nextInstance);
      return;
    }

    if (path === 'requestForm.state') {
      renders.processFormState(value, elements, i18nextInstance);
      return;
    }

    if (path === 'language') {
      renders.changeLanguage(watchedState, elements, i18nextInstance);
      return;
    }

    if (path === 'feeds') {
      renders.renderFeeds(value, elements, i18nextInstance);
      return;
    }

    if (path === 'posts') {
      renders.renderPosts(value, elements, watchedState, i18nextInstance);
      return;
    }

    if (path === 'postIdForModal') {
      renders.renderModal(value, elements, watchedState);
    }
  });

  return watchedState;
};
