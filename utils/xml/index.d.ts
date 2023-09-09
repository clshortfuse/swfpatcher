/* eslint-disable no-use-before-define */

export type TupleTreeEntry<T> = [T, T|TupleTreeEntry<T>[]];
export type TupleTree<T> = [T, T|TupleTree<T>][];

export type XMLObjectBase<T> = {
  $A: {
    [P in Extract<keyof T, string>]?: (
      T[P] extends T[P][0][] ? XMLObject<T[P][0]>[] :
      (XMLObjectBase<T[P]> & XMLObject<T[P]>)[]
    )
  },
  $O: {
    [P in Extract<keyof T, string>]?: {
      $$?: Record<string, string>
    } & (
      T[P] extends T[P][0][] ? (XMLObjectBase<T[P][0]> & XMLObject<T[P][0]>) :
      T[P] extends string ? { $:T[P] } :
      T[P] extends number ? { $:string } :
      T[P] extends Date ? { $:string } :
      XMLObjectBase<T[P]> & XMLObject<T[P]>)
  },
  $S: {
    [P in Extract<keyof T, string>]?: (
      T[P] extends string ? T[P] : string
    )
  },
  $$?: Record<string, string>,
};

export type XMLObject<T> = XMLObjectBase<T> & {
  [P in Extract<keyof T, string>]?: (
    T[P] extends T[P][0][] ? (XMLObjectBase<T[P][0]> & XMLObject<T[P][0]>) :
    T[P] extends string ? T[P] | XMLObject<{ $:T[P] }> :
    T[P] extends number ? string | XMLObject<{ $:string }> :
    T[P] extends Date ? string | XMLObject<{ $:string }> :
    XMLObjectBase<T[P]> & XMLObject<T[P]>
  )
};

export type XMLObjectFlatBase<T> = {
  $A: {
    [P in Extract<keyof T, string>]?: (
      T[P] extends T[P][0][] ? XMLObjectFlat<T[P][0]>[] :
      (XMLObjectFlatBase<T[P]> & XMLObjectFlat<T[P]>)[]
    )
  },
  $O: {
    [P in Extract<keyof T, string>]?: (
      T[P] extends T[P][0][] ? (XMLObjectFlatBase<T[P][0]> & XMLObjectFlat<T[P][0]>) :
      T[P] extends string ? { $:T[P] } :
      T[P] extends number ? { $:string } :
      T[P] extends Date ? { $:string } :
      XMLObjectFlatBase<T[P]> & XMLObjectFlat<T[P]>)
  },
  $S: {
    [P in Extract<keyof T, string>]?: (
      T[P] extends string ? T[P] : string
    )
  },
};

export type XMLObjectFlat<T> = XMLObjectFlatBase<T> & {
  [P in Extract<keyof T, string>]?: (
    T[P] extends T[P][0][] ? (XMLObjectFlatBase<T[P][0]> & XMLObjectFlat<T[P][0]>) :
    T[P] extends string ? T[P] :
    T[P] extends number ? string :
    T[P] extends Date ? string :
    XMLObjectFlatBase<T[P]> & XMLObjectFlat<T[P]>
  )
};
