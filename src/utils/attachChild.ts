import { fabric } from 'fabric';

/** Adds child to parent group, keeps child selectable, keeps border */
export const attachChild = (parent: fabric.Group, child: fabric.Object) => {
    parent.addWithUpdate(child);           // fabric mutates coords automatically
    child.set({ parentId: parent.id });    // custom link for later moves
    parent.canvas?.requestRenderAll();
};
