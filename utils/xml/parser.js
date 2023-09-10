/* eslint-disable unicorn/prefer-code-point */

/** @see https://www.w3.org/TR/xml/ */

import {
  AS_ARRAY_KEY,
  AS_OBJECT_KEY,
  AS_STRING_KEY,
  ATTRIBUTE_NODE_KEY,
  CDATA_NODE_KEY,
  CHARCODE_QUESTION,
  COMMENT_NODE_KEY,
  CONTENT_NODE_KEY,
} from './constants.js';

/**
 * @template T
 * @typedef {import('./index.js').TupleTree<T>} TupleTree<T>
 */

/**
 * @template T
 * @typedef {import('./index.js').TupleTreeEntry<T>} TupleTreeEntry<T>
 */

/**
 * @template T
 * @typedef {import('./index.js').XMLObject<T>} XMLObject<T>
 */

const END_POSITION_SYMBOL = Symbol('EndPositionSymbol');

const STATE_BEGIN = Symbol('BEGIN');
const STATE_PROLOG_OR_ROOT_OPEN = Symbol('PROLOG_OR_ROOT_OPEN');
const STATE_MISC_WHITESPACE = Symbol('MISC_WHITESPACE');
const STATE_DOCTYPE_OR_MISC_OR_ROOT_OPEN = Symbol('DOCTYPE_OR_MISC_OR_ROOT_OPEN');
const STATE_XML_DECL_OPEN = Symbol('XML_DECL_OPEN');
const STATE_XML_DECL_CLOSER = Symbol('XML_DECL_CLOSER');
const STATE_NOTATION_OPEN = Symbol('NOTATION_OPEN');
const STATE_COMMENT_OPEN = Symbol('COMMENT_OPEN');
const STATE_COMMENT = Symbol('COMMENT');
const STATE_COMMENT_CARRIAGE_RETURN = Symbol('COMMENT_CARRIAGE_RETURN');
const STATE_COMMENT_HYPHEN = Symbol('COMMENT_HYPHEN');
const STATE_COMMENT_CLOSE = Symbol('COMMENT_CLOSE');
const STATE_START_TAG_OPEN = Symbol('START_TAG_OPEN');
const STATE_START_TAG_NAME = Symbol('START_TAG_NAME');
const STATE_START_TAG_WHITESPACE = Symbol('START_TAG_WHITESPACE');
const STATE_ATTRIBUTE_NAME = Symbol('ATTRIBUTE_NAME');
const STATE_ATTRIBUTE_EQUAL = Symbol('ATTRIBUTE_EQUAL');
const STATE_ATTRIBUTE_VALUE = Symbol('ATTRIBUTE_VALUE');
const STATE_ATTRIBUTE_VALUE_CLOSE = Symbol('ATTRIBUTE_VALUE_CLOSE');
const STATE_ATTRIBUTE_REFERENCE = Symbol('ATTRIBUTE_REFERENCE');
const STATE_ATTRIBUTE_CHAR_REFERENCE = Symbol('ATTRIBUTE_CHAR_REFERENCE');
const STATE_ATTRIBUTE_CHAR_REFERENCE_HEX = Symbol('ATTRIBUTE_CHAR_REFERENCE_HEX');
const STATE_ATTRIBUTE_CHAR_REFERENCE_DEC = Symbol('ATTRIBUTE_CHAR_REFERENCE_DEC');
const STATE_ATTRIBUTE_ENTITY_REFERENCE = Symbol('ATTRIBUTE_ENTITY_REFERENCE');
const STATE_SELF_CLOSING_TAG_CLOSER = Symbol('SELF_CLOSING_TAG_CLOSER');
const STATE_CONTENT = Symbol('CONTENT');
const STATE_CONTENT_CARRIAGE_RETURN = Symbol('CONTENT_CARRIAGE_RETURN');
const STATE_CONTENT_CDATA_SELECTION_CLOSE_1 = Symbol('CONTENT_CDATA_SELECTION_CLOSE_1');
const STATE_CONTENT_CDATA_SELECTION_CLOSE_2 = Symbol('CONTENT_CDATA_SELECTION_CLOSE_2');
const STATE_CONTENT_REFERENCE = Symbol('CONTENT_REFERENCE');
const STATE_CONTENT_CHAR_REFERENCE = Symbol('CONTENT_CHAR_REFERENCE');
const STATE_CONTENT_CHAR_REFERENCE_HEX = Symbol('CONTENT_CHAR_REFERENCE_HEX');
const STATE_CONTENT_CHAR_REFERENCE_DEC = Symbol('CONTENT_CHAR_REFERENCE_DEC');
const STATE_CONTENT_ENTITY_REFERENCE = Symbol('CONTENT_ENTITY_REFERENCE');
const STATE_CDATA_OPEN = Symbol('STATE_CDATA_OPEN');
const STATE_CDATA_C = Symbol('STATE_CDATA_C');
const STATE_CDATA_CD = Symbol('STATE_CDATA_CD');
const STATE_CDATA_CDA = Symbol('STATE_CDATA_CDA');
const STATE_CDATA_CDAT = Symbol('STATE_CDATA_CDAT');
const STATE_CDATA_CARRIAGE_RETURN = Symbol('STATE_CDATA_CARRIAGE_RETURN');
const STATE_CDATA_DATA_START = Symbol('STATE_CDATA_DATA_START');
const STATE_CDATA_DATA = Symbol('STATE_CDATA_DATA');
const STATE_CDATA_DATA_END = Symbol('STATE_CDATA_DATA_END');
const STATE_CDATA_CLOSE = Symbol('STATE_CDATA_CLOSE');
const STATE_UNKNOWN_TAG_OPEN = Symbol('UNKNOWN_TAG_OPEN');
const STATE_CHILD_NODE = Symbol('CHILD_NODE');
const STATE_END_TAG_OPEN = Symbol('END_TAG_OPEN');
const STATE_END_TAG_NAME = Symbol('END_TAG_NAME');
const STATE_END_TAG_WHITESPACE = Symbol('END_TAG_WHITESPACE');
const STATE_END_TAG_CLOSE = Symbol('END_TAG_CLOSE');

const NODE_TYPE_NONE = Symbol('NONE');
const NODE_TYPE_XML_DECL = Symbol('XML_DECL');
const NODE_TYPE_NOTATION_DECL = Symbol('NOTATION_DECL');
const NODE_TYPE_ROOT = Symbol('ROOT');
const NODE_TYPE_CHILD = Symbol('CHILD');

