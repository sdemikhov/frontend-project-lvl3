/* eslint-disable no-param-reassign, */
import axios from 'axios';
import _ from 'lodash';

import parseXML from './xml-parser.js';
import validateURL from './validate-url.js';

const routes = {
  allOrigins: (url) => {
    const encoded = encodeURIComponent(url);
    return `https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=${encoded}`;
  },
};

const DEFAULT_UPDATE_TIMEOUT = 5000;

const addFeedWithPosts = (state, url) => axios.get(routes.allOrigins(url))
  .then((response) => {
    const [feed, posts] = parseXML(response.data.contents);
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
  });

const updatePosts = (urls, state) => {
  const promises = urls.map((feedURL) => axios
    .get(routes.allOrigins(feedURL))
    .then((resp) => {
      const [, nposts] = parseXML(resp.data.contents);
      return nposts;
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

    setTimeout(
      updatePosts,
      DEFAULT_UPDATE_TIMEOUT,
      state.feeds.map((feed) => feed.link),
    );
  });
};

export default (state) => (e) => {
  e.preventDefault();

  const { value: url } = e.target.elements.addressInput;

  const addedURLS = state.feeds.map((feed) => feed.link);
  validateURL(url, addedURLS).then((errors) => {
    state.requestForm.errors = errors;

    if (errors.length > 0) {
      return;
    }

    state.requestForm.state = 'sending';

    addFeedWithPosts(state, url)
      .catch((err) => {
        state.requestForm.state = 'failed';
        if (axios.isAxiosError(err)) {
          const networkError = { ...err };
          networkError.message = { ...networkError.message, localization: { key: 'downloadFeed.failed' } };
          state.requestForm.errors.push(networkError);
        } else {
          state.requestForm.errors.push(err);
        }
        return err;
      })
      .then((err) => {
        if (err) {
          return;
        }

        setTimeout(
          updatePosts,
          DEFAULT_UPDATE_TIMEOUT,
          state.feeds.map((feed) => feed.link),
          state,
        );
      });
  });
};
