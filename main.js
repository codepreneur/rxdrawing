(function(window, undefined){
  // Calculate offset either layerX/Y or offsetX/Y
  function getOffset(event) {
    return {
      x: event.offsetX === undefined ? event.layerX : event.offsetX,
      y: event.offsetY === undefined ? event.layerY : event.offsetY,
    };
  }

  function main() {
    var _ref = new Firebase('https://rxdrawing.firebaseio.com/scribble');
    var canvas = document.getElementById('tutorial');

    if (canvas.getContext) {
      var ctx = canvas.getContext('2d');
      ctx.lineWidth = 3;

      var mouseDowns  = Rx.Observable.fromEvent(canvas, 'mousedown');
      var mouseUps    = Rx.Observable.fromEvent(document, 'mouseup');
      var mouseMoves  = Rx.Observable.fromEvent(canvas, 'mousemove');
      var clearButton = Rx.Observable.fromEvent($('#clear'), 'click');

      var mouseDrags = mouseDowns.select(function (downEvent) {
        return mouseMoves.takeUntil(mouseUps).select(function (drag) {
          return getOffset(drag);
        });
      });

      // UI EVENTS

      mouseDrags.subscribe(function(drags) {
        $colour = $('#colour').val();
        $colour = $colour ? $colour : '#df4b26';
        var _dragref = _ref.push({colour: $colour});
        drags.subscribe(function (move) {
          _dragref.ref().child('points').push({x: move.x, y: move.y});
        });
      });

      clearButton.subscribe(function () {
        _ref.remove();
      });

      // DRAWING CODE - called from Firebase event
      var drawLine = function (data) {
        // get current point
        var coordsTo = data.snapshot.val();
        // get colour
        data.snapshot.ref().parent().parent().child('colour')
        .once('value', function (snap) {
          var colour = snap.val();
          // get previous point
          data.snapshot.ref().parent().child(data.prevName)
          .once('value', function (snap) {
            var coordsFrom = snap.val();
            ctx.beginPath();
            ctx.strokeStyle = colour;
            ctx.moveTo(coordsFrom.x, coordsFrom.y);
            ctx.lineTo(coordsTo.x, coordsTo.y);
            ctx.stroke();
          });
        });
      };

      // FIRBASE EVENTS
      _ref.observe('child_added')
      .subscribe(function (newLine) {
        newLine.snapshot.child('points').ref()
        .observe('child_added')
        .filter(function (data) { return data.prevName !== null;}) // ignore first point
        .subscribe(drawLine);
      });

      _ref.on('child_removed', function (snap) {
        canvas.width = canvas.width;
        ctx.lineWidth = 3;
      });


    }
  }
  main();
}(window));