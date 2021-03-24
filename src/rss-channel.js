const getClearContent = (element) => {
  if (element) {
    return element.textContent.trim();
  }
  return '';
};

export default (stringWithXML) => {
  const feed = {};
  const parser = new window.DOMParser();
  const doc = parser.parseFromString(stringWithXML, 'application/xml');
  const channelEl = doc.querySelector('channel');

  if (!channelEl) {
    const parserError = new Error();
    parserError.message = { ...parserError.message, localization: { key: 'parseXML.error' } };
    throw parserError;
  }

  const channelTitleEl = channelEl.querySelector('title');
  feed.title = getClearContent(channelTitleEl);

  const channelDescriptionEl = channelEl.querySelector('description');
  feed.description = getClearContent(channelDescriptionEl);

  const posts = [];

  const itemsEl = channelEl.querySelectorAll('item');
  itemsEl.forEach((itemEl) => {
    const post = {};

    const itemTitleEl = itemEl.querySelector('title');
    post.title = getClearContent(itemTitleEl);

    const itemDescriptionEl = itemEl.querySelector('description');
    post.description = getClearContent(itemDescriptionEl);

    const itemLinkEl = itemEl.querySelector('link');
    post.link = getClearContent(itemLinkEl);

    posts.unshift(post);
  });

  return [feed, posts];
};
