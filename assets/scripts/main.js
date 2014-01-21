/**
 * Created by dev on 1/1/14.
 *
 * Fix "life" logic.
 * Use 'use strict'.
 * Fix "animation" on birth & death of cell.
 *  - fix close animation
 *  - default to dark gray
 *  - animation in 5 steps, first is dark gray, then white of same size
 * Add unattached functions to Collective or where appropriate.
 * Be able to add a column, row to table--top, bottom, left, right.
 * Make layout responsive.
 * Convert to Canvas.
 *
 * [ARCHIVED]
 * Add in Packet to Cell.
 * Add in renderers for Packet and Cell.
 * Remove use of indices as indicators.
 * Extract Broadcaster, BroadcastReceiver, BroadcastHandlerManager
 * - mixins with state
 * - need to create BroadcastReceiver
 *   - it will have an onBroadcast method that looks to
 *     the BroadcastHandlerManager
 *     - or better, combine those two to just BroadcastReceiver
 *
 * Research bacon js
 *
 * _Here's the problem: I can't just fire events from the cell itself, because
 *  that would trigger a back and forth on a set of cells.   None of the other
 *  cells would get any action.  Instead they need to go into a queue.
 * _But when and how do events get pulled from that queue?
 * _A cool thing would be able to mimic parallelism.  Not sure if that's possible
 *  because at some level there is always one thing that needs to fire a timer,
 *  and then for only one thing at a time.
 */
/**
 * Don't use index arithmetic for determining location; use column & row
 * coordinates instead.
 * When a new column or row is added, each of its cells should communicate to
 * its neighbors that it's been added.
 */

Function.prototype.inherits = function(parent) {
  this.prototype = Object.create(parent.prototype);
};

