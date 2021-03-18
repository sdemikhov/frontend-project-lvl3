import i18n from 'i18next';
import axios from 'axios';
import _ from 'lodash';

import buildwatchedState from './watcher.js';
import resources from './locales/locales.js';
import parseXML from './xml-parser.js';
import validateURL from './validate-url.js';

const DEFAULT_LANGUAGE = 'ru';

const routes = {
  allOrigins: (url) => {
    const encoded = encodeURIComponent(url);
    return `https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=${encoded}`;
  },
};

export default () => {
  const state = {
    language: DEFAULT_LANGUAGE,
    requestForm: {
      state: 'filling',
      errors: [],
    },
    feeds: [],
    posts: [],
    timeoutID: null,
    postIdForModal: null,
    visitedPostsIds: new Set(),
  };

  i18n.init({ lng: DEFAULT_LANGUAGE, resources })
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
      const watchedState = buildwatchedState(state, elements);

      changeLanguageButtons.forEach((button) => {
        button.addEventListener('click', (e) => {
          const { language } = e.target.dataset;
          watchedState.language = language;
        });
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const { value: url } = e.target.elements.addressInput;

        const downloadedURLS = watchedState.feeds.map((feed) => feed.link);
        validateURL(url, downloadedURLS).then((errors) => {
          watchedState.requestForm.errors = errors;

          if (errors.length > 0) {
            return;
          }

          watchedState.requestForm.state = 'sending';

          if (watchedState.timeoutID) {
            clearTimeout(watchedState.timeoutID);
            watchedState.timeoutID = null;
          }

          axios.get(routes.allOrigins(url))
            .then((response) => {
              const [feed, posts] = parseXML(response.data.contents);
              feed.link = url;

              watchedState.feeds.push(feed);

              let newPostId = watchedState.posts.length;
              watchedState.posts.push(...posts.map((post) => {
                const newPost = { ...post };
                newPost.id = newPostId;
                newPostId += 1;
                return newPost;
              }));
              watchedState.requestForm.state = 'finished';
            })
            .catch((err) => {
              watchedState.requestForm.state = 'failed';
              // to do: fix error translation
              if (axios.isAxiosError(err)) {
                watchedState.requestForm.errors.push({
                  message: i18n.t('downloadFeed.failed'),
                });
              } else {
                watchedState.requestForm.errors.push(err);
              }
            })
            .then(() => {
              function updatePosts(urls) {
                const promises = urls.map((feedURL) => axios
                  .get(routes.allOrigins(feedURL))
                  .then((resp) => {
                    const [, nposts] = parseXML(resp.data.contents);
                    return nposts;
                  })
                  .catch(() => []));
                Promise.all(promises).then((allPosts) => {
                  const newPosts = [...watchedState.posts];
                  let newPostId = newPosts.length;

                  const flattened = _.flatten(allPosts);
                  flattened.forEach((post) => {
                    const samePost = newPosts.find((oldPost) => oldPost.link === post.link);
                    if (!samePost) {
                      const newPost = { ...post };
                      newPost.id = newPostId;
                      newPosts.push(newPost);
                      newPostId += 1;
                    }
                  });
                  watchedState.posts = newPosts;

                  watchedState.timeoutID = setTimeout(
                    updatePosts,
                    5000,
                    watchedState.feeds.map((feed) => feed.link),
                  );
                });
              }
              // to do: fix to skip postsUpdate function if urls list is empty
              watchedState.timeoutID = setTimeout(
                updatePosts,
                5000,
                watchedState.feeds.map((feed) => feed.link),
              );
            });
        });
      });
    });
};
