/* eslint-disable unicorn/prefer-code-point */

export const CONTENT_NODE_KEY = '$';
export const ATTRIBUTE_NODE_KEY = '$$';
export const AS_ARRAY_KEY = '$A';
export const AS_OBJECT_KEY = '$O';
export const AS_STRING_KEY = '$S';
export const COMMENT_NODE_KEY = '!--';
export const CDATA_NODE_KEY = '![CDATA[';
export const CHARCODE_QUESTION = '?'.charCodeAt(0);
export const NODE_TYPE_NONE = Symbol('NONE');
export const NODE_TYPE_XML_DECL = Symbol('XML_DECL');
export const NODE_TYPE_NOTATION_DECL = Symbol('NOTATION_DECL');
export const NODE_TYPE_ROOT = Symbol('ROOT');
export const NODE_TYPE_CHILD = Symbol('CHILD');