const CHARCODE_SPACE = ' '.charCodeAt(0);
const CHARCODE_HTAB = '\t'.charCodeAt(0);
const CHARCODE_CR = '\r'.charCodeAt(0);
const CHARCODE_LF = '\n'.charCodeAt(0);
const CHARCODE_COLON = ':'.charCodeAt(0);
const CHARCODE_UNDERSCORE = '_'.charCodeAt(0);
const CHARCODE_HYPHEN = '-'.charCodeAt(0);
const CHARCODE_PERIOD = '.'.charCodeAt(0);
const CHARCODE_MIDDLE_DOT = '·'.charCodeAt(0);
const CHARCODE_LESS_THAN = '<'.charCodeAt(0);
const CHARCODE_SLASH = '/'.charCodeAt(0);
const CHARCODE_BANG = '!'.charCodeAt(0);
const CHARCODE_GREATER_THAN = '>'.charCodeAt(0);
const CHARCODE_EQUALS = '='.charCodeAt(0);
const CHARCODE_DOUBLE_QUOTE = '"'.charCodeAt(0);
const CHARCODE_SINGLE_QUOTE = "'".charCodeAt(0);
const CHARCODE_AMP = '&'.charCodeAt(0);
const CHARCODE_HASH = '#'.charCodeAt(0);
const CHARCODE_SEMICOLON = ';'.charCodeAt(0);
const CHARCODE_LOWERCASE_X = 'x'.charCodeAt(0);
const CHARCODE_OPEN_BRACKET = '['.charCodeAt(0);
const CHARCODE_C = 'C'.charCodeAt(0);
const CHARCODE_D = 'D'.charCodeAt(0);
const CHARCODE_A = 'A'.charCodeAt(0);
const CHARCODE_T = 'T'.charCodeAt(0);
// const CHARCODE_A = 'T'.charCodeAt(0);
const CHARCODE_CLOSE_BRACKET = ']'.charCodeAt(0);

const NAME_START_RANGES = [
  ['A'.charCodeAt(0), 'Z'.charCodeAt(0)],
  ['a'.charCodeAt(0), 'z'.charCodeAt(0)],
  [0xC0, 0xD6],
  // 0xD7 ×
  [0xD8, 0xF6],
  // 0xF7 ÷
  [0xF8, 0x02_FF],
  [0x03_70, 0x03_7D],
  // 0x37E ;
  [0x03_7F, 0x1F_FF],
  [0x20_0C, 0x20_0D],
  [0x20_70, 0x21_8F],
  [0x2C_00, 0x2F_EF],
  [0x30_01, 0xD7_FF],
  [0xF9_00, 0xFD_CF],
  [0xFD_F0, 0xFF_FD],
  [0x01_00_00, 0x0E_FF_FF],
];

const NAME_RANGES = [
  ...NAME_START_RANGES,
  ['0'.charCodeAt(0), '9'.charCodeAt(0)],
  [0x03_00, 0x03_6F],
  [0x20_3F, 0x20_40],
];

const CHARACTER_RANGES = [
  [0x20, 0xD7_FF],
  [0xE0_00, 0xFF_FD],
  [0x01_00_00, 0x10_FF_FF],
];

const CHAR_REFERENCE_DEC_RANGES = [
  ['0'.charCodeAt(0), '9'.charCodeAt(0)],
];

const CHAR_REFERENCE_HEX_RANGES = [
  ['0'.charCodeAt(0), '9'.charCodeAt(0)],
  ['a'.charCodeAt(0), 'f'.charCodeAt(0)],
  ['A'.charCodeAt(0), 'F'.charCodeAt(0)],
];

const PREDEFINED_ENTITIES = new Map([
  ['amp', '&'],
  ['lt', '<'],
  ['gt', '>'],
  ['apos', "'"],
  ['quot', '"'],
]);

/**
 * @param {number} reference
 * @return {string}
 */
function parseCharReference(reference) {
  if (reference > 0xFF_FF) {
    return String.fromCharCode(
      Math.floor((reference - 0x01_00_00) / 0x04_00) + 0xD8_00,
      ((reference - 0x01_00_00) % 0x04_00) + 0xDC_00,
    );
  }
  if (reference >= 0) {
    return String.fromCharCode(reference);
  }
  throw new Error(`Invalid CharRef (${reference})`);
}

/**
 * @param {string} [entity]
 * @param {Map<string,string>} [declaredEntities]
 * @return {string}
 */
function parseEntityReference(entity, declaredEntities) {
  if (declaredEntities?.has(entity)) {
    return declaredEntities.get(entity);
  }
  if (PREDEFINED_ENTITIES.has(entity)) {
    return PREDEFINED_ENTITIES.get(entity);
  }
  throw new Error(`Unknown entity: ${entity}`);
}

/**
 * @param {string} input
 * @param {Object} options
 * @param {number} [options.index=0]
 * @param {number} [options.charCode]
 * @param {Symbol} [options.nodeType]
 * @param {boolean} [options.enforceUniqueAttributes=true]
 * @param {boolean} [options.enforceEntityDeclared=true]
 * @return {TupleTreeEntry<string>}
 */
