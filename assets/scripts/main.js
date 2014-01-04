/**
 * Created by dev on 1/1/14.
 *
 * Add in Event handling via Mediator.
 * Be able to run "life."
 * Create as a Self-Invoking Function.
 * Use 'use strict'.
 * Add unattached functions to Collective or where appropriate.
 * Add in Packet to Cell.
 * Add in renderers for Packet and Cell.
 * Remove use of indices as indicators.
 * Be able to add a column, row to table--top, bottom, left, right.
 */
/**
 * Don't use index arithmetic for determining location; use column & row
 * coordinates instead.
 * When a new column or row is added, each of its cells should communicate to
 * its neighbors that it's been added.
 */
var Collective = new function() {
  var COLUMN_COUNT = 5;
  var WRAPS = false;  // Is the world round or flat?
  var cells = [];
  return {
    initialize: function(data) {
      for (var i=0; i < data.length; i++) {
        cells.push(new Cell(data[i], i));
      }
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
  }
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

    /**
     * if the state changed, broadcast a message to all neighbors
     */
    console.log('n');
    console.log(n);
    console.log('s');
    console.log(s);
    console.log('e');
    console.log(e);
    console.log('w');
    console.log(w);
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
    isAlive: function() {
      return value > 0;
    },
    toggleAlive: function() {
      value = this.isAlive() ? 0 : 1;
    },
    render: function() {
      $('td[data-cell_coordinates="{\"column\":' + this.get('column') + ', \"row\":' + this.get('row') + '}"]').text(this.get('index') + (this.isAlive() ? '*' : ''));
    }
  }
}
var data = [];
_(50).times(function(n) {data.push(0)});
Collective.initialize(data);

var createTable = function() {
  var num_cols = Collective.getColumnCount();
  var num_rows = Collective.getRowCount();

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
  $('#output td').bind('click', function(n) {
    $('#output td').removeClass('active');
    $('#output td').removeClass('rank');
    $('#output td').removeClass('neighbor');

    var td = $(this);
    var coords = $.parseJSON(td.attr('data-cell_coordinates'));
    var cell = Collective.getCellByCellCoordinates(coords);
    var col = cell.get('column');
    var row = cell.get('row');

    cell.toggleAlive();
    cell.render();

    var neighbors = cell.getNeighbors().getUnique();
    console.log('neighbors');
    console.log(neighbors);
    _.each(neighbors, function(v) {
      $('#output td[data-cell_coordinates="{\"column\":' + v.cell.get('column') + ', \"row\":' + v.cell.get('row') + '}"]').addClass('neighbor');
    });
    /*
    var col_cells = Collective.getCellsByColumn(col);
    _.each(col_cells, function(o) {
      $('#output td[data="' + o.get('index') + '"]').removeClass('neighbor').addClass('rank');
    });
    var row_cells = Collective.getCellsByRow(row);
    _.each(row_cells, function(o) {
      $('#output td[data="' + o.get('index') + '"]').removeClass('neighbor').addClass('rank');
    });
    */
    // The class "rank" was added by above.
    td.removeClass('neighbor').removeClass('rank').addClass('active');

    var t = '';
    t += 'classes:     ' + td.attr('class') + '\n';
    t += 'data_coords: ' + JSON.stringify(coords) + '\n';

    if (cell != null) {
      t += 'index:       ' + cell.get('index') + '\n';
      t += 'value:       ' + cell.get('value') + '\n';
      t += 'alive:       ' + cell.get('alive') + '\n';
      t += 'column:      ' + col + '\n';
      t += 'row:         ' + row + '\n';
      t += 'neighbors:   ' + JSON.stringify(cell.getNeighbors().getUnique(true)) + '\n';
    }
    $('#details').text(t);
  });
}

var populateTable = function() {
  _.each(Collective.get('cells'), function(o) {
    o.render();
  });
}

createTable();
appendEvents();
populateTable();
