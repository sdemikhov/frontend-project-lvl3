import i18n from 'i18next';

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
  if (value === 'filling') {
    submitButton.disabled = false;
  }
  if (value === 'sending') {
    submitButton.disabled = true;
  }
  if (value === 'failed') {
    submitButton.disabled = false;
  }
  if (value === 'finished') {
    submitButton.disabled = false;

    const input = document.getElementById('addressInput');
    input.textContent = '';

    const feedback = document.getElementById('validationAddressInput');
    feedback.classList.add('text-success');
    feedback.textContent = i18n.t('downloadFeed.success');
  }
};

const changeLanguage = (value) => {
  console.log(value);
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
    postsUl.append(feedLi);
  });

  return postsUl;
};

const createPostsEl = (feeds) => {
  const postsUl = document.createElement('ul');
  postsUl.classList.add('list-group');

  feeds
    .reduce((acc, { items }) => [...acc, ...items], [])
    .forEach((post) => {
      const postsLi = document.createElement('li');
      postsLi.classList.add(
        'list-group-item',
        'd-flex',
        'justify-content-between',
        'align-items-start',
      );

      const postA = document.createElement('a');
      postA.classList.add('font-weight-normal');
      postA.textContent = post.title;
      postA.setAttribute('href', post.link);

      const postButton = document.createElement('button');
      postButton.classList.add('btn', 'btn-primary', 'btn-sm');
      postButton.textContent = i18n.t('posts.view');

      postsLi.append(postA, postButton);
      postsUl.append(postsLi);
    });

  return postsUl;
};

const renderFeeds = (feeds) => {
  const feedsContainer = document.querySelector('#feeds');
  const feedsHeader = document.createElement('h2');
  feedsHeader.textContent = i18n.t('feeds');
  const feedsEl = createFeedsEl(feeds);

  feedsContainer.innerHTML = '';
  feedsContainer.append(feedsHeader, feedsEl);

  const postsContainer = document.querySelector('#posts');
  const postsHeader = document.createElement('h2');
  postsHeader.textContent = i18n.t('posts.header');
  const postsEl = createPostsEl(feeds);

  postsContainer.innerHTML = '';
  postsContainer.append(postsHeader, postsEl);
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
};
