/**
 * Created by dev on 1/1/14.
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
 *
 * Be able to run "life."
 * Use 'use strict'.
 * Add unattached functions to Collective or where appropriate.
 * Add in Packet to Cell.
 * Add in renderers for Packet and Cell.
 * Remove use of indices as indicators.
 * Extract Broadcaster, BroadcastReceiver, BroadcastHandlerManager
 * - mixins with state
 * - need to create BroadcastReceiver
 *   - it will have an onBroadcast method that looks to
 *     the BroadcastHandlerManager
 *     - or better, combine those two to just BroadcastReceiver
 * Be able to add a column, row to table--top, bottom, left, right.
 */
/**
 * Don't use index arithmetic for determining location; use column & row
 * coordinates instead.
 * When a new column or row is added, each of its cells should communicate to
 * its neighbors that it's been added.
 */
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
    var COLUMN_COUNT = 5;
    var WRAPS = false;  // Is the world round or flat?
    var cells = [];
    return {
      initialize: function(data) {
        for (var i=0; i < data.length; i++) {
          cells.push(new Cell(data[i], i));
        }

        _.each(this.get('cells'), function(cell) {
          _.each(cell.findNeighbors().getUnique(), function(v) {
            if (_.contains(v.relationships, 'neighbor')) {
              cell.addListener(v.cell, 'neighbor');
            }
            if (_.contains(v.relationships, 'rank')) {
              cell.addListener(v.cell, 'rank');
            }
            if (_.contains(v.relationships, 'column')) {
              cell.addListener(v.cell, 'column');
            }
            if (_.contains(v.relationships, 'row')) {
              cell.addListener(v.cell, 'row');
            }
          });
        });

        /*
        jQuery(document).asEventStream('cell_state_change')
          .onValue(function(event) {
            console.log('STATE CHANGE');
            console.dir(event.target);
        });
        */
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
      isWrapping: function() { return WRAPS; }
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
        console.log(v);
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
      getUnique: function(sort) {
        var a = [];
        _.each(this.types, function(v) {
          _.each(boundaries[v], function(v) {
            a.push(v);
          });
        });
        a = _.uniq(a);
        return (sort !== undefined && sort) ? a.sort(function(n1, n2) {return n1 - n2;}) : a;
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

    return {
      draw: function() {
        var s = '|'+(value > 0 ? '*' : ' ') +'|';
        return s;
      },
      get: function(p) {
        if (p === undefined) return null;
        switch (p.toLowerCase()) {
          case 'index': return index;
          case 'value': return value;
          case 'alive': return this.isAlive();
          case 'column': return this.getColumn();
          case 'row': return this.getRow();
          default: return null;
        }
      },
      getColumn: function() {return col;},
      getRow: function() {return row;},
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
      determineState: function() {

      },
      render: function() {
        $('td[data-cell_coordinates="{\"column\":' + this.get('column') + ', \"row\":' + this.get('row') + '}"]').html((this.isAlive() ? '&#8226' : '&nbsp;'));
      },
      activate: function() {
        var col = this.get('column');
        var row = this.get('row');

        /**
         * @todo
         * Replace with rules for determining state
         */
        this.toggleAlive();

        /**.**/
        this.render();

        this.broadcast('clicked_neighbor', {"source":this}, 'neighbor');
        this.broadcast('clicked_in_rank', {"source":this}, 'rank');
        this.broadcast('clicked_in_column', {"source":this}, 'column');
        this.broadcast('clicked_in_row', {"source":this}, 'row');

        //jQuery(document).trigger('cell_state_change', this);
      },

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
        console.log(channel);
        console.log(channels);
        channel = (channel == null) ? DEFAULT_CHANNEL : channel;
        if(!channels.hasOwnProperty(channel))
          return;

        var len = channels[channel].length;
        console.log('Send message to this many  '+len);
        for(var i=0; i < len; i++) {
          channels[channel][i].onBroadcast(type, msg);
        }
      },

      onBroadcast: function(type, msg) {
        switch(type) {
          case 'clicked_neighbor':
            $('#output td[data-cell_coordinates="{\"column\":' + this.get('column') + ', \"row\":' + this.get('row') + '}"]').addClass('neighbor');
            return;
          case 'clicked_in_rank':
            $('#output td[data-cell_coordinates="{\"column\":' + this.get('column') + ', \"row\":' + this.get('row') + '}"]').addClass('rank');
            return;
          case 'clicked_in_column':
            $('#output td[data-cell_coordinates="{\"column\":' + this.get('column') + ', \"row\":' + this.get('row') + '}"]').addClass('column');
            return;
          case 'clicked_in_row':
            $('#output td[data-cell_coordinates="{\"column\":' + this.get('column') + ', \"row\":' + this.get('row') + '}"]').addClass('row');
            return;
        }
      },
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
    }
  }
  /*
  App.extend(Cell.prototype, Broadcaster);
  App.extend(Cell.prototype, BroadcastMessageHandlerManager);
  */
  App.Collective = Collective;
})(jQuery);

  var data = [];
  _(50).times(function(n) {data.push(0)});
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
    $('#output td').bind('click', function() {$(this).trigger('cell_click');});

    $('#output td').asEventStream('cell_click').onValue(function(event) {
        $('#output td').removeClass('active');
        $('#output td').removeClass('row');
        $('#output td').removeClass('column');
        $('#output td').removeClass('rank');
        $('#output td').removeClass('neighbor');
;
        var td = $(event.target);
        var coords = $.parseJSON(td.attr('data-cell_coordinates'));
        var cell = App.Collective.getCellByCellCoordinates(coords);
        cell.activate();

        // The class "rank" was added by above.
        td.removeClass('neighbor').removeClass('rank').addClass('active');
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

  var go = $('button').asEventStream('click');
  go.onValue(function(v) {
    alert('button clicked!');
  });

  var go1 = jQuery(document).asEventStream('state_change');
  go1.onValue(function(v) {
    console.log('got it ' + v);
    console.dir(v);
  })
  jQuery(document).trigger('state_change', 3);

