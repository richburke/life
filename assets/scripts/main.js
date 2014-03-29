/**
 * Created by dev on 1/1/14.
 *
 * Create a version that implements the method used by Life creator.
 * Add Angular for way of switching between 2 apps.
 *
 * Fix "life" logic.
 * Add unattached functions to Collective or where appropriate.
 * Be able to add a column, row to table--top, bottom, left, right.
 * Make layout responsive.
 * Convert to Canvas.
 * Create & add library.
 *
 * [ARCHIVED]
 * Switch to lo-dash [next project!]
 * Add in Packet to Cell.
 * Add in renderers for Packet and Cell.
 * Remove use of indices as indicators.
 * Research bacon js
 */
/**
 * Don't use index arithmetic for determining location; use column & row
 * coordinates instead.
 * When a new column or row is added, each of its cells should communicate to
 * its neighbors that it's been added.
 */

/*
Library type stuff
Function.prototype.inherits = function(parent) {
  this.prototype = Object.create(parent.prototype);
};

this.extend = function(destination, source) {
  for (var k in source) {
    if (source.hasOwnProperty(k)) {
      destination[k] = source[k];
    }
  }
  return destination;
}
return this;
*/

var APP;
(function($) {
  'use strict';

  APP = APP || {};

  /**
   * SuperSimpleTrueEventQueue
   * - general-purpose
   * - easy-to-use
   *
   * sample: space invaders animation
   *   - animate creature
   *   - animate movement
   * @returns {{poll: Function, pluck: Function, each: Function, every: Function, add: Function, start: Function}}
   * @constructor
   */
  APP.EventQueue = function () {
    var events = [];
    var interval, pollLimit;
    var pollCount = 0;
    var eachCount = 0;
    var pollMilliseconds = 1000;
    var pluckNumber = 1;
    var everyNumber = 0;

    var pluckFnc = function(a, i, n) {return a.shift();};
    var eachFnc = function(o, n) {};
    var everyFnc = function(o, pollCnt, eachCnt, currentLength) {};
    var uniqueFnc = function(o, list) {return true;};
    var pollLimitFnc = function(list, pollCnt, eachCnt, pollLmt) {endFnc();};
    var onStartFnc = function(list, pollLmt) {};
    var onEndFnc = function(list, pollCnt, eachCnt, n) {};

    // traverse
    //   -- one way
    //   -- back & forth
    //   -- cycle

    // Only like other functions, these are not alterable by clients.
    var endFnc = function(n) {
      clearInterval(interval);
      onEndFnc(events, pollCount, eachCount, n);
    };
    var execFnc = function() {
      var event, i;

      if (events.length == 0) {
        endFnc();
        return;
      }

      pollCount++;
      for (i=1; i <= pluckNumber; i++) {
        if (events.length == 0) {
          endFnc(i);
          return;
        }

        eachCount++;
        event = pluckFnc(events, i, pollCount, eachCount);

        if (everyNumber > 0 && pollCount % everyNumber == 0) {
          everyFnc(event, pollCount, eachCount, events.length+1);
        }
        eachFnc(event, pollCount, eachCount);
      }

      if (events.length == 0) {
        endFnc();
      }
      if (pollLimit !== undefined && pollCount >= pollLimit) {
        pollLimitFnc(events, pollCount, eachCount, pollLimit);
      }
    };

    var that = {};
    that.poll = function(n) {
        pollMilliseconds = n;
        return this;
      };
    that.pluck = function(n, fnc) {
      pluckNumber = n;
      pluckFnc = fnc;
      return this;
    };
    that.unique = function(fnc) {
      uniqueFnc = fnc;
      return this;
    };
    that.limit = function(n, fnc) {
      pollLimit = n;
      if (fnc !== undefined) {
        pollLimitFnc = fnc;
      }
      return this;
    };
    that.each = function(fnc) {
      eachFnc = fnc;
      return this;
    };
    that.every = function(n, fnc) {
      everyNumber = n;
      everyFnc = fnc;
      return this;
    };
    that.sometimes = function(n, fnc) {
      // The parameter n is either a number (1-99) or function.
      // If 1-99, compare against rand function for ~percent.
      // Function should return a boolean.
      return this;
    };
    that.add = function(o) {
      if (uniqueFnc(o, events)) {
        events.push(o);
      }
      return this;
    };
    that.clear = function() {
      events.length = 0;
      events = [];
      return this;
    };
    that.start = function() {
      interval = setInterval(execFnc, pollMilliseconds);
      return this;
    };
    that.stop = function() {
      return this;
    };
    that.pause = function() {
      return this;
    };
    that.restart = function(o) {
      return this;
    };
    that.onStart = function(o) {
      onStartFnc = o;
      return this;
    };
    that.onEnd = function(o) {
      onEndFnc = o;
      return this;
    };
    that.onStop = function(o) {
      return this;
    };
    that.onPause = function(o) {
      return this;
    };
    that.onRestart = function(o) {
      return this;
    };
    return that;
  }();

  /**
   * Mix-in for broadcasting messages of various types.
   *
   * @returns {{addChannel: Function, addListener: Function, broadcast: Function}}
   * @constructor
   */
  var Broadcaster = function() {
    var DEFAULT_CHANNEL ="_default_";
    var channels = {DEFAULT_CHANNEL:[]};

    var that = {};
    that.addChannel = function(channel) {
      if(typeof channels[channel] == 'undefined')
        channels[channel] = [];
    };
    that.addListener = function(listener, channel) {
      if(!channels.hasOwnProperty(channel)) {
        this.addChannel(channel);
      }
      channels[channel].push(listener);
    };
    that.broadcast = function(type, msg, channel) {
      var i;
      channel = channel ? channel : DEFAULT_CHANNEL;
      if(!channels.hasOwnProperty(channel))
        return;

      var len = channels[channel].length;
      for(i=0; i < len; i++) {
        channels[channel][i].on(type, msg);
      }
    };
    return that;
  };

  /**
   * Mix-in for managing events on an object.  From "JavaScript: the Good Parts."
   *
   * @param that
   * @returns {{}}
   */
  var eventsManager = function(that) {
    var registry = {};
    var clearEventsRegistry = function(type) {
      if (type) {
        registry[type] = [];
        registry[type].length = 0;
      } else
        registry = {};
    };

    that = that || {};
    that.fire = function(evnt) {
      var arr, fnc, handler, i,
        type = typeof evnt === 'string' ? evnt : evnt.type;

      if (!registry.hasOwnProperty(type))
        return this;

      arr = registry[type];
      for (i=0; i < arr.length; i++) {
        handler = arr[i];

        fnc = handler.method;
        if (typeof fnc === 'string') {
          fnc = this[fnc];
        }

        fnc.apply(this, handler.parameters || [evnt]);
      }

      return this;
    };

    that.on = function(type, method, parameters) {
      var handler = {
        type: type,
        method: method,
        parameters: parameters
      };

      if (registry.hasOwnProperty(type)) {
        registry[type].push(handler);
      } else {
        registry[type] = [handler];
      }

      return this;
    };

    return that;
  }

  APP.Collective = function() {
    var COLUMN_COUNT = 40;
    var WRAPS = false;  // Is the world round or flat?
    var cells = [];

    var that = {};
    that.initialize = function(data) {
      for (var i=0; i < data.length; i++) {
        cells.push(new Cell(data[i], i));
      }

      var cell_stream;
      _.each(this.get('cells'), function(cell) {
        cell.initialize();
      });
    };
    that.getCells = function() {return cells;};
    that.get = function(p) {
      if (p === undefined) return null;
      switch (p.toLowerCase()) {
        case 'cells': return this.getCells();
        case 'cell_count': return this.getCellCount();
        case 'column_count': return this.getColumnCount();
        case 'row_count': return this.getRowCount();
        case 'wraps': return this.isWrapping();
        default: return null;
      }
    };
    that.getCellByIndex = function(i) {
      return this.isCellIndexValid(i) ? cells[i] : null;
    };
    that.getCellByCellCoordinates = function(o) {
      var col_cells = this.getCellsByColumn(o.column);
      var row_cells = this.getCellsByRow(o.row);
      var col_len = col_cells.length,
        row_len = row_cells.length;
      var cell1, cell2;

      for (var i=0; i < col_len; i++) {
        cell1 = col_cells[i];
        for (var j=0; j < row_len; j++) {
          cell2 = row_cells[j];
          if (cell1.get('index') == cell2.get('index')) {
            return cell1;
          }
        }
      }
      return null;
    };
    that.getCellsByColumn = function(v) {
      var a = [];
      _.each(cells, function(o) {
        if (o.getColumn() == v) {
          a.push(o);
        }
      });
      return a;
    };
    that.getCellsByRow = function(v) {
      var a = [];
      _.each(cells, function(o) {
        if (o.getRow() == v) {
          a.push(o);
        }
      });
      return a;
    };
    that.isCellIndexValid = function(i) {
      return i !== undefined && i >= 0 && i < cells.length;
    };
    that.areCellCoordinatesValid = function(o) {
      if (o.column < 1 || o.column > this.getColumnCount()) {
        return false;
      }
      if (o.row < 1 || o.row > this.getRowCount()) {
        return false;
      }
      return true;
    };
    that.getCellCount = function() { return cells.length; };
    that.getColumnCount = function() { return COLUMN_COUNT; };
    that.getRowCount = function() {
      return Math.ceil(this.getCellCount() / this.getColumnCount());
    };
    that.isWrapping = function() { return WRAPS; };
    that.broadcast = function(evnt) {
      console.log(evnt.msg);
    };
    return that;
  }();

  var CellNeighborFinder = function(cell) {
    /**
     * @todo Add functionality for if the world is round.
     */

    var col = cell.get('column'), row = cell.get('row');
    var index = cell.get('index');

    var possible_neighbors = {
      "north":[
        {"cell_coordinates": {"column":col-1, "row":row-1}, "relationships":["neighbor"], "index":null, "determine": function(i) {return i - APP.Collective.getColumnCount() - 1;}},
        {"cell_coordinates": {"column":col, "row":row-1}, "relationships":["neighbor", "rank", "column"], "index":null, "determine": function(i) {return i - APP.Collective.getColumnCount();}},
        {"cell_coordinates": {"column":col+1, "row":row-1}, "relationships":["neighbor"], "index":null, "determine": function(i) {return i - APP.Collective.getColumnCount() + 1;}}],
      "south":[
        {"cell_coordinates": {"column":col-1, "row":row+1}, "relationships":["neighbor"], "index":null, "determine": function(i) {return i + APP.Collective.getColumnCount() - 1;}},
        {"cell_coordinates": {"column":col, "row":row+1}, "relationships":["neighbor", "rank", "column"], "index":null, "determine": function(i) {return i + APP.Collective.getColumnCount();}},
        {"cell_coordinates": {"column":col+1, "row":row+1}, "relationships":["neighbor"], "index":null, "determine": function(i) {return i + APP.Collective.getColumnCount() + 1;}}],
      "east":[
        {"cell_coordinates": {"column":col+1, "row":row-1}, "relationships":["neighbor"], "index":null, "determine": function(i) {return i + 1 - APP.Collective.getColumnCount();}},
        {"cell_coordinates": {"column":col+1, "row":row}, "relationships":["neighbor", "rank", "row"], "index":null, "determine": function(i) {return i + 1;}},
        {"cell_coordinates": {"column":col+1, "row":row+1}, "relationships":["neighbor"], "index":null, "determine": function(i) {return i + 1 + APP.Collective.getColumnCount();}}],
      "west":[
        {"cell_coordinates": {"column":col-1, "row":row-1}, "relationships":["neighbor"], "index":null, "determine": function(i) {return i - 1 - APP.Collective.getColumnCount();}},
        {"cell_coordinates": {"column":col-1, "row":row}, "relationships":["neighbor", "rank", "row"], "index":null, "determine": function(i) {return i - 1;}},
        {"cell_coordinates": {"column":col-1, "row":row+1}, "relationships":["neighbor"], "index":null, "determine": function(i) {return i - 1 + APP.Collective.getColumnCount();}}]
    };

    var that = {};
    that.find = function(boundary) {
      if (!possible_neighbors.hasOwnProperty(boundary))
        return [];
      var a = this.filter(possible_neighbors[boundary]);
      _.each(a, this.determineIndex);
      return a;
    };
    that.filter = function(p) {
      var a = [];
      _.each(p, function(v) {
          if (APP.Collective.areCellCoordinatesValid(v.cell_coordinates)) {
            a.push(v);
          }
      });
      return a;
    };
    that.determineIndex = function(v) {
      v.index = v.determine(index);
    };
    return that;
  };

  var CellNeighbors = function(cell) {
    var boundaries = (function buildBoundaries() {
      var n = [], e = [], s = [], w = [];
      var a = [], o = null;

      var finder = new CellNeighborFinder(cell);
      var apply = function(v) {
        o = APP.Collective.getCellByCellCoordinates(v.cell_coordinates);
        if (o == null) {
          throw Error('Expected a cell, but got null.');
        } else {
          v.cell = o;
        }
        return {"cell":o, "cell_coordinates": v.cell_coordinates, "relationships": v.relationships};
      };

      n = _.collect(finder.find('north'), apply);
      s = _.collect(finder.find('south'), apply);
      e = _.collect(finder.find('east'), apply);
      w = _.collect(finder.find('west'), apply);

      return {
        'north': n,
        'east': e,
        'south': s,
        'west': w
      };
    })();

    var that = {};
    that.types = (function(b){return _.keys(b)})(boundaries);
    that.get = function(p) {
        if (p === undefined) {
        return boundaries;
      }
      switch (p.toLowerCase()) {
        case 'types': return this.types;
        case 'unique': return this.getUnique();
      }
      if (boundaries.hasOwnProperty(p)) {
        return boundaries[p];
      }
      return boundaries;
    };
    that.getUnique = function() {
      var a = [];
      _.each(this.types, function(v) {
        _.each(boundaries[v], function(v) {
          a.push(v);
        });
      });

      a = _.uniq(a, false, function(item) {
        return item.cell_coordinates.column+':'+item.cell_coordinates.row;
      });
      return a;
    };
    return that;
  };

  var Cell = function(v, i) {
    var value = v;
    var index = i;
    var col = (function() {
      return index % APP.Collective.getColumnCount() + 1;
    })();
    var row = (function() {
      return Math.ceil((index + 1) / APP.Collective.getColumnCount());
    })();
    var neighbors = null;

    var that = {};
    that.initialize = function() {
    };
    that.get = function(p) {
      if (p === undefined) return null;
      switch (p.toLowerCase()) {
        case 'index': return index;
        case 'value': return value;
        case 'alive': return this.isAlive();
        case 'column': return this.getColumn();
        case 'row': return this.getRow();
        case 'cell_coordinates': return this.getCellCoordinates();
        case 'unique_neighbors': return this.getNeighbors(false).getUnique();
        default: return null;
      }
    };
    that.getColumn = function() {return col;};
    that.getRow = function() {return row;};
    that.getCellCoordinates = function() {return {"column":this.getColumn(), "row":this.getRow()}};
    that.getNeighbors = function(force) {
      if (neighbors == null || force == true) {
        neighbors = new CellNeighbors(this);
      }
      return neighbors;
    };
    that.findNeighbors = function() {
      return this.getNeighbors(true);
    };
    that.isAlive = function() {
      return value > 0;
    };
    that.toggleAlive = function() {
      value = this.isAlive() ? 0 : 1;
    };
    that.highlight = function() {
      var elem = $('td[data-cell_coordinates="{\"column\":' + this.get('column') + ', \"row\":' + this.get('row') + '}"]');
      elem.addClass('highlight');
    };
    that.determineState = function() {
      var total = 0;
/*
      console.dir(this.getCellCoordinates());

      _.each(this.get('unique_neighbors'), function(o) {
          console.dir(o.cell_coordinates);
          console.log(o.cell.isAlive());
          o.cell.highlight();
        }
      );

      console.log('number of neighbors: '+this.get('unique_neighbors').length);
*/
      _.each(
        _.map(this.get('unique_neighbors'), function(o) {return o.cell}),
          function(cell) {if (cell.isAlive()) total++;}
      );
      value = (total == 2 || total == 3) ? 1 : 0;
      //console.log('total='+total+'; value='+value);
      return value;
    };
    that.render = function() {
      var elem = $('td[data-cell_coordinates="{\"column\":' + this.get('column') + ', \"row\":' + this.get('row') + '}"]');
      /**
       * @todo move this to another event, for efficiency
       */
      elem.removeClass('clicked');
      /* . */

      elem.removeClass('on');
      elem.removeClass('off');
      elem.addClass(this.isAlive()?'on':'off');
    };
    that.on = function(event) {
      switch (event.toLowerCase()) {
        case 'cell-click':
          this.handleClick();
          break;
        case 'cell-neighbor-state-change':
          this.handleStateChange();
          break;
      }
    };
    that.handleClick = function() {
      this.toggleAlive();
      this.render();

//        console.log('clicked cell');
//        console.dir(this.getCellCoordinates());

      // Randomize results.  This more closely mimics reality because the
      // same entity doesn't complete the job first.
      _.each(_.shuffle(
        _.map(this.get('unique_neighbors'), function(o) {return o.cell})
        ), function(cell) {
         APP.EventQueue.add({"target":cell, "event":"cell-neighbor-state-change"});
      });
    };
    that.handleStateChange = function() {
//        console.log('-- handle state change --');
      var old_state = value;
      var new_state = this.determineState();

      /**.**/
      this.render();

      if (old_state != new_state) {
        // Randomize results.  This more closely mimics reality because the
        // same entity doesn't complete the job first.
        _.each(_.shuffle(
          _.map(this.get('unique_neighbors'), function(o) {return o.cell})
          ), function(cell) {
           APP.EventQueue.add({"target":cell, "event":"cell-neighbor-state-change"});
        });
      }
    };
    return that;
  };
})(jQuery);

