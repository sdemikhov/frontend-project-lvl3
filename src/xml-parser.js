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
  const channel = doc.querySelector('channel');

  if (!channel) {
    const parserError = new Error();
    parserError.message = { ...parserError.message, localization: { key: 'parseXML.error' } };
    throw parserError;
  }

  const title = channel.querySelector('title');
  feed.title = getClearContent(title);

  const description = channel.querySelector('description');
  feed.description = getClearContent(description);

  const items = [];

  const itemsEl = channel.querySelectorAll('item');
  itemsEl.forEach((item) => {
    const parsed = {};

    const itemTitleEl = item.querySelector('title');
    parsed.title = getClearContent(itemTitleEl);

    const itemDescriptionEl = item.querySelector('description');
    parsed.description = getClearContent(itemDescriptionEl);

    const itemLinkEl = item.querySelector('link');
    parsed.link = getClearContent(itemLinkEl);

    items.unshift(parsed);
  });

  return [feed, items];
};
