---
editUrl: false
next: false
prev: false
title: "scalingYOrSkewingX"
---

> **scalingYOrSkewingX**(`eventData`, `transform`, `x`, `y`): `boolean`

Defined in: [src/controls/scaleSkew.ts:84](https://github.com/fabricjs/fabric.js/blob/8748628df7e9de00ba77413bfc3ad9e9fe9d4f30/src/controls/scaleSkew.ts#L84)

Composed action handler to either scale Y or skew X
Needs to be wrapped with `wrapWithFixedAnchor` to be effective

## Parameters

### eventData

[`TPointerEvent`](/api/type-aliases/tpointerevent/)

javascript event that is doing the transform

### transform

[`Transform`](/api/type-aliases/transform/)

javascript object containing a series of information around the current transform

### x

`number`

current mouse x position, canvas normalized

### y

`number`

current mouse y position, canvas normalized

## Returns

`boolean`

true if some change happened
