/* eslint-disable no-use-before-define */

/**
 * @template {any} T
 * @typedef {[
 *  T,
 *  T|TupleTreeEntry<T>[]
 * ]} TupleTreeEntry
 */

/**
 * @template {any} T
 * @typedef {[
 *  T,
 *  T|TupleTree<T>[]
 * ]} TupleTree
 */

/**
 * @template {any} T
 * @typedef {{
 *  $A: {
 *    [P in Extract<keyof T, string>]?: (
 *      T[P] extends T[P][0][] ? XMLObject<T[P][0]>[] :
 *      (XMLObjectBase<T[P]> & XMLObject<T[P]>)[]
 *    )
 *  },
 *  $O: {
 *    [P in Extract<keyof T, string>]?: {
 *      $$?: Record<string, string>
 *    } & (
 *      T[P] extends T[P][0][] ? (XMLObjectBase<T[P][0]> & XMLObject<T[P][0]>) :
 *      T[P] extends string ? { $:T[P] } :
 *      T[P] extends number ? { $:string } :
 *      T[P] extends Date ? { $:string } :
 *      XMLObjectBase<T[P]> & XMLObject<T[P]>)
 *  },
 *  $S: {
 *    [P in Extract<keyof T, string>]?: (
 *      T[P] extends string ? T[P] : string
 *    )
 *  },
 *  $$?: Record<string, string>,
 * }} XMLObjectBase
 */

/**
 * @template {any} T
 * @typedef {
 *  XMLObjectBase<T> & {
 *  [P in Extract<keyof T, string>]?: (
 *    T[P] extends T[P][0][] ? (XMLObjectBase<T[P][0]> & XMLObject<T[P][0]>) :
 *    T[P] extends string ? T[P] | XMLObject<{ $:T[P] }> :
 *    T[P] extends number ? string | XMLObject<{ $:string }> :
 *    T[P] extends Date ? string | XMLObject<{ $:string }> :
 *    XMLObjectBase<T[P]> & XMLObject<T[P]>
 *  )
 * }} XMLObject
 */

/**
 * @template {any} T
 * @typedef {{
 *  $A: {
 *    [P in Extract<keyof T, string>]?: (
 *      T[P] extends T[P][0][] ? XMLObjectFlat<T[P][0]>[] :
 *      (XMLObjectFlatBase<T[P]> & XMLObjectFlat<T[P]>)[]
 *    )
 *  },
 *  $O: {
 *    [P in Extract<keyof T, string>]?: (
 *      T[P] extends T[P][0][] ? (XMLObjectFlatBase<T[P][0]> & XMLObjectFlat<T[P][0]>) :
 *      T[P] extends string ? { $:T[P] } :
 *      T[P] extends number ? { $:string } :
 *      T[P] extends Date ? { $:string } :
 *      XMLObjectFlatBase<T[P]> & XMLObjectFlat<T[P]>)
 *  },
 *  $S: {
 *    [P in Extract<keyof T, string>]?: (
 *      T[P] extends string ? T[P] : string
 *    )
 *  },
 *}} XMLObjectFlatBase
 */

/**
 * @template {any} T
 * @typedef {XMLObjectFlatBase<T> & {
 *  [P in Extract<keyof T, string>]?: (
 *    T[P] extends T[P][0][] ? (XMLObjectFlatBase<T[P][0]> & XMLObjectFlat<T[P][0]>) :
 *    T[P] extends string ? T[P] :
 *    T[P] extends number ? string :
 *    T[P] extends Date ? string :
 *    XMLObjectFlatBase<T[P]> & XMLObjectFlat<T[P]>
 *  )
 * } XMLObjectFlat
 */
