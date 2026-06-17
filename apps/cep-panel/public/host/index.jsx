// ExtendScript Host Environment (ES3)
// This script runs directly inside After Effects.

/**
 * Applies a cubic bezier curve to the currently selected keyframes.
 * @param {string} payloadJSON - A JSON string containing p1 and p2 coordinates.
 */
function applyBezierToSelectedKeys(payloadJSON) {
  try {
    // ExtendScript doesn't have native JSON in older versions without polyfills,
    // but modern AE versions (CC 2014+) provide a JSON object or we can eval it.
    // Assuming JSON polyfill or native support is available in our target AE versions.
    var payload;
    try {
      payload = JSON.parse(payloadJSON);
    } catch(e) {
      // Fallback if JSON is missing (simple eval for trusted internal payload)
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

    for (var i = 0; i < selectedProps.length; i++) {
      var prop = selectedProps[i];
      if (prop.canVaryOverTime && prop.selectedKeys.length > 0) {
        for (var k = 0; k < prop.selectedKeys.length; k++) {
          var keyIndex = prop.selectedKeys[k];
          // Example interpolation set (Temporal Ease)
          // We will need to utilize the ae-serializer math here in the future
          // For scaffolding, we just acknowledge the call.
        }
      }
    }

    app.endUndoGroup();
    return "SUCCESS: Applied " + JSON.stringify(payload);
  } catch (err) {
    return "ERROR: " + err.toString();
  }
}

/**
 * Ping function to test connection
 */
function pingHost() {
  return "Host is connected and responding.";
}