function parseXMLNode(input, options = {}) {
  /** @type {Symbol} */
  let state;
  switch (options.nodeType) {
    default:
    case NODE_TYPE_NONE:
      state = STATE_BEGIN;
      break;
    case NODE_TYPE_XML_DECL:
      state = STATE_XML_DECL_OPEN;
      break;
    case NODE_TYPE_NOTATION_DECL:
      state = STATE_NOTATION_OPEN;
      break;
    case NODE_TYPE_ROOT:
    case NODE_TYPE_CHILD:
      state = STATE_START_TAG_OPEN;
  }
  /** @type {TupleTree<string>} */
  const children = [];
  /** @type {string} */
  let stringReturnValue;
  /** @type {string} */
  let tagName;
  /** @type {string} */
  let attrName;
  /** @type {string} */
  let attrValue;
  /** @type {number} */
  let attrValueDelimiter;
  /** @type {number} */
  let reference;
  /** @type {string} */
  let entity;
  /** @type {string} */
  let content;
  /** @type {string} */
  let comment;
  /** @type {string} */
  let cdata;
  /** @type {TupleTreeEntry<string>} */
  let childNode;
  // TODO: Add declared entities support
  const declaredEntities = new Map();
  let index = options.index ?? 0;
  let charCode = options.charCode ?? input.charCodeAt(index);
  let stringStartIndex = index;
  /** @type {string} */
  let xmlSpace;
  /** @type {Set<string>} */
  const attributeNames = new Set();
  /** @type {[string,string][]} */
  const attributes = [];
  let hasContent = false;

  let selfClosing = false;
  // let previousState = state;

  /**
   * @param {string} key
   * @param {string|TupleTree<string>} value
   * @return {void}
   */
  function addChild(key, value) {
    children.push([key, value]);
  }

  const resetContent = () => {
    hasContent = false;
    content = '';
  };

  const onContentEnd = () => {
    content += input.slice(stringStartIndex, index);
    if (hasContent || xmlSpace === 'preserve') {
      addChild(CONTENT_NODE_KEY, content);
    } else if (content.length > 0) {
      addChild(CONTENT_NODE_KEY, ' ');
    }
  };

  /**
   * @param {number[][]} ranges
   * @return {void}
   */
  const assertCharCodeRange = (ranges) => {
    if (!ranges.some(([min, max]) => charCode >= min && charCode <= max)) {
      throw new Error(`Invalid character ${(input[index])} at ${index}.`);
    }
  };

  const onCommentCharCode = () => {
    switch (charCode) {
      case CHARCODE_HYPHEN:
        state = STATE_COMMENT_HYPHEN;
        break;
      case CHARCODE_CR:
        content += input.slice(stringStartIndex, index);
        state = STATE_COMMENT_CARRIAGE_RETURN;
        break;
      default:
        assertCharCodeRange(CHARACTER_RANGES);
        // Fallthrough
      case CHARCODE_HTAB:
      case CHARCODE_LF:
        state = STATE_COMMENT;
    }
  };

  const onCDataCharCode = () => {
    switch (charCode) {
      case CHARCODE_CLOSE_BRACKET:
        state = STATE_CDATA_CLOSE;
        break;
      case CHARCODE_CR:
        cdata += input.slice(stringStartIndex, index);
        state = STATE_CDATA_CARRIAGE_RETURN;
        break;
      default:
        assertCharCodeRange(CHARACTER_RANGES);
        // Fallthrough
      case CHARCODE_HTAB:
      case CHARCODE_LF:
        state = STATE_CDATA_DATA;
    }
  };

  const onContentCharCode = () => {
    switch (charCode) {
      case CHARCODE_LESS_THAN:
        onContentEnd();
        state = STATE_UNKNOWN_TAG_OPEN;
        break;
      case CHARCODE_CR:
        content += input.slice(stringStartIndex, index);
        state = STATE_CONTENT_CARRIAGE_RETURN;
        break;
      case CHARCODE_SPACE: case CHARCODE_HTAB: case CHARCODE_LF:
        break;
      case CHARCODE_CLOSE_BRACKET:
        state = STATE_CONTENT_CDATA_SELECTION_CLOSE_1;
        hasContent = true;
        break;
      case CHARCODE_AMP:
        content += input.slice(stringStartIndex, index);
        state = STATE_CONTENT_REFERENCE;
        // Fallthrough
      default:
        hasContent = true;
    }
  };

  /**
   * @param {Symbol} nodeType
   * @return {void}
   */
  const onTagOpen = (nodeType) => {
    // console.log('onTagOpen', nodeType.description);
    switch (charCode) {
      case CHARCODE_SLASH:
        state = STATE_END_TAG_OPEN;
        break;
      default:
        state = STATE_CHILD_NODE;
        childNode = parseXMLNode(input, { index, charCode, nodeType });
        if (nodeType === NODE_TYPE_XML_DECL && childNode[0] !== '?xml') {
          throw new Error('Unknown declaration type');
        }
        // @ts-ignore Hidden Symbol
        index = childNode[END_POSITION_SYMBOL];
        stringStartIndex = index + 1;
        resetContent();
        // @ts-ignore Hidden Symbol
        delete childNode[END_POSITION_SYMBOL];
        children.push(childNode);
        state = options.nodeType === NODE_TYPE_CHILD ? STATE_CONTENT : STATE_MISC_WHITESPACE;
    }
  };

  // const logState = () => {
  //   console.log(
  //     index,
  //     String.fromCharCode(charCode),
  //     previousState.description,
  //     '=>',
  //     state.description,
  //     String.fromCharCode(charCode),
  //   );
  // };

  const getUnexpectedCharacterError = () => new Error(`Invalid character ${(input[index])} at ${index}.`);

  const buildReturnValue = () => {
    /** @type {TupleTreeEntry<string>} */
    let tuple;
    if (stringReturnValue == null) {
      /** @type {TupleTree<string>} */
      const entries = [];
      if (attributes.length) {
        entries.push([ATTRIBUTE_NODE_KEY, attributes]);
      }
      if (children.length) {
        entries.push(...children);
      } else if (!selfClosing) {
        entries.push([CONTENT_NODE_KEY, '']);
      }
      tuple = [tagName, entries];
    } else {
      tuple = [tagName, stringReturnValue];
    }
    Object.defineProperty(tuple, END_POSITION_SYMBOL, {
      enumerable: false, configurable: true, value: index, writable: false,
    });
    return tuple;
  };

  while (Number.isNaN(charCode) === false) {
    switch (state) {
      case STATE_BEGIN:
        switch (charCode) {
          case CHARCODE_LESS_THAN:
            state = STATE_PROLOG_OR_ROOT_OPEN;
            break;
          case CHARCODE_SPACE: case CHARCODE_CR: case CHARCODE_HTAB: case CHARCODE_LF:
            state = STATE_MISC_WHITESPACE;
            break;
          default:
            throw getUnexpectedCharacterError();
        }
        break;
      case STATE_PROLOG_OR_ROOT_OPEN:
        switch (charCode) {
          case CHARCODE_QUESTION:
            onTagOpen(NODE_TYPE_XML_DECL);
            break;
          case CHARCODE_BANG:
            onTagOpen(NODE_TYPE_NOTATION_DECL);
            break;
          default:
            onTagOpen(NODE_TYPE_CHILD);
        }
        break;
      case STATE_MISC_WHITESPACE:
        switch (charCode) {
          case CHARCODE_SPACE: case CHARCODE_CR: case CHARCODE_HTAB: case CHARCODE_LF:
            state = STATE_MISC_WHITESPACE;
            break;
          case CHARCODE_LESS_THAN:
            state = STATE_DOCTYPE_OR_MISC_OR_ROOT_OPEN;
            break;
          default:
            throw getUnexpectedCharacterError();
        }
        break;
      case STATE_XML_DECL_OPEN:
      case STATE_NOTATION_OPEN:
        state = STATE_START_TAG_OPEN;
        break;
      case STATE_XML_DECL_CLOSER:
        if (charCode !== CHARCODE_GREATER_THAN) {
          throw getUnexpectedCharacterError();
        }
        selfClosing = true;
        state = STATE_END_TAG_CLOSE;
        break;
      case STATE_COMMENT_OPEN:
        if (charCode !== CHARCODE_HYPHEN) {
          throw getUnexpectedCharacterError();
        }
        comment = '';
        stringStartIndex = index + 1;
        state = STATE_COMMENT;
        break;
      case STATE_COMMENT:
        onCommentCharCode();
        break;
      case STATE_COMMENT_CARRIAGE_RETURN:
        switch (charCode) {
          default:
            content += '\n';
            // Fallthrough
          case CHARCODE_LF:
            stringStartIndex = index;
            onCommentCharCode();
            break;
        }
        break;
      case STATE_COMMENT_HYPHEN:
        if (charCode === CHARCODE_HYPHEN) {
          comment += input.slice(stringStartIndex, index - 1);
          state = STATE_COMMENT_CLOSE;
          break;
        }
        onCommentCharCode();
        break;
      case STATE_COMMENT_CLOSE:
        if (charCode !== CHARCODE_GREATER_THAN) {
          throw getUnexpectedCharacterError();
        }
        tagName = COMMENT_NODE_KEY;
        stringReturnValue = comment;
        state = STATE_END_TAG_CLOSE;
        break;
      case STATE_START_TAG_OPEN:
        switch (charCode) {
          case CHARCODE_OPEN_BRACKET:
            if (options.nodeType !== NODE_TYPE_NOTATION_DECL) {
              throw new Error(`Invalid character ${(input[index])} at ${index}.`);
            }
            state = STATE_CDATA_OPEN;
            break;
          case CHARCODE_HYPHEN:
            if (options.nodeType !== NODE_TYPE_NOTATION_DECL) {
              throw new Error(`Invalid character ${(input[index])} at ${index}.`);
            }
            state = STATE_COMMENT_OPEN;
            break;
          default:
            assertCharCodeRange(NAME_START_RANGES);
            // Fallthrough
          case CHARCODE_COLON: case CHARCODE_UNDERSCORE:
            state = STATE_START_TAG_NAME;
        }
        break;
      case STATE_START_TAG_NAME:
        switch (charCode) {
          default:
            assertCharCodeRange(NAME_RANGES);
            // Fallthrough
          case CHARCODE_COLON: case CHARCODE_UNDERSCORE:
          case CHARCODE_HYPHEN: case CHARCODE_PERIOD: case CHARCODE_MIDDLE_DOT:
            break;
          case CHARCODE_SPACE: case CHARCODE_CR: case CHARCODE_HTAB: case CHARCODE_LF:
            tagName = input.slice(stringStartIndex, index);
            state = STATE_START_TAG_WHITESPACE;
            break;
          case CHARCODE_SLASH:
            if (options.nodeType === NODE_TYPE_CHILD) {
              tagName = input.slice(stringStartIndex, index);
              state = STATE_SELF_CLOSING_TAG_CLOSER;
            } else {
              throw getUnexpectedCharacterError();
            }
            break;
          case CHARCODE_GREATER_THAN:
            tagName = input.slice(stringStartIndex, index);
            switch (options.nodeType) {
              case NODE_TYPE_CHILD:
                stringStartIndex = index + 1;
                resetContent();
                state = STATE_CONTENT;
                break;
              case NODE_TYPE_NOTATION_DECL:
                state = STATE_END_TAG_CLOSE;
                break;
              default:
                throw getUnexpectedCharacterError();
            }
            break;
        }
        break;
      case STATE_ATTRIBUTE_VALUE_CLOSE:
        switch (charCode) {
          case CHARCODE_QUESTION:
            if (options.nodeType === NODE_TYPE_XML_DECL) {
              state = STATE_XML_DECL_CLOSER;
              break;
            }
            // Fallthrough
          default:
            throw getUnexpectedCharacterError();
          case CHARCODE_SPACE: case CHARCODE_CR: case CHARCODE_HTAB: case CHARCODE_LF:
            state = STATE_START_TAG_WHITESPACE;
            break;
          case CHARCODE_SLASH:
            if (options.nodeType === NODE_TYPE_CHILD) {
              state = STATE_SELF_CLOSING_TAG_CLOSER;
            } else {
              throw getUnexpectedCharacterError();
            }
            break;
          case CHARCODE_GREATER_THAN:
            switch (options.nodeType) {
              case NODE_TYPE_CHILD:
                stringStartIndex = index + 1;
                resetContent();
                state = STATE_CONTENT;
                break;
              case NODE_TYPE_NOTATION_DECL:
                state = STATE_END_TAG_CLOSE;
                break;
              default:
                throw getUnexpectedCharacterError();
            }
            break;
        }
        break;
      case STATE_START_TAG_WHITESPACE:
        switch (charCode) {
          case CHARCODE_SPACE: case CHARCODE_CR: case CHARCODE_HTAB: case CHARCODE_LF:
            state = STATE_START_TAG_WHITESPACE;
            break;
          case CHARCODE_QUESTION:
            if (options.nodeType === NODE_TYPE_XML_DECL) {
              state = STATE_XML_DECL_CLOSER;
            } else {
              throw getUnexpectedCharacterError();
            }
            break;
          case CHARCODE_SLASH:
            if (options.nodeType === NODE_TYPE_CHILD) {
              state = STATE_SELF_CLOSING_TAG_CLOSER;
            } else {
              throw getUnexpectedCharacterError();
            }
            break;
          case CHARCODE_GREATER_THAN:
            switch (options.nodeType) {
              case NODE_TYPE_CHILD:
                stringStartIndex = index + 1;
                resetContent();
                state = STATE_CONTENT;
                break;
              case NODE_TYPE_NOTATION_DECL:
                state = STATE_END_TAG_CLOSE;
                break;
              default:
                throw getUnexpectedCharacterError();
            }
            break;
          default:
            assertCharCodeRange(NAME_START_RANGES);
            // Fallthrough
          case CHARCODE_COLON: case CHARCODE_UNDERSCORE:
            stringStartIndex = index;
            state = STATE_ATTRIBUTE_NAME;
        }
        break;
      case STATE_ATTRIBUTE_NAME:
        switch (charCode) {
          default:
            assertCharCodeRange(NAME_RANGES);
            // Fallthrough
          case CHARCODE_COLON: case CHARCODE_UNDERSCORE:
          case CHARCODE_HYPHEN: case CHARCODE_PERIOD: case CHARCODE_MIDDLE_DOT:
            break;
          case CHARCODE_EQUALS:
            attrName = input.slice(stringStartIndex, index);
            if (options.enforceUniqueAttributes !== false && attributeNames.has(attrName)) {
              throw new Error(`Attribute name (${attrName}) must be unique at ${index}.`);
            }
            attributeNames.add(attrName);
            state = STATE_ATTRIBUTE_EQUAL;
            break;
        }
        break;
      case STATE_ATTRIBUTE_EQUAL:
        switch (charCode) {
          case CHARCODE_SINGLE_QUOTE:
          case CHARCODE_DOUBLE_QUOTE:
            attrValueDelimiter = charCode;
            state = STATE_ATTRIBUTE_VALUE;
            stringStartIndex = index + 1;
            attrValue = '';
            break;
          default:
            throw getUnexpectedCharacterError();
        }
        break;
      case STATE_ATTRIBUTE_VALUE:
        switch (charCode) {
          case attrValueDelimiter:
            attrValue += input.slice(stringStartIndex, index);
            attributes.push([attrName, attrValue]);
            if (attrName === 'xml:space') xmlSpace = attrValue;
            state = STATE_ATTRIBUTE_VALUE_CLOSE;
            break;
          case CHARCODE_LESS_THAN:
            throw getUnexpectedCharacterError();
          case CHARCODE_AMP:
            attrValue += input.slice(stringStartIndex, index);
            state = STATE_ATTRIBUTE_REFERENCE;
            break;
          default:
        }
        break;
      case STATE_ATTRIBUTE_REFERENCE:
        switch (charCode) {
          case CHARCODE_HASH:
            state = STATE_ATTRIBUTE_CHAR_REFERENCE;
            break;
          default:
            assertCharCodeRange(NAME_START_RANGES);
            // Fallthrough
          case CHARCODE_COLON: case CHARCODE_UNDERSCORE:
            stringStartIndex = index;
            state = STATE_ATTRIBUTE_ENTITY_REFERENCE;
        }
        break;
      case STATE_ATTRIBUTE_ENTITY_REFERENCE:
        switch (charCode) {
          case CHARCODE_SEMICOLON:
            entity = parseEntityReference(input.slice(stringStartIndex, index), declaredEntities);
            attrValue += entity;
            state = STATE_ATTRIBUTE_VALUE;
            stringStartIndex = index + 1;
            break;
          default:
            assertCharCodeRange(NAME_RANGES);
            // Fallthrough
          case CHARCODE_COLON: case CHARCODE_UNDERSCORE:
          case CHARCODE_HYPHEN: case CHARCODE_PERIOD: case CHARCODE_MIDDLE_DOT:
        }
        break;
      case STATE_ATTRIBUTE_CHAR_REFERENCE:
        switch (charCode) {
          case CHARCODE_LOWERCASE_X:
            stringStartIndex = index + 1;
            state = STATE_ATTRIBUTE_CHAR_REFERENCE_HEX;
            break;
          default:
            assertCharCodeRange(CHAR_REFERENCE_DEC_RANGES);
            stringStartIndex = index;
            state = STATE_ATTRIBUTE_CHAR_REFERENCE_DEC;
        }
        break;
      case STATE_ATTRIBUTE_CHAR_REFERENCE_DEC:
        switch (charCode) {
          case CHARCODE_SEMICOLON:
            reference = Number.parseInt(input.slice(stringStartIndex, index), 10);
            attrValue += parseCharReference(reference);
            stringStartIndex = index + 1;
            state = STATE_ATTRIBUTE_VALUE;
            break;
          default:
            assertCharCodeRange(CHAR_REFERENCE_DEC_RANGES);
        }
        break;
      case STATE_ATTRIBUTE_CHAR_REFERENCE_HEX:
        switch (charCode) {
          case CHARCODE_SEMICOLON:
            reference = Number.parseInt(input.slice(stringStartIndex, index), 16);
            attrValue += parseCharReference(reference);
            stringStartIndex = index + 1;
            state = STATE_ATTRIBUTE_VALUE;
            break;
          default:
            assertCharCodeRange(CHAR_REFERENCE_HEX_RANGES);
        }
        break;
      case STATE_SELF_CLOSING_TAG_CLOSER:
        if (charCode !== CHARCODE_GREATER_THAN) {
          throw getUnexpectedCharacterError();
        }
        selfClosing = true;
        state = STATE_END_TAG_CLOSE;
        break;
      case STATE_CONTENT_CARRIAGE_RETURN:
        switch (charCode) {
          default:
            content += '\n';
            // Fallthrough
          case CHARCODE_LF:
            stringStartIndex = index;
            onContentCharCode();
            break;
        }
        break;
      case STATE_CONTENT_CDATA_SELECTION_CLOSE_2:
        if (charCode === CHARCODE_GREATER_THAN) throw getUnexpectedCharacterError();
        // Fallthrough
      case STATE_CONTENT_CDATA_SELECTION_CLOSE_1:
        if (charCode === CHARCODE_CLOSE_BRACKET) {
          state = STATE_CONTENT_CDATA_SELECTION_CLOSE_2;
          hasContent = true;
          break;
        }
        // Fallthrough
      case STATE_CONTENT:
        onContentCharCode();
        break;
      case STATE_CONTENT_REFERENCE:
        switch (charCode) {
          case CHARCODE_HASH:
            state = STATE_CONTENT_CHAR_REFERENCE;
            break;
          default:
            assertCharCodeRange(NAME_START_RANGES);
            // Fallthrough
          case CHARCODE_COLON: case CHARCODE_UNDERSCORE:
            stringStartIndex = index;
            state = STATE_CONTENT_ENTITY_REFERENCE;
        }
        break;
      case STATE_CONTENT_ENTITY_REFERENCE:
        switch (charCode) {
          case CHARCODE_SEMICOLON:
            entity = parseEntityReference(input.slice(stringStartIndex, index), declaredEntities);
            content += entity;
            hasContent = true;
            stringStartIndex = index + 1;
            state = STATE_CONTENT;
            break;
          default:
            assertCharCodeRange(NAME_RANGES);
            // Fallthrough
          case CHARCODE_COLON: case CHARCODE_UNDERSCORE:
          case CHARCODE_HYPHEN: case CHARCODE_PERIOD: case CHARCODE_MIDDLE_DOT:
        }
        break;
      case STATE_CONTENT_CHAR_REFERENCE:
        switch (charCode) {
          case CHARCODE_LOWERCASE_X:
            stringStartIndex = index + 1;
            state = STATE_CONTENT_CHAR_REFERENCE_HEX;
            break;
          default:
            assertCharCodeRange(CHAR_REFERENCE_DEC_RANGES);
            stringStartIndex = index;
            state = STATE_CONTENT_CHAR_REFERENCE_DEC;
        }
        break;
      case STATE_CONTENT_CHAR_REFERENCE_DEC:
        switch (charCode) {
          case CHARCODE_SEMICOLON:
            reference = Number.parseInt(input.slice(stringStartIndex, index), 10);
            content += parseCharReference(reference);
            hasContent = true;
            stringStartIndex = index + 1;
            state = STATE_CONTENT;
            break;
          default:
            assertCharCodeRange(CHAR_REFERENCE_DEC_RANGES);
        }
        break;
      case STATE_CONTENT_CHAR_REFERENCE_HEX:
        switch (charCode) {
          case CHARCODE_SEMICOLON:
            reference = Number.parseInt(input.slice(stringStartIndex, index), 16);
            content += parseCharReference(reference);
            hasContent = true;
            stringStartIndex = index + 1;
            state = STATE_CONTENT;
            break;
          default:
            assertCharCodeRange(CHAR_REFERENCE_HEX_RANGES);
        }
        break;
      case STATE_DOCTYPE_OR_MISC_OR_ROOT_OPEN:
      case STATE_UNKNOWN_TAG_OPEN:
        switch (charCode) {
          case CHARCODE_SLASH:
            state = STATE_END_TAG_OPEN;
            break;
          case CHARCODE_BANG:
            onTagOpen(NODE_TYPE_NOTATION_DECL);
            break;
          default:
            onTagOpen(NODE_TYPE_CHILD);
        }
        break;
      case STATE_END_TAG_OPEN:
        switch (charCode) {
          default:
            assertCharCodeRange(NAME_START_RANGES);
            // Fallthrough
          case CHARCODE_COLON: case CHARCODE_UNDERSCORE:
            stringStartIndex = index;
            state = STATE_END_TAG_NAME;
        }
        break;
      case STATE_END_TAG_NAME:
        switch (charCode) {
          default:
            assertCharCodeRange(NAME_RANGES);
            // Fallthrough
          case CHARCODE_COLON: case CHARCODE_UNDERSCORE:
          case CHARCODE_HYPHEN: case CHARCODE_PERIOD: case CHARCODE_MIDDLE_DOT:
            break;
          case CHARCODE_SPACE: case CHARCODE_CR: case CHARCODE_HTAB: case CHARCODE_LF:
            if (input.slice(stringStartIndex, index) !== tagName) {
              throw new Error(`Element was not closed (${tagName}) at ${index}.`);
            }
            state = STATE_END_TAG_WHITESPACE;
            break;
          case CHARCODE_GREATER_THAN:
            if (input.slice(stringStartIndex, index) !== tagName) {
              throw new Error(`Element was not closed (${tagName}) at ${index}.`);
            }
            state = STATE_END_TAG_CLOSE;
        }
        break;
      case STATE_END_TAG_WHITESPACE:
        switch (charCode) {
          case CHARCODE_SPACE: case CHARCODE_CR: case CHARCODE_HTAB: case CHARCODE_LF:
            break;
          case CHARCODE_GREATER_THAN:
            state = STATE_END_TAG_CLOSE;
            break;
          default:
            throw getUnexpectedCharacterError();
        }
        break;
      case STATE_CDATA_OPEN:
        if (charCode !== CHARCODE_C) throw getUnexpectedCharacterError();
        state = STATE_CDATA_C;
        break;
      case STATE_CDATA_C:
        if (charCode !== CHARCODE_D) throw getUnexpectedCharacterError();
        state = STATE_CDATA_CD;
        break;
      case STATE_CDATA_CD:
        if (charCode !== CHARCODE_A) throw getUnexpectedCharacterError();
        state = STATE_CDATA_CDA;
        break;
      case STATE_CDATA_CDA:
        if (charCode !== CHARCODE_T) throw getUnexpectedCharacterError();
        state = STATE_CDATA_CDAT;
        break;
      case STATE_CDATA_CDAT:
        if (charCode !== CHARCODE_A) throw getUnexpectedCharacterError();
        state = STATE_CDATA_DATA_START;
        break;
      case STATE_CDATA_DATA_START:
        if (charCode !== CHARCODE_OPEN_BRACKET) throw getUnexpectedCharacterError();
        cdata = '';
        stringStartIndex = index + 1;
        state = STATE_CDATA_DATA;
        break;
      case STATE_CDATA_DATA:
        onCDataCharCode();
        break;
      case STATE_CDATA_CARRIAGE_RETURN:
        switch (charCode) {
          default:
            cdata += '\n';
            // Fallthrough
          case CHARCODE_LF:
            stringStartIndex = index;
            onCDataCharCode();
            break;
        }
        break;
      case STATE_CDATA_DATA_END:
        if (charCode === CHARCODE_CLOSE_BRACKET) {
          state = STATE_CDATA_CLOSE;
        } else {
          onCDataCharCode();
        }
        break;
      case STATE_CDATA_CLOSE:
        if (charCode === CHARCODE_GREATER_THAN) {
          tagName = CDATA_NODE_KEY;
          cdata += input.slice(stringStartIndex, index - 2);
          stringReturnValue = cdata;
          state = STATE_END_TAG_CLOSE;
        } else {
          onCDataCharCode();
        }
        break;
      default:
    }

    // logState();
    // previousState = state;

    if (state === STATE_END_TAG_CLOSE) {
      // console.log('close', input.slice(options.index, index).replace(/\n/g, '\\n').slice(0, 60));
      return buildReturnValue();
    }
    index += 1;
    charCode = input.charCodeAt(index);
  }
  switch (state) {
    case STATE_CONTENT:
      if (options.nodeType === NODE_TYPE_CHILD) break;
      // Fallthrough
    case STATE_END_TAG_CLOSE:
    case STATE_MISC_WHITESPACE:
      return buildReturnValue();
    default:
  }
  throw new Error('EOF');
}

/**
 * @typedef {Object} ParseXMLFlattenOptions
 * @prop {boolean} [flattenContent=true]
 * @prop {boolean} [flattenArrays=true]
 * @prop {boolean} [mergeContentNodes=true]
 * @prop {boolean} [skipAttributes=false]
 * @prop {boolean} [removeNamespaces=false]
 */

/**
 * @param {TupleTree<string>} parsedXML
 * @param {ParseXMLFlattenOptions} [options]
 * @return {XMLObject<unknown>}
 */
export function flattenParsedXML(parsedXML, options = {}) {
  if (!parsedXML.length) return;
  /** @type {any} */
  const result = {};
  Object.defineProperty(result, AS_ARRAY_KEY, {
    enumerable: false, configurable: true, value: {}, writable: false,
  });
  Object.defineProperty(result, AS_OBJECT_KEY, {
    enumerable: false, configurable: true, value: {}, writable: false,
  });
  Object.defineProperty(result, AS_STRING_KEY, {
    enumerable: false, configurable: true, value: {}, writable: false,
  });
  for (const [key, value] of parsedXML) {
    if (key === ATTRIBUTE_NODE_KEY) {
      if (!options.skipAttributes) {
        if (options.removeNamespaces) {
          result[key] = Object.fromEntries(/** @type {[string,string][]} */ (value)
            .map(([attrKey, attrValue]) => [attrKey.replace(/^[^:]*:/, ''), attrValue]));
        } else {
          result[key] = Object.fromEntries(/** @type {[string,string][]} */ (value));
        }
      }
      continue;
    }
    let outKey;
    if (key === CDATA_NODE_KEY) {
      outKey = CONTENT_NODE_KEY;
    } else if (options.removeNamespaces) {
      outKey = key.replace(/^[^:]*:/, '');
    } else {
      outKey = key;
    }

    let flattenedValue;
    let typeofFlattenedValue = 'string';
    if (typeof value === 'string') {
      flattenedValue = value;
    } else {
      flattenedValue = flattenParsedXML(value, options);
      typeofFlattenedValue = typeof flattenedValue;
      if (typeofFlattenedValue === 'undefined') {
        if (outKey in result === false) {
          result[outKey] = options.flattenArrays
            ? null
            : [];
        }
        continue;
      }
    }
    if (outKey in result === false) {
      result[AS_ARRAY_KEY][outKey] = [flattenedValue];
      if (typeofFlattenedValue === 'string') {
        result[AS_OBJECT_KEY][outKey] = { $: flattenedValue };
        result[AS_STRING_KEY][outKey] = flattenedValue;
      } else {
        result[AS_OBJECT_KEY][outKey] = flattenedValue;
      }
      result[outKey] = options.flattenArrays === false
        ? [flattenedValue]
        : flattenedValue;
    } else {
      result[AS_ARRAY_KEY][outKey].push(flattenedValue);
      if (options.flattenArrays !== false && !Array.isArray(result[outKey])) {
        result[outKey] = [result[outKey], flattenedValue];
      } else {
        result[outKey].push(flattenedValue);
      }
    }
  }
  if (options.mergeContentNodes !== false && Array.isArray(result[CONTENT_NODE_KEY])) {
    result[CONTENT_NODE_KEY] = result[CONTENT_NODE_KEY].join('');
  }
  if (options.flattenContent !== false && CONTENT_NODE_KEY in result && Object.keys(result).length === 1) {
    return result[CONTENT_NODE_KEY];
  }
  return result;
}

