import i18n from 'i18next';
import onChange from 'on-change';
import axios from 'axios';
import _ from 'lodash';

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
      errors: [],
    },
    feeds: [],
    posts: [],
    timeoutID: null,
  };

  i18n.init({ lng: DEFAULT_LANGUAGE, resources })
    .then(() => {
      const watchedState = onChange(state, view);

      const requestForm = document.querySelector('#request-form');
      requestForm.addEventListener('submit', (e) => {
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

              watchedState.feeds.unshift(feed);
              watchedState.posts.push(...posts);
              watchedState.requestForm.state = 'finished';
            })
            .catch((err) => {
              watchedState.requestForm.state = 'failed';
              if (axios.isAxiosError(err)) {
                watchedState.requestForm.errors.push(errorMessages.network);
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
                    console.log(nposts);
                    return nposts;
                  })
                  .catch());
                Promise.all(promises).then((allPosts) => {
                  const oldPosts = watchedState.posts;
                  const newPosts = _.flatten(allPosts);
                  const uniquePosts = _.uniqWith([...oldPosts, ...newPosts], _.isEqual);
                  watchedState.posts = uniquePosts;

                  watchedState.timeoutID = setTimeout(
                    updatePosts,
                    5000,
                    watchedState.feeds.map((feed) => feed.link),
                  );
                });
              }
              watchedState.timeoutID = setTimeout(
                updatePosts,
                5000,
                watchedState.feeds.map((feed) => feed.link),
              );
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