var App;
(function($) {
  App = new function() {
    this.extend = function(destination, source) {
      for (var k in source) {
        if (source.hasOwnProperty(k)) {
          destination[k] = source[k];
        }
      }
      return destination;
    }
    return this;
  };

  /**
   * SuperSmallTrueEventQueue
   * - general-purpose
   * - easy-to-use
   *
   * sample: space invaders animation
   *   - animate creature
   *   - animate movement
   * @returns {{poll: Function, pluck: Function, each: Function, every: Function, add: Function, start: Function}}
   * @constructor
   */
  EventQueue = function() {
    var interval;
    var events = [];
    var iterationLimit = null;
    var pollMilliseconds = 1000;
    var pluckFnc = function(a, i, n) {return a.shift();};
    var pluckNumber = 1;
    var everyNumber = 0;
    var eachFnc = function(o, n) {};
    var everyFnc = function(o, currentCount, currentLength) {};
    var uniqueFnc = function(o, list) {return true;};
    var onEndFnc = function(list, currentCount, n) {};

    /**
     * @todo
     * For testing only.  Remove.
     */
    var addAttempt = 0;

    // traverse
    //   -- one way
    //   -- back & forth
    //   -- cycle

    var execCount = 0;
    var execFnc = function() {
      var event;

     // if (iterat) {
        for ( var i=1; i <= pluckNumber; i++) {
          if (events.length == 0) {
            onEndFnc(events, execCount, i);
            break;
          }
          event = pluckFnc(events, i, execCount);

          if (everyNumber > 0 && execCount % everyNumber == 0) {
            everyFnc(event, execCount, events.length+1, addAttempt);
          }
          eachFnc(event, ++execCount);
        }

        if (events.length == 0) {
          onEndFnc(events, execCount, i);
        }
      //} else {

      //}
    }

    return {
      poll: function(n) {
        pollMilliseconds = n;
        return this;
      },
      pluck: function(n, fnc) {
        pluckNumber = n;
        pluckFnc = fnc;
        return this;
      },
      unique: function(fnc) {
        uniqueFnc = fnc;
        return this;
      },
      sometimes: function(n, fnc) {
        // The parameter n is either a number (1-99) or function.
        // If 1-99, compare against rand function for ~percent.
        // Function should return a boolean.
        return this;
      },
      limit: function(n) {
        iterationLimit = n;
      },
      each: function(fnc) {
        eachFnc = fnc;
        return this;
      },
      every: function(n, fnc) {
        everyNumber = n;
        everyFnc = fnc;
        return this;
      },
      add: function(o) {
        addAttempt++;
        if (uniqueFnc(o, events)) {
          events.push(o);
        }
        return this;
      },
      clear: function(o) {
        return this;
      },
      start: function() {
        interval = setInterval(execFnc, pollMilliseconds);
        return this;
      },
      stop: function() {
        return this;
      },
      pause: function() {
        return this;
      },
      restart: function(o) {
        return this;
      },
      onStart: function(o) {
        return this;
      },
      onStop: function(o) {
        return this;
      },
      onEnd: function(o) {
        return this;
      },
      onPause: function(o) {
        return this;
      },
      onRestart: function(o) {
        return this;
      }
    }
  };

  /**
   * Mix-in for broadcasting messages of various types.
   *
   * @returns {{addChannel: Function, addListener: Function, broadcast: Function}}
   * @constructor
   */
  var Broadcaster = function() {
    var DEFAULT_CHANNEL ="_default_";
    var channels = {DEFAULT_CHANNEL:[]};

    return {
      addChannel: function(channel) {
        if(typeof channels[channel] == 'undefined')
          channels[channel] = [];
      },
      addListener: function(listener, channel) {
        if(!channels.hasOwnProperty(channel)) {
          this.addChannel(channel);
        }
        channels[channel].push(listener);
      },
      broadcast: function(type, msg, channel) {
        channel = (channel == null) ? DEFAULT_CHANNEL : channel;
        if(!channels.hasOwnProperty(channel))
          return;

        var len = channels[channel].length;
        for(var i=0; i < len; i++) {
          channels[channel][i].onBroadcast(type, msg);
        }
      }
    };
  }

  /**
   * Mix-in for handling messages of various types.
   *
   * @param p
   * @returns {{on: Function, handle: Function, clear: Function}}
   * @constructor
   */
  var BroadcastHandlerManager = function() {
    var handlers = {};

    return {
      on: function(type, fnc) {
        if(!handlers.hasOwnProperty(type)) {
          handlers[type] = [];
        }
        handlers[type].push(fnc);
      },
      handle: function(type, msg, receiver) {
        if(!handlers.hasOwnProperty(type))
          return;
        for(var i=0; i < handlers[type].length; i++) {
          handlers[type][i](type, msg, receiver);
        }
      },
      clear: function(type) {
        handlers[type] = [];
        handlers[type].length = 0;
      }
    };
  }

  var Collective = new function() {
    var COLUMN_COUNT = 40;
    var WRAPS = false;  // Is the world round or flat?
    var cells = [];
    return {
      initialize: function(data) {
        for (var i=0; i < data.length; i++) {
          cells.push(new Cell(data[i], i));
        }

        var cell_stream;
        _.each(this.get('cells'), function(cell) {
          cell.initialize();
        });
      },
      getCells: function() {return cells;},
      get: function(p) {
        if (p === undefined) return null;
        switch (p.toLowerCase()) {
          case 'cells': return this.getCells();
          case 'cell_count': return this.getCellCount();
          case 'column_count': return this.getColumnCount();
          case 'row_count': return this.getRowCount();
          case 'wraps': return this.isWrapping();
          default: return null;
        }
      },
      getCellByIndex: function(i) {
        return this.isCellIndexValid(i) ? cells[i] : null;
      },
      getCellByCellCoordinates: function(o) {
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
      },
      getCellsByColumn: function(v) {
        var a = [];
        _.each(cells, function(o) {
          if (o.getColumn() == v) {
            a.push(o);
          }
        });
        return a;
      },
      getCellsByRow: function(v) {
        var a = [];
        _.each(cells, function(o) {
          if (o.getRow() == v) {
            a.push(o);
          }
        });
        return a;
      },
      isCellIndexValid: function(i) {
        return i !== undefined && i >= 0 && i < cells.length;
      },
      areCellCoordinatesValid: function(o) {
        if (o.column < 1 || o.column > this.getColumnCount()) {
          return false;
        }
        if (o.row < 1 || o.row > this.getRowCount()) {
          return false;
        }
        return true;
      },
      getCellCount: function() { return cells.length; },
      getColumnCount: function() { return COLUMN_COUNT; },
      getRowCount: function() {
        return Math.ceil(this.getCellCount() / this.getColumnCount());
      },
      isWrapping: function() { return WRAPS; },
      broadcast: function(evnt) {
        console.log(evnt.msg);
      }
    };
  }

  var CellNeighborFinder = function(cell) {
    /**
     * @todo Add functionality for if the world is round.
     */

    var col = cell.get('column'), row = cell.get('row');
    var index = cell.get('index');

    var possible_neighbors = {
      "north":[
        {"cell_coordinates": {"column":col-1, "row":row-1}, "relationships":["neighbor"], "index":null, "determine": function(i) {return i - Collective.getColumnCount() - 1;}},
        {"cell_coordinates": {"column":col, "row":row-1}, "relationships":["neighbor", "rank", "column"], "index":null, "determine": function(i) {return i - Collective.getColumnCount();}},
        {"cell_coordinates": {"column":col+1, "row":row-1}, "relationships":["neighbor"], "index":null, "determine": function(i) {return i - Collective.getColumnCount() + 1;}}],
      "south":[
        {"cell_coordinates": {"column":col-1, "row":row+1}, "relationships":["neighbor"], "index":null, "determine": function(i) {return i + Collective.getColumnCount() - 1;}},
        {"cell_coordinates": {"column":col, "row":row+1}, "relationships":["neighbor", "rank", "column"], "index":null, "determine": function(i) {return i + Collective.getColumnCount();}},
        {"cell_coordinates": {"column":col+1, "row":row+1}, "relationships":["neighbor"], "index":null, "determine": function(i) {return i + Collective.getColumnCount() + 1;}}],
      "east":[
        {"cell_coordinates": {"column":col+1, "row":row-1}, "relationships":["neighbor"], "index":null, "determine": function(i) {return i + 1 - Collective.getColumnCount();}},
        {"cell_coordinates": {"column":col+1, "row":row}, "relationships":["neighbor", "rank", "row"], "index":null, "determine": function(i) {return i + 1;}},
        {"cell_coordinates": {"column":col+1, "row":row+1}, "relationships":["neighbor"], "index":null, "determine": function(i) {return i + 1 + Collective.getColumnCount();}}],
      "west":[
        {"cell_coordinates": {"column":col-1, "row":row-1}, "relationships":["neighbor"], "index":null, "determine": function(i) {return i - 1 - Collective.getColumnCount();}},
        {"cell_coordinates": {"column":col-1, "row":row}, "relationships":["neighbor", "rank", "row"], "index":null, "determine": function(i) {return i - 1;}},
        {"cell_coordinates": {"column":col-1, "row":row+1}, "relationships":["neighbor"], "index":null, "determine": function(i) {return i - 1 + Collective.getColumnCount();}}]
    };

    return {
      find: function(boundary) {
        if (!possible_neighbors.hasOwnProperty(boundary))
          return [];
        var a = this.filter(possible_neighbors[boundary]);
        _.each(a, this.determineIndex);
        return a;
      },
      filter: function(p) {
        var a = [];
        _.each(p, function(v) {
            if (Collective.areCellCoordinatesValid(v.cell_coordinates)) {
              a.push(v);
            }
        });
        return a;
      },
      determineIndex: function(v) {
        v.index = v.determine(index);
      }
    }
  }

  var CellNeighbors = function(cell) {
    var boundaries = (function buildBoundaries() {
      var n = [], e = [], s = [], w = [];
      var a = [], o = null;

      var finder = new CellNeighborFinder(cell);
      var apply = function(v) {
        o = Collective.getCellByCellCoordinates(v.cell_coordinates);
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
    return {
      types: (function(b){return _.keys(b)})(boundaries),
      get: function(p) {
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
      },
      getUnique: function() {
        var a = [];
        _.each(this.types, function(v) {
          _.each(boundaries[v], function(v) {
            a.push(v);
          });
        });

//        _.each(a, function(o) {
//          console.log('neighbor');
//          console.dir(o.cell_coordinates);
//        });
//        var aUnique = [];
//        for (var i=0; i < a.length; ++i) {
//          if (i == 0) {
//            aUnique.push(a[i]);
//          } else {
//            for (var j=0; j < aUnique.length; ++j) {
//              if (a[i].cell.cell_coordinates == aUnique[j].cell.cell_coordinates) {
//                break;
//              }
//              aUnique.push(a[i]);
//            }
//          }
//        }
//        a = _.uniq(a, false, function(v1, v2) {
//          return v1.cell_coordinates != v2.cell_coordinates;
//        });
//        return aUnique;
        a = _.uniq(a);
        return a;
      }
    };
  }

  var Cell = function(v, i) {
    var value = v;
    var index = i;
    var col = (function() {
      return index % Collective.getColumnCount() + 1;
    })();
    var row = (function() {
      return Math.ceil((index + 1) / Collective.getColumnCount());
    })();
    var neighbors = null;

    var DEFAULT_CHANNEL ="_default_";
    var channels = {DEFAULT_CHANNEL:[]};

    var handlers = {};

    return $.extend(this, {
      initialize: function() {
      },
      get: function(p) {
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
      },
      getColumn: function() {return col;},
      getRow: function() {return row;},
      getCellCoordinates: function() {return {"column":this.getColumn(), "row":this.getRow()}},
      getNeighbors: function(force) {
        if (neighbors == null || force == true) {
          neighbors = new CellNeighbors(this);
        }
        return neighbors;
      },
      findNeighbors: function() {
        return this.getNeighbors(true);
      },
      isAlive: function() {
        return value > 0;
      },
      toggleAlive: function() {
        value = this.isAlive() ? 0 : 1;
      },
      highlight: function() {
        var elem = $('td[data-cell_coordinates="{\"column\":' + this.get('column') + ', \"row\":' + this.get('row') + '}"]');
        elem.addClass('highlight');
      },
      determineState: function() {
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
      },
      render: function() {
        var elem = $('td[data-cell_coordinates="{\"column\":' + this.get('column') + ', \"row\":' + this.get('row') + '}"]');
        /**
         * @todo move this to another event, for efficiency
         */
        elem.removeClass('clicked');
        /* . */

        elem.removeClass('on');
        elem.removeClass('off');
        elem.addClass(this.isAlive()?'on':'off');
      },
      on: function(event) {
        switch (event.toLowerCase()) {
          case 'cell-click':
            this.handleClick();
            break;
          case 'cell-neighbor-state-change':
            this.handleStateChange();
            break;
        }
      },
      handleClick: function() {
        this.toggleAlive();
        this.render();

        // Randomize results.  This more closely mimics reality because the
        // same entity doesn't complete the job first.
        _.each(_.shuffle(
          _.map(this.get('unique_neighbors'), function(o) {return o.cell})
          ), function(cell) {
            App.EventQueue.add({"target":cell, "event":"cell-neighbor-state-change"});
        });
      },
      handleStateChange: function() {
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
              App.EventQueue.add({"target":cell, "event":"cell-neighbor-state-change"});
          });
        }
      }
    });
  }

  App.EventQueue = new EventQueue();
  App.Collective = Collective;
})(jQuery);

