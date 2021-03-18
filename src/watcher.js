import onChange from 'on-change';

import renders from './renders.js';

// to do: rewrite ifs to cases
export default (state, elements) => {
  const watchedState = onChange(state, (path, value) => {
    if (path === 'requestForm.errors') {
      renders.renderErrors(value, elements);
      return;
    }

    if (path === 'requestForm.state') {
      renders.processFormState(value, elements);
      return;
    }

    if (path === 'language') {
      renders.changeLanguage(value, elements);
      return;
    }

    if (path === 'feeds') {
      renders.renderFeeds(value, elements);
      return;
    }

    if (path === 'posts') {
      renders.renderPosts(value, elements, watchedState);
      return;
    }

    if (path === 'postIdForModal') {
      renders.renderModal(value, elements, watchedState);
    }
  });

  return watchedState;
};
