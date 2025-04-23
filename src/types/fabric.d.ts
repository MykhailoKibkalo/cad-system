/**
 * Augment Fabric types with optional helper props we set at runtime.
 */
import 'fabric';

declare module 'fabric' {
  // Every Fabric.Object may optionally carry these extra fields.
  interface Object {
    parentId?: string;
  }

  interface Group {
    /** internal uuid Fabric already has, but not typed */
    id: string;
  }
}
