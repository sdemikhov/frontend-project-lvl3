/* eslint-disable no-param-reassign, */
import i18n from 'i18next';
import axios from 'axios';
import _ from 'lodash';

import getWatchedState from './watchers.js';
import resources from './locales/locales.js';
import parseRSS from './rss-channel.js';
import validators from './validators.js';

const DEFAULT_LANGUAGE = 'ru';

const getProxyUrl = (feedURL) => {
  const result = new URL('get', 'https://hexlet-allorigins.herokuapp.com');
  result.searchParams.append('disableCache', true);
  result.searchParams.append('url', feedURL);
  return result.toString();
};

const updatePosts = (state, updateTimeout) => {
  const getPosts = () => {
    if (state.feeds.length === 0) {
      return Promise.resolve();
    }

    const addedURLS = state.feeds.map((feed) => feed.url);
    const requests = addedURLS.map((feedURL) => axios.get(getProxyUrl(feedURL))
      .then((resp) => {
        const [, posts] = parseRSS(resp.data.contents);
        return posts;
      })
      .catch(() => []));

    return Promise.all(requests).then((allPosts) => {
      const newPostsWithoutId = _.differenceBy(_.flatten(allPosts), state.posts, 'url');
      const newPosts = newPostsWithoutId.map((post) => ({ ...post, id: _.uniqueId() }));
      state.posts = [...state.posts, ...newPosts];
    });
  };

  getPosts().then(() => setTimeout(updatePosts, updateTimeout, state, updateTimeout));
};

const addFeedWithPosts = (state, url) => axios.get(getProxyUrl(url))
  .then((response) => {
    const [feed, posts] = parseRSS(response.data.contents);

    state.feeds.push({ ...feed, url });

    const newPosts = posts.map((post) => ({ ...post, id: _.uniqueId() }));

    state.posts = [...state.posts, ...newPosts];
    state.requestForm.state = 'finished';
  })
  .catch((err) => {
    state.requestForm.state = 'failed';
    if (axios.isAxiosError(err)) {
      state.requestForm.error = 'downloadFeed.failed';
    } else {
      state.requestForm.error = err.message;
    }
  });

const handleFormSubmit = (state) => (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const url = formData.get('url');

  const addedURLS = state.feeds.map((feed) => feed.url);

  const { validateURL } = validators;
  const error = validateURL(url, addedURLS);
  state.requestForm.error = error;

  if (error) {
    return;
  }

  state.requestForm.state = 'sending';

  addFeedWithPosts(state, url);
};

const handleChangeLanguageClick = (state) => (e) => {
  const { language } = e.target.dataset;
  state.language = language;
};

const handlePostPreviewClick = (state) => (e) => {
  const button = e.target.closest('button');
  if (!button) {
    return;
  }

  const selectedPostId = button.dataset.id;
  state.postIdForModal = selectedPostId;
  state.visitedPostsIds.add(selectedPostId);
};

export default (updateTimeout = 5000) => {
  const state = {
    language: DEFAULT_LANGUAGE,
    requestForm: {
      state: 'filling',
      error: null,
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

      const elements = {
        form,
        input,
        feedback,
        submit,
        changeLanguageButtons,
        feedsContainer,
        postsContainer,
        modal,
      };
      const watchedState = getWatchedState(state, elements, i18nextInstance);

      changeLanguageButtons.forEach((button) => {
        button.addEventListener('click', handleChangeLanguageClick(watchedState));
      });

      form.addEventListener('submit', handleFormSubmit(watchedState));
      postsContainer.addEventListener('click', handlePostPreviewClick(watchedState));

      updatePosts(watchedState, updateTimeout);
    });
};
