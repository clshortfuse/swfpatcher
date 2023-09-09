/**
 * @template T
 * @typedef {import('./index.js').TupleTree<T>} TupleTree<T>
 */

/**
 * @template T
 * @typedef {import('./index.js').TupleTreeEntry<T>} TupleTreeEntry<T>
 */

import {
  ATTRIBUTE_NODE_KEY, CDATA_NODE_KEY, CHARCODE_QUESTION, COMMENT_NODE_KEY, CONTENT_NODE_KEY,
} from './constants.js';

/**
 * @param {string|boolean|number} value
 * @return {string}
 */
function escapeContentValue(value) {
  return value.toString()
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll(']]>', ']]&gt;')
    .replaceAll('\'', '&apos;')
    .replaceAll('\b', '&#x8;')
    .replaceAll('\t', '&#x9;')
    .replaceAll('\n', '&#xa;')
    .replaceAll('\f', '&#xc;')
    .replaceAll('\r', '&#xd;');
}

/**
 * @param {string|boolean|number} value
 * @return {string}
 */
function escapeAttributeValue(value) {
  return value.toString()
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&apos;')
    .replaceAll('\b', '&#x8;')
    .replaceAll('\t', '&#x9;')
    .replaceAll('\n', '&#xa;')
    .replaceAll('\f', '&#xc;')
    .replaceAll('\r', '&#xd;');
}

/**
 * @param {string|boolean|number} value
 * @return {string}
 */
function escapeCommentValue(value) {
  return value.toString()
    .replaceAll('--', '-‐');
}

/**
 * @param {string} key
 * @param {any} value
 * @return {string}
 */
export function buildXMLFromObject(key, value) {
  /** @type [string, string][] */
  const attributes = [];
  /** @type [string, any][] */
  const childNodes = [];
  let textValue = null;
  switch (typeof value) {
    case 'symbol':
    case 'function':
      return '';
    case 'undefined':
      textValue = '';
      break;
    case 'object':
      if (value === null) {
        textValue = '';
        break;
      }
      if (Array.isArray(value)) {
        return value.map((arrayValue) => buildXMLFromObject(key, arrayValue)).join('');
      }
      if (value instanceof Date) {
        textValue = value.toISOString();
        break;
      }
      for (const [entryKey, entryValue] of Object.entries(value)) {
        switch (entryKey) {
          case CONTENT_NODE_KEY:
            textValue = entryValue;
            break;
          case ATTRIBUTE_NODE_KEY:
            if (entryValue instanceof Map) {
              attributes.push(...entryValue.entries());
            } else if (Array.isArray(entryValue)) {
              attributes.push(...entryValue);
            } else {
              attributes.push(...Object.entries(entryValue));
            }
            break;
          default:
            childNodes.push([entryKey, entryValue]);
        }
      }
      break;
    case 'string':
      textValue = value;
      break;
    case 'boolean':
    case 'number':
    case 'bigint':
    default:
      textValue = value.toString();
      break;
  }
  if (key) {
    if (key === COMMENT_NODE_KEY) {
      return `<!--${escapeCommentValue(value)}-->`;
    }
    if (key === CDATA_NODE_KEY) {
      return `<![CDATA[${value}]]>`;
    }
    const output = [
      '<', key,
      attributes.length ? ' ' : '',
      attributes.map(([attrName, attrValue]) => `${attrName}="${escapeAttributeValue(attrValue)}"`).join(' '),
    ];

    if (!childNodes.length && textValue == null) {
      // eslint-disable-next-line unicorn/prefer-code-point
      if (key.charCodeAt(0) === CHARCODE_QUESTION) {
        output.push('?');
      } else {
        output.push('/');
      }
      output.push('>');
    } else {
      output.push(
        '>',
        childNodes.map(([childKey, childValue]) => buildXMLFromObject(childKey, childValue)).join(''),
        textValue ? escapeContentValue(textValue) : '',
        '</',
        key,
        '>',
      );
    }
    return output.join('');
  }
  // Root
  return [
    childNodes.map(([childKey, childValue]) => buildXMLFromObject(childKey, childValue)).join(''),
  ].join('');
}

/**
 * @param {TupleTreeEntry<string>} entry
 * @return {string}
 */
function buildXMLFromEntry([key, value]) {
  /** @type {string[]} */
  switch (key) {
    case ATTRIBUTE_NODE_KEY:
      throw new Error('Invalid entry');
    case COMMENT_NODE_KEY:
      if (typeof value !== 'string') throw new Error('Content nodes must be strings.');
      return `<!--${escapeCommentValue(value)}-->`;
    case CDATA_NODE_KEY:
      if (typeof value !== 'string') throw new Error('Content nodes must be strings.');
      return `<![CDATA[${value}]]>`;
    case CONTENT_NODE_KEY:
      if (typeof value !== 'string') throw new Error('Content nodes must be strings.');
      return escapeContentValue(value);
    default:
  }
  if (typeof value === 'string') throw new Error('Child nodes must be tuples.');
  const output = [];
  output.push('<', key);
  let closed = false;
  let selfClosed = false;

  /**
   * @param {boolean} selfClose
   * @return {void}
   */
  function checkClose(selfClose = false) {
    if (closed) return;
    if (selfClose) {
      selfClosed = true;
      // eslint-disable-next-line unicorn/prefer-code-point
      if (key.charCodeAt(0) === CHARCODE_QUESTION) {
        output.push('?');
      } else {
        output.push('/');
      }
    }
    output.push('>');
    closed = true;
  }
  value.forEach(([childKey, childValue], index, array) => {
    switch (childKey) {
      case ATTRIBUTE_NODE_KEY:
        if (typeof childValue === 'string') throw new Error('Attributes must be tuples.');
        for (const [attrName, attrValue] of childValue) {
          output.push(' ', attrName, '="', escapeAttributeValue(/** @type {string} */ (attrValue)), '"');
        }
        checkClose(index === array.length - 1);
        break;
      default:
        checkClose();
        output.push(buildXMLFromEntry([childKey, childValue]));
    }
  });

  checkClose();
  if (!selfClosed) {
    output.push('</', key, '>');
  }
  return output.join('');
}

/**
 * @param {TupleTree<string>} entries
 * @return {string}
 */
export function buildXMLFromEntries(entries) {
  return entries.map((entry) => buildXMLFromEntry(entry)).join('');
}

/**
 * @param {Object|TupleTree<string>} input
 * @param {Object} [options]
 * @param {boolean} [options.header]
 * @param {boolean} [options.version="1.0"]
 * @return {string}
 */
export function buildXML(input, options = {}) {
  const result = (Array.isArray(input) ? buildXMLFromEntries(input) : buildXMLFromObject(null, input));
  if ((options.header !== false || options.version) && !result.startsWith('<?xml')) {
    return `<?xml version="${options.version || '1.0'}" encoding="utf-8"?>${result}`;
  }
  return result;
}
