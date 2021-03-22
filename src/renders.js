/* eslint-disable no-param-reassign, */

import resources from './locales/locales.js';

const renderErrors = (errors, elements, i18nextInstance) => {
  if (errors.length > 0) {
    const messages = errors.map(({ message }) => {
      const { localization } = message;

      if (localization) {
        return i18nextInstance.t(localization.key);
      }
      return message;
    });

    elements.feedback.classList.add('text-danger');
    elements.feedback.textContent = messages.join(', ');

    elements.input.setAttribute('aria-describedby', elements.feedback.id);
    elements.input.classList.add('is-invalid');
  } else {
    elements.feedback.classList.remove('text-danger');
    elements.feedback.textContent = '';

    elements.input.classList.remove('is-invalid');
    elements.input.setAttribute('aria-describedby', 'addressHelp');
  }
};

const processFormState = (value, elements, i18nextInstance) => {
  if (value === 'filling') {
    elements.submit.disabled = false;
    elements.input.readOnly = false;
  }
  if (value === 'sending') {
    elements.submit.disabled = true;
    elements.input.readOnly = true;
  }
  if (value === 'failed') {
    elements.submit.disabled = false;
    elements.input.readOnly = false;
  }
  if (value === 'finished') {
    elements.submit.disabled = false;
    elements.input.readOnly = false;

    elements.form.reset();

    elements.feedback.classList.add('text-success');
    elements.feedback.textContent = i18nextInstance.t('downloadFeed.success');
  }
};

const changeLanguage = (state, elements, i18nextInstance) => {
  const { errors } = state.requestForm;
  const { language: code } = state;
  const { state: formState } = state.requestForm;

  i18nextInstance.changeLanguage(code);
  renderErrors(errors, elements, i18nextInstance);
  processFormState(formState, elements, i18nextInstance);

  elements.changeLanguageButtons.forEach((button) => {
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
    const elems = document.querySelectorAll(`[data-translate="${name}"]`);
    if (!elements) {
      return;
    }

    const property = page[name];
    elems.forEach((element) => {
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

const createPostsEl = (posts, state, i18nextInstance) => {
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
      if (state.visitedPostsIds.has(post.id)) {
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
      postButton.textContent = i18nextInstance.t('posts.view');
      postButton.dataset.id = post.id;
      postButton.setAttribute('data-toggle', 'modal');
      postButton.setAttribute('data-target', '#modal');
      postButton.addEventListener('click', (e) => {
        const button = e.target;
        const selectedPostId = parseInt(button.dataset.id, 10);
        state.postIdForModal = selectedPostId;
        state.visitedPostsIds.add(selectedPostId);
      });

      postsLi.append(postA, postButton);
      postsUl.prepend(postsLi);
    });

  return postsUl;
};

const renderFeeds = (feeds, elements, i18nextInstance) => {
  const feedsHeader = document.createElement('h2');
  feedsHeader.dataset.translate = 'feedsHeader';
  feedsHeader.textContent = i18nextInstance.t('feeds');
  const feedsEl = createFeedsEl(feeds);

  elements.feedsContainer.innerHTML = '';
  elements.feedsContainer.append(feedsHeader, feedsEl);
};

const renderPosts = (posts, elements, state, i18nextInstance) => {
  const postsHeader = document.createElement('h2');
  postsHeader.dataset.translate = 'postsHeader';
  postsHeader.textContent = i18nextInstance.t('posts.header');
  const postsEl = createPostsEl(posts, state, i18nextInstance);

  elements.postsContainer.innerHTML = '';
  elements.postsContainer.append(postsHeader, postsEl);
};

const renderModal = (selectedPostId, elements, state) => {
  const selectedPost = state.posts.find(({ id: postId }) => selectedPostId === postId);

  elements.modalTitle.textContent = selectedPost.title;
  elements.modalBody.textContent = selectedPost.description;
  elements.modalA.setAttribute('href', selectedPost.link);

  const a = elements.postsContainer.querySelector(`a[data-id="${selectedPostId}"]`);
  a.classList.remove('font-weight-bold');
  a.classList.add('font-weight-normal');
};

export default {
  renderErrors,
  processFormState,
  changeLanguage,
  renderFeeds,
  renderPosts,
  renderModal,
};
