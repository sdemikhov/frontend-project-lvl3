import i18n from 'i18next';

class ParserError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ParserError';
  }
}

const getClearContent = (element) => {
  if (element) {
    return element.textContent.trim();
  }
  return '';
};

export default (stringWithXML) => {
  const result = {};
  const parser = new window.DOMParser();
  const doc = parser.parseFromString(stringWithXML, 'application/xml');
  const channel = doc.querySelector('channel');

  if (!channel) {
    throw new ParserError(i18n.t('parseXML.error'));
  }

  const title = channel.querySelector('title');
  result.title = getClearContent(title);

  const description = channel.querySelector('description');
  result.description = getClearContent(description);

  result.items = [];

  const itemsEl = channel.querySelectorAll('item');
  itemsEl.forEach((item) => {
    const parsed = {};

    const itemTitleEl = item.querySelector('title');
    parsed.title = getClearContent(itemTitleEl);

    const itemDescriptionEl = item.querySelector('description');
    parsed.description = getClearContent(itemDescriptionEl);

    const itemLinkEl = item.querySelector('link');
    parsed.link = getClearContent(itemLinkEl);

    result.items.push(parsed);
  });

  return result;
};
