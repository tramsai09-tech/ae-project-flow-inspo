// ExtendScript Host Environment (ES3)
// This script runs directly inside After Effects.

function applyBezierToSelectedKeys(payloadJSON) {
  try {
    var payload;
    try {
      payload = JSON.parse(payloadJSON);
    } catch(e) {
      payload = eval('(' + payloadJSON + ')');
    }

    var p1 = payload.p1;
    var p2 = payload.p2;

    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
      return "ERROR: No active composition found.";
    }

    var selectedProps = comp.selectedProperties;
    if (selectedProps.length === 0) {
      return "ERROR: No properties selected.";
    }

    app.beginUndoGroup("Apply Bezier Curve");

    var errors = [];

    for (var i = 0; i < selectedProps.length; i++) {
      var prop = selectedProps[i];
      if (!prop.canVaryOverTime || prop.selectedKeys.length === 0) continue;

      try {
        if (prop.selectedKeys.length !== 2) {
          throw new Error("Exactly two keyframes must be selected.");
        }

        var keyIndex = prop.selectedKeys[0];
        var nextIndex = prop.selectedKeys[1];
        
        // Ensure they are adjacent keyframes
        if (nextIndex !== keyIndex + 1) {
           throw new Error("Selected keyframes must be adjacent.");
        }

        var dx = prop.keyTime(nextIndex) - prop.keyTime(keyIndex);
        if (dx <= 0) throw new Error("Invalid keyframe time difference.");

        var val1 = prop.keyValue(keyIndex);
        var val2 = prop.keyValue(nextIndex);
          
          var isSpatial = (prop.propertyValueType === PropertyValueType.TwoD_SPATIAL || 
                           prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL);
          var isMulti = (val1 instanceof Array);
          
          var easeOutArray = [];
          var easeInArray = [];

          if (isSpatial) {
            // Spatial: 1 KeyframeEase representing speed along the combined path
            var distSq = 0;
            for (var d = 0; d < val1.length; d++) {
              distSq += Math.pow(val2[d] - val1[d], 2);
            }
            var spatialDist = Math.sqrt(distSq);
            
            var eases = calculateAEEase(p1.x, p1.y, p2.x, p2.y, dx, spatialDist);
            easeOutArray.push(eases.easeOut);
            easeInArray.push(eases.easeIn);
          } else if (isMulti) {
            // Multi-Dimensional (e.g. Scale, 3D Rotation): N KeyframeEases
            for (var d = 0; d < val1.length; d++) {
              var dy = val2[d] - val1[d];
              var eases = calculateAEEase(p1.x, p1.y, p2.x, p2.y, dx, dy);
              easeOutArray.push(eases.easeOut);
              easeInArray.push(eases.easeIn);
            }
          } else {
            // 1D Property (e.g. Opacity)
            var dy = val2 - val1;
            var eases = calculateAEEase(p1.x, p1.y, p2.x, p2.y, dx, dy);
            easeOutArray.push(eases.easeOut);
            easeInArray.push(eases.easeIn);
          }

          prop.setInterpolationTypeAtKey(keyIndex, prop.keyInInterpolationType(keyIndex), KeyframeInterpolationType.BEZIER);
          prop.setInterpolationTypeAtKey(nextIndex, KeyframeInterpolationType.BEZIER, prop.keyOutInterpolationType(nextIndex));

          var existingEaseIn1 = prop.keyInTemporalEase(keyIndex);
          var existingEaseOut2 = prop.keyOutTemporalEase(nextIndex);

          prop.setTemporalEaseAtKey(keyIndex, existingEaseIn1, easeOutArray);
          prop.setTemporalEaseAtKey(nextIndex, easeInArray, existingEaseOut2);
      } catch (propErr) {
        errors.push("Prop '" + prop.name + "': " + propErr.toString());
      }
    }

    app.endUndoGroup();
    
    if (errors.length > 0) {
      return "ERROR applying to some properties:\n" + errors.join("\n");
    }
    return "SUCCESS: Applied curve data.";
  } catch (err) {
    if (app) app.endUndoGroup();
    return "ERROR: " + err.toString();
  }
}

/**
 * Calculates AE KeyframeEase objects given cubic bezier control points.
 */
function calculateAEEase(x1, y1, x2, y2, dx, dy) {
  var rawInfluenceOut = x1 * 100;
  var rawInfluenceIn = (1 - x2) * 100;
  
  var influenceOut = Math.max(0.1, Math.min(100, rawInfluenceOut));
  var influenceIn = Math.max(0.1, Math.min(100, rawInfluenceIn));

  if (Math.abs(dy) < 0.0001) {
    return {
      easeOut: new KeyframeEase(0, influenceOut),
      easeIn: new KeyframeEase(0, influenceIn)
    };
  }

  var actualX1 = influenceOut / 100;
  var actualX2 = 1 - (influenceIn / 100);

  var averageSpeed = dy / dx;

  // Use actualX1/X2 to prevent division by zero and match clamping
  var speedOut = actualX1 > 0 ? (y1 / actualX1) * averageSpeed : 0;
  var speedIn = (1 - actualX2) > 0 ? ((1 - y2) / (1 - actualX2)) * averageSpeed : 0;

  return {
    easeOut: new KeyframeEase(speedOut, influenceOut),
    easeIn: new KeyframeEase(speedIn, influenceIn)
  };
}

function pingHost() {
  return "aeBridge.jsx is connected and responding.";
}

function testConnectionAlert() {
  alert("React to AE Connection Successful!");
  return "Alert shown!";
}

function createNullLayer() {
  try {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) return "ERROR: No active composition found.";
    app.beginUndoGroup("Create Null Layer");
    comp.layers.addNull();
    app.endUndoGroup();
    return "SUCCESS";
  } catch(e) {
    if (app) app.endUndoGroup();
    return "ERROR: " + e.toString();
  }
}

function createAdjustmentLayer() {
  try {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) return "ERROR: No active composition found.";
    app.beginUndoGroup("Create Adjustment Layer");
    var layer = comp.layers.addSolid([1,1,1], "Adjustment Layer", comp.width, comp.height, comp.pixelAspect, comp.duration);
    layer.adjustmentLayer = true;
    app.endUndoGroup();
    return "SUCCESS";
  } catch(e) {
    if (app) app.endUndoGroup();
    return "ERROR: " + e.toString();
  }
}

function createCameraLayer() {
  try {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) return "ERROR: No active composition found.";
    app.beginUndoGroup("Create Camera Layer");
    comp.layers.addCamera("Camera", [comp.width/2, comp.height/2]);
    app.endUndoGroup();
    return "SUCCESS";
  } catch(e) {
    if (app) app.endUndoGroup();
    return "ERROR: " + e.toString();
  }
}