/**
 * @template {unknown} T
 * @template {string} [T2=string]
 * @typedef {{
 *  '$tag': string,
 *  '$raw': [string, TupleTree<string>],
 *  '$attributes': Record<T2, string>,
 *  '$text': string,
 *  '$array': XMLProxy<unknown>[],
 *  [Symbol.iterator]() : Iterator<XMLProxy<T>>
 * } & {
 *  [K in keyof any & string]: XMLProxy<unknown>
 * }} XMLProxy
 */

/**
 * Return a Proxy for XML entries
 * Nodes can be iterated as well as
 * Proxy performance is likely lower than tuples or objects, but allows dynamic
 * reconfiguration of an XML structure.
 * @template {unknown} T
 * @param {[string, TupleTree<string>]} parsedXML
 * @return {XMLProxy<T>}
 */
export function createXMLProxy(parsedXML) {
  if (!parsedXML?.length) throw new Error(`Invalid input: ${parsedXML}`);
  const cacheValid = false;
  /** @type {Map<string|symbol, boolean>} */
  let hasCache;

  /** @type {Map<string, number>} */
  const keyCount = new Map();

  /** @type {WeakMap<Object, Object>} */
  let parsedTupleCache;

  /** @type {string|null|undefined} */
  let textCache;

  const [tagName, tuples] = parsedXML;

  /**
   * @param {[string, TupleTree<string>]} tuple
   * @return {Object}
   */
  const getProxyForTuple = (tuple) => {
    parsedTupleCache ??= new WeakMap();
    if (parsedTupleCache.has(tuple)) {
      return parsedTupleCache.get(tuple);
    }
    const parsedTuple = createXMLProxy(tuple);
    parsedTupleCache.set(tuple, parsedTuple);
    return parsedTuple;
  };

  /** @type {[string, [string,string][]]} */
  let attributeTuple = tuples.find(([key]) => key === '$$');

  /** @type {Record<string,string>} */
  const attributes = attributeTuple ? Object.fromEntries(attributeTuple[1]) : {};

  /** @type {Record<string, string>} */
  const attributeProxy = new Proxy(attributes, {
    set(target, property, value) {
      let parsedValue;
      if (typeof value === 'string') {
        parsedValue = value;
      } else {
        if (value == null) {
          this.deleteProperty(target, property);
          return true;
        }
        parsedValue = `${value}`;
      }
      target[property] = parsedValue;
      if (!attributeTuple) {
        attributeTuple = ['$$', []];
        tuples.unshift(attributeTuple);
      }
      attributeTuple[1] = Object.entries(attributes);

      return true;
    },
    deleteProperty(target, property) {
      if (Reflect.deleteProperty(target, property)) {
        if (attributeTuple) {
          attributeTuple[1] = Object.entries(attributes);
        }
        return true;
      }
      return false;
    },
  });

  const arrayProxy = new Proxy(tuples, {
    get(target, property) {
      const internal = target[property];
      if (typeof property === 'string' && !Number.isNaN(Number.parseInt(property, 10))) {
        return getProxyForTuple(internal);
      }
      return internal;
    },
    set(target, property, value, receiver) {
      if (typeof property === 'string' && !Number.isNaN(Number.parseInt(property, 10))) {
        if (value == null) {
          throw new TypeError('Nulling array values is not supported.');
        }
        const { $raw } = value;
        if (!$raw) {
          throw new TypeError('Invalid array value');
        }
        const previous = target[property];
        if (previous === $raw) return true;
        // Noop
        const [currentKey] = $raw[0];
        if (previous) {
          const [previousKey] = previous;
          if (previousKey !== currentKey) {
            keyCount.set(previousKey, Math.max(keyCount.get(previousKey) - 1, 0));
            keyCount.set(currentKey, keyCount.get(currentKey) + 1);
          }
        } else {
          keyCount.set(currentKey, keyCount.get(currentKey) + 1);
        }
        target[property] = $raw;
        // resyncValues();
        return true;
      }
      return Reflect.set(target, property, value, receiver);
    },
    deleteProperty(target, property) {
      const previous = target[property];
      if (Reflect.deleteProperty(target, property)) {
        const key = previous?.$raw?.[0];
        if (key) {
          keyCount.set(key, Math.max(keyCount.get(key) - 1, 0));
        }
        return true;
      }
      return false;
    },
  });

  for (const tuple of tuples) {
    const [key] = tuple;
    const [firstChar] = key;
    if (firstChar === '!' || firstChar === '?' || firstChar === '$') continue;

    if (keyCount.has(key)) {
      keyCount.set(key, keyCount.get(key) + 1);
    } else {
      keyCount.set(key, 1);
    }
  }

  /** @type {XMLProxy<T>} */
  return new Proxy(parsedXML, {
    get(target, property, receiver) {
      if (property === '$raw') return parsedXML;
      if (property === '$tag') return tagName;
      if (property === '$attributes') {
        // eslint-disable-next-line no-return-assign
        return attributeProxy;
      }
      if (property === '$text') {
        if (textCache === undefined) {
          textCache = null;
          for (const [key, value] of tuples) {
            if (key === '$') {
              textCache ??= '';
              textCache += value;
            }
          }
        }
        return textCache;
      }

      if (property === '$array') {
        return arrayProxy;
      }

      if (property === Symbol.iterator) {
        return function* generator() {
          for (const tuple of tuples) {
            const [[firstChar]] = tuple;
            if (firstChar === '!' || firstChar === '?' || firstChar === '$') continue;
            // Only yield child nodes
            yield getProxyForTuple(tuple);
          }
        };
      }

      if (typeof property === 'symbol') return undefined;

      if (!keyCount.has(property)) return undefined;
      if (keyCount.get(property) === 0) return undefined;

      const tuple = tuples.find(([key]) => key === property);
      if (!tuple) return undefined;
      return getProxyForTuple(tuple);
    },
    deleteProperty(target, property) {
      switch (property) {
        case Symbol.iterator:
        case '$tag':
        case '$raw':
        case '$attributes':
        case '$array':
          return false;
        default:
      }
      if (typeof property === 'symbol') return false;
      if (!keyCount.has(property)) return false;
      if (keyCount.get(property) === 0) return false;
      const indexesToRemove = [];
      for (const [index, [key]] of tuples.entries()) {
        if (key === property) {
          indexesToRemove.push(index);
        }
      }
      if (indexesToRemove.length === 0) return false;
      for (const index of indexesToRemove.reverse()) {
        tuples.splice(index, 1);
      }
      keyCount.set(property, 0);
      // resyncValues();
      return true;
    },
    set(target, property, value, receiver) {
      switch (property) {
        case Symbol.iterator:
        case '$tag':
        case '$raw':
        case '$attributes':
        case '$array':
          return false;
        default:
      }
      if (typeof property === 'symbol') return false;
      if (property === '$text') {
        const indexesToRemove = [];

        for (const [index, [key]] of tuples.entries()) {
          if (key === '$') indexesToRemove.push(index);
        }
        if (indexesToRemove.length > 1) {
          for (const index of indexesToRemove.slice(1).reverse()) {
            tuples.splice(index, 1);
          }
        }
        textCache = value == null ? null : `${value}`;
        if (indexesToRemove.length > 0) {
          if (textCache == null) {
            tuples.splice(indexesToRemove[0]);
            return true;
          }
          tuples[indexesToRemove[0]][1] = textCache;
          return true;
        }
        if (value == null) return true;
        tuples.push(['$', textCache]);
        return true;
      }

      if (value == null) {
        Reflect.deleteProperty(target, property);
        return true;
      }
      if (typeof value !== 'object') {
        throw new TypeError('Invalid object type. Must be XMLProxy.');
      }
      if (keyCount.has(property)) {
        const indexesToRemove = [];
        for (const [index, [key]] of tuples.entries()) {
          if (key === property) {
            indexesToRemove.push(index);
          }
        }
        if (indexesToRemove.length > 1) {
          for (const index of indexesToRemove.slice(1).reverse()) {
            tuples.splice(index, 1);
          }
        }
        if (indexesToRemove.length > 0) {
          tuples[indexesToRemove[0]] = value.$raw;
        } else {
          tuples.push(value.$raw);
        }
      } else {
        tuples.push(value.$raw);
      }
      keyCount.set(property, 1);
    },
    ownKeys() {
      return [
        Symbol.iterator,
        '$tag',
        '$raw',
        '$attributes',
        '$text',
        '$array',
        ...keyCount.keys(),
      ];
    },
    has(target, property, receiver) {
      if (property === Symbol.iterator) return true;
      if (cacheValid) {
        return hasCache.has(property) && hasCache.get(property);
      }
      if (typeof property === 'symbol') return false;
      if (property === '$tag') return true;
      if (property === '$raw') return true;
      if (property === '$attributes') return true;
      if (property === '$text') return true;
      if (property === '$array') return true;
      if (!property || property[0] === '$') return false;

      hasCache ??= new Map();
      for (const [key] of tuples) {
        if (key === property) {
          hasCache.set(property, true);
          return true;
        }
      }
      hasCache.set(property, false);
      return false;
    },
  });
}

/**
 * @param {string} input
 * @return {TupleTree<string>}
 */
export function parseXMLAsEntries(input) {
  const [, value] = parseXMLNode(input);
  return /** @type {TupleTree<string>} */ (value);
}

/**
 * @param {string|TupleTree<string>} input
 * @param {ParseXMLFlattenOptions} [flattenOptions]
 * @return {XMLObject<unknown>}
 */
export function parseXMLAsObject(input, flattenOptions) {
  const entries = (typeof input === 'string') ? parseXMLAsEntries(input) : input;
  return flattenParsedXML(entries, flattenOptions);
}

/**
 * @param {string} input
 * @return {XMLProxy<unknown>}
 */
export function parseXMLAsProxy(input) {
  const entries = (typeof input === 'string') ? parseXMLAsEntries(input) : input;
  return createXMLProxy(['$root', entries]);
}

/**
 * @param {string} input
 * @param {ParseXMLFlattenOptions} [flattenOptions]
 * @return {TupleTree<string>|XMLObject<unknown>}
 */
export function parseXML(input, flattenOptions) {
  const entries = parseXMLAsEntries(input);
  if (flattenOptions) return flattenParsedXML(entries, flattenOptions);
  return entries;
}
