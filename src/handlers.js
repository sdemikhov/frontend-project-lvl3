/* eslint-disable no-param-reassign, */
import axios from 'axios';
import _ from 'lodash';

import parseRSS from './rss-channel.js';
import validators from './validators.js';

const routes = {
  allOrigins: (url) => {
    const encoded = encodeURIComponent(url);
    return `https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=${encoded}`;
  },
};

const DEFAULT_UPDATE_TIMEOUT = 5000;

const addFeedWithPosts = (state, url) => axios.get(routes.allOrigins(url))
  .then((response) => {
    const [feed, posts] = parseRSS(response.data.contents);
    feed.link = url;

    state.feeds.push(feed);

    const idStartCount = state.posts.length;

    const newPosts = posts.reduce((acc, post) => {
      const newPost = { ...post };
      newPost.id = idStartCount + acc.length;
      return [...acc, newPost];
    }, []);

    state.posts = [...state.posts, ...newPosts];
    state.requestForm.state = 'finished';
  })
  .catch((err) => {
    state.requestForm.state = 'failed';
    if (axios.isAxiosError(err)) {
      const networkError = { ...err };
      networkError.message = {
        ...networkError.message,
        localization: { key: 'downloadFeed.failed' },
      };
      state.requestForm.errors.push(networkError);
    } else {
      state.requestForm.errors.push(err);
    }
    return err;
  });

const updatePosts = (state) => {
  const addedURLS = state.feeds.map((feed) => feed.link);
  const promises = addedURLS.map((feedURL) => axios
    .get(routes.allOrigins(feedURL))
    .then((resp) => {
      const [, posts] = parseRSS(resp.data.contents);
      return posts;
    })
    .catch(() => []));

  Promise.all(promises).then((allPosts) => {
    const idStartCount = state.posts.length;

    const newPosts = [];
    _.flatten(allPosts).forEach((post) => {
      const samePost = state.posts.find(
        (oldPost) => oldPost.link === post.link,
      );
      if (!samePost) {
        const newPost = { ...post };
        newPost.id = idStartCount + newPosts.length;
        newPosts.push(newPost);
      }
    });

    state.posts = [...state.posts, ...newPosts];

    setTimeout(updatePosts, DEFAULT_UPDATE_TIMEOUT, state);
  });
};

const handleFormSubmit = (state) => (e) => {
  e.preventDefault();

  const { value: url } = e.target.elements.addressInput;

  const addedURLS = state.feeds.map(({ link }) => link);

  const { validateURL } = validators;
  validateURL(url, addedURLS).then((errors) => {
    state.requestForm.errors = errors;

    if (errors.length > 0) {
      return;
    }

    state.requestForm.state = 'sending';

    addFeedWithPosts(state, url)
      .then((err) => {
        if (err) {
          return;
        }

        setTimeout(updatePosts, DEFAULT_UPDATE_TIMEOUT, state);
      });
  });
};

const handleChangeLanguageClick = (state) => (e) => {
  const { language } = e.target.dataset;
  state.language = language;
};

const handlePostPreviewClick = (state) => (e) => {
  const button = e.target;
  const selectedPostId = parseInt(button.dataset.id, 10);
  state.postIdForModal = selectedPostId;
  state.visitedPostsIds.add(selectedPostId);
};

export default {
  handleChangeLanguageClick,
  handleFormSubmit,
  handlePostPreviewClick,
};