var data = [];
_(1000).times(function(n) {data.push(0)});
APP.Collective.initialize(data);

  var createTable = function() {
    var num_cols = APP.Collective.getColumnCount();
    var num_rows = APP.Collective.getRowCount();

    var elem, t, i, j;

    elem = $('#output thead');
    t = '';
    for (i=0; i < num_cols; i++) {
      t += '<th class="col" data="' + (i+1) + '"></th>';
    }
    elem.append(t);

    elem = $('#output tbody');
    for (i=0; i < num_rows; i++) {
      t = '';
      for (j=0; j < num_cols; j++) {
        t += '<td class="cell" data-cell_coordinates="{&quot;column&quot;:' + (j+1) + ', &quot;row&quot;:' + (i+1) + '}">&nbsp;</td>';
      }
      elem.append('<tr class="row" data="' + (i+1) + '">' + t + '</tr>')
    }
  }

  var appendEvents = function() {
    $('#output td').bind('click', function() {
        var td = $(event.target);
        var coords = $.parseJSON(td.attr('data-cell_coordinates'));
        var cell = APP.Collective.getCellByCellCoordinates(coords);
        cell.on('cell-click');

        td.removeClass('off');
        td.removeClass('on');
        td.removeClass('alive').addClass('clicked').addClass(cell.isAlive()?'on':'off');
    });
  }

  var populateTable = function() {
    _.each(APP.Collective.get('cells'), function(cell) {
      cell.render();
    });
  }

  createTable();
  appendEvents();
  populateTable();

var fncEach = function(evnt){
  evnt.target.on(evnt.event);
}
var fncEvery = function(evnt, n, total, addAttempt) {
  console.log('=== historical index '+n+'; items in event queue '+total+'; add attempt: '+addAttempt+' ===');
};
var fncUnique = function(evnt, list) {
  var len = list.length;
  var i;
  for (i=0; i < len; ++i) {
    if (evnt.target == list[i].target && evnt.event == list[i].event) {
      return false;
    }
  }
  return true;
}
var fncOnEnd = function(list, total, index) {
  console.log('== POPULATION DIES OFF ==');
}
APP.EventQueue.poll(50).each(fncEach).every(100, fncEvery).unique(fncUnique).onEnd(fncOnEnd);


/*
var go = $('button').asEventStream('click');
go.onValue(function(v) {
  APP.EventQueue.start();
});*/

$('button').bind('click', function() {
  APP.EventQueue.start();
});