var data = [];
_(1000).times(function(n) {data.push(0)});
App.Collective.initialize(data);

  var createTable = function() {
    var num_cols = App.Collective.getColumnCount();
    var num_rows = App.Collective.getRowCount();

    var elem, t;

    elem = $('#output thead');
    t = '';
    for (var i=0; i < num_cols; i++) {
      t += '<th class="col" data="' + (i+1) + '"></th>';
    }
    elem.append(t);

    elem = $('#output tbody');
    for (var i=0; i < num_rows; i++) {
      t = '';
      for (var j=0; j < num_cols; j++) {
        t += '<td class="cell" data-cell_coordinates="{&quot;column&quot;:' + (j+1) + ', &quot;row&quot;:' + (i+1) + '}">&nbsp;</td>';
      }
      elem.append('<tr class="row" data="' + (i+1) + '">' + t + '</tr>')
    }
  }

  var appendEvents = function() {
    $('#output td').bind('click', function() {
        var td = $(event.target);
        var coords = $.parseJSON(td.attr('data-cell_coordinates'));
        var cell = App.Collective.getCellByCellCoordinates(coords);
        cell.on('cell-click');

        td.removeClass('off');
        td.removeClass('on');
        td.removeClass('alive').addClass('clicked').addClass(cell.isAlive()?'on':'off');
    });
  }

  var populateTable = function() {
    _.each(App.Collective.get('cells'), function(cell) {
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
  for (var i=0; i < len; ++i) {
    if (evnt.target == list[i].target && evnt.event == list[i].event) {
      return false;
    }
  }
  return true;
}
var fncOnEnd = function(list, total, index) {
  console.log('== POPULATION DIES OFF ==');
}
App.EventQueue.poll(50).each(fncEach).every(100, fncEvery).unique(fncUnique).onEnd(fncOnEnd);


/*
var go = $('button').asEventStream('click');
go.onValue(function(v) {
  App.EventQueue.start();
});*/

$('button').bind('click', function() {
  App.EventQueue.start();
});

