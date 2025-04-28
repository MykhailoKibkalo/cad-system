import 'fabric';

declare module 'fabric' {
  interface Group {
    /** runtime uuid we inject for selection logic */
    id: string;
  }

  interface Object {
    /** optional back-link set in attachChild */
    parentId?: string;
  }
}
