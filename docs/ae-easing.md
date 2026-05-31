# After Effects Temporal Easing

Temporal easing in After Effects dictates how a property transitions between keyframes over time. In ExtendScript (After Effects' scripting language), this is managed using `KeyframeEase` objects and the `setTemporalEaseAtKey()` method.

## The KeyframeEase Object
To define a temporal ease, you create a `KeyframeEase` object which accepts two parameters: `speed` and `influence`.

```javascript
var ease = new KeyframeEase(speed, influence);
```

### 1. Speed
- **Definition:** The rate of change at the keyframe. 
- **Units:** Varies by property. For a Position property, it might be pixels per second; for Rotation, degrees per second.
- **Behavior:** A speed of `0` means the animation comes to a complete halt at the keyframe. Higher speeds mean the property is moving quickly as it passes through the keyframe.

### 2. Influence
- **Definition:** How heavily the speed affects the curve leading into or out of the keyframe.
- **Range:** `0.1` to `100.0` (representing a percentage).
- **Graph Editor Representation:** The influence determines the horizontal length of the bezier tangent handle in the Value or Speed Graph. A higher influence creates a longer handle, meaning the curve "holds onto" that speed for a longer duration before transitioning to the next keyframe.

## Incoming vs. Outgoing Velocity
Every keyframe (except the absolute first and last) has two sides:
- **Incoming (Ease In):** The velocity as the animation arrives *at* the keyframe.
- **Outgoing (Ease Out):** The velocity as the animation departs *from* the keyframe.

In scripting, you must provide separate `KeyframeEase` objects for both the incoming and outgoing sides of a keyframe.

## Graph Editor Representation
In the After Effects Graph Editor:
- **Speed Graph:** 
  - **Y-Axis (Height):** Represents the **Speed**.
  - **X-Axis (Width of Handle):** Represents the **Influence**.
  - The resulting curve dictates the acceleration and deceleration. An "Easy Ease" curve looks like a bell curve in the speed graph (starting at speed 0, peaking in the middle, and returning to speed 0).
- **Value Graph:**
  - The slope of the curve represents the speed. A flatter slope means slower speed, while a steeper slope indicates higher speed. Influence pulls the bezier handles horizontally.

## Scripting Examples

### Basic Ease In / Ease Out (Zero Speed)
This example applies a standard ease-in and ease-out (similar to pressing F9) to the first keyframe of a property.

```javascript
var prop = app.project.activeItem.layer(1).property("Opacity");

// 0 speed, 33.3% influence is the AE default "Easy Ease"
var easeIn = new KeyframeEase(0, 33.3);
var easeOut = new KeyframeEase(0, 33.3);

// Apply the ease to keyframe index 1
// Note: setTemporalEaseAtKey takes arrays of KeyframeEase objects
prop.setTemporalEaseAtKey(1, [easeIn], [easeOut]);
```

### Multi-Dimensional Properties
Properties with multiple dimensions (like 2D or 3D Position) require an array of `KeyframeEase` objects corresponding to each dimension, even if the easing is identical across all dimensions.

```javascript
var posProp = app.project.activeItem.layer(1).property("Position");

// Create extreme easing (Fast Ease / Snappy)
var easeIn = new KeyframeEase(0, 80);
var easeOut = new KeyframeEase(0, 80);

// For a 2D property, we need an array of two KeyframeEase objects
// For 3D, we would need three.
posProp.setTemporalEaseAtKey(
    1, 
    [easeIn, easeIn],   // Incoming eases for [X, Y]
    [easeOut, easeOut]  // Outgoing eases for [X, Y]
);
```

### Continuous Velocity (Passing through a keyframe)
If you want the animation to maintain speed as it passes through a middle keyframe, you match the incoming and outgoing speeds.

```javascript
var prop = app.project.activeItem.layer(1).property("Scale");

// Maintain a speed of 100 units/sec passing through the keyframe
var passThroughIn = new KeyframeEase(100, 50);
var passThroughOut = new KeyframeEase(100, 50);

// Set interpolation to Bezier first to ensure the handles can be adjusted
prop.setInterpolationTypeAtKey(2, KeyframeInterpolationType.BEZIER);
prop.setTemporalEaseAtKey(2, [passThroughIn], [passThroughOut]);
```
