/* eslint-disable no-param-reassign, */
import i18n from 'i18next';

import resources from './locales/locales.js';

const renderErrors = (errors) => {
  const input = document.getElementById('addressInput');
  const feedback = document.getElementById('validationAddressInput');

  if (errors.length > 0) {
    const messages = errors.map(({ message }) => message);

    feedback.classList.add('text-danger');
    feedback.textContent = messages.join(', ');

    input.setAttribute('aria-describedby', feedback.id);
    input.classList.add('is-invalid');
  } else {
    feedback.classList.remove('text-danger');
    feedback.textContent = '';

    input.classList.remove('is-invalid');
    input.setAttribute('aria-describedby', 'addressHelp');
  }
};

const processFormState = (value) => {
  const submitButton = document.querySelector('[type="submit"]');
  const input = document.querySelector('#addressInput');

  if (value === 'filling') {
    submitButton.disabled = false;
    input.readOnly = false;
  }
  if (value === 'sending') {
    submitButton.disabled = true;
    input.readOnly = true;
  }
  if (value === 'failed') {
    submitButton.disabled = false;
    input.readOnly = false;
  }
  if (value === 'finished') {
    submitButton.disabled = false;
    input.readOnly = false;

    const form = document.getElementById('request-form');
    form.reset();

    const feedback = document.getElementById('validationAddressInput');
    feedback.classList.add('text-success');
    feedback.textContent = i18n.t('downloadFeed.success');
  }
};

const changeLanguage = (code) => {
  i18n.changeLanguage(code);

  const buttons = document.querySelectorAll('[data-language]');
  buttons.forEach((button) => {
    const { language } = button.dataset;
    if (language === code) {
      button.classList.remove('btn-outline-light');
      button.classList.add('btn-outline-success');
    } else {
      button.classList.remove('btn-outline-success');
      button.classList.add('btn-outline-light');
    }
  });

  const { page } = resources[code].translation;

  Object.keys(page).forEach((name) => {
    const elements = document.querySelectorAll(`[data-translate="${name}"]`);
    if (!elements) {
      return;
    }

    const property = page[name];
    elements.forEach((element) => {
      if (property.length > 1) {
        const [attribute, value] = property;
        element.setAttribute(attribute, value);
      } else {
        element.textContent = property;
      }
    });
  });
};

const createFeedsEl = (feeds) => {
  const postsUl = document.createElement('ul');
  postsUl.classList.add('list-group', 'mb-5');

  feeds.forEach((feed) => {
    const feedLi = document.createElement('li');
    feedLi.classList.add('list-group-item');

    const feedHeader = document.createElement('h3');
    feedHeader.textContent = feed.title;

    const feedPEl = document.createElement('p');
    feedPEl.textContent = feed.description;

    feedLi.append(feedHeader, feedPEl);
    postsUl.prepend(feedLi);
  });

  return postsUl;
};

const createPostsEl = (posts) => {
  const postsUl = document.createElement('ul');
  postsUl.classList.add('list-group');

  posts
    .forEach((post) => {
      const postsLi = document.createElement('li');
      postsLi.classList.add(
        'list-group-item',
        'd-flex',
        'justify-content-between',
        'align-items-start',
      );

      const postA = document.createElement('a');
      if (post.visited) {
        postA.classList.add('font-weight-normal');
      } else {
        postA.classList.add('font-weight-bold');
      }

      postA.textContent = post.title;
      postA.setAttribute('href', post.link);
      postA.dataset.id = post.id;

      const postButton = document.createElement('button');
      postButton.dataset.translate = 'viewPostButton';
      postButton.classList.add('btn', 'btn-primary', 'btn-sm');
      postButton.textContent = i18n.t('posts.view');
      postButton.dataset.id = post.id;
      postButton.setAttribute('data-toggle', 'modal');
      postButton.setAttribute('data-target', '#modal');

      postsLi.append(postA, postButton);
      postsUl.prepend(postsLi);
    });

  return postsUl;
};

const renderFeeds = (feeds) => {
  const feedsContainer = document.querySelector('#feeds');
  const feedsHeader = document.createElement('h2');
  feedsHeader.dataset.translate = 'feedsHeader';
  feedsHeader.textContent = i18n.t('feeds');
  const feedsEl = createFeedsEl(feeds);

  feedsContainer.innerHTML = '';
  feedsContainer.append(feedsHeader, feedsEl);
};

const renderPosts = (posts) => {
  const postsContainer = document.querySelector('#posts');
  const postsHeader = document.createElement('h2');
  postsHeader.dataset.translate = 'postsHeader';
  postsHeader.textContent = i18n.t('posts.header');
  const postsEl = createPostsEl(posts);

  postsContainer.innerHTML = '';
  postsContainer.append(postsHeader, postsEl);
};

const renderModal = (modal) => {
  const modalEl = document.querySelector('#modal');
  const modalTitle = modalEl.querySelector('.modal-title');
  const modalBody = modalEl.querySelector('.modal-body');
  const modalA = modalEl.querySelector('a');

  modalTitle.textContent = modal.title;
  modalBody.textContent = modal.body;
  modalA.setAttribute('href', modal.href);
};

const renderVisitedPosts = (visitedPostsIds) => {
  visitedPostsIds.forEach((id) => {
    const a = document.querySelector(`a[data-id="${id}"]`);
    a.classList.remove('font-weight-bold');
    a.classList.add('font-weight-normal');
  });
};

export default (path, value) => {
  if (path === 'requestForm.errors') {
    renderErrors(value);
  }

  if (path === 'requestForm.state') {
    processFormState(value);
  }

  if (path === 'language') {
    changeLanguage(value);
  }

  if (path === 'feeds') {
    renderFeeds(value);
  }

  if (path === 'posts') {
    renderPosts(value);
  }

  if (path === 'modal') {
    renderModal(value);
  }

  if (path === 'visitedPostsIds') {
    renderVisitedPosts(value);
  }
};
