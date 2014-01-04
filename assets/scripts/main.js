/**
 * Created by dev on 1/1/14.
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
var CellNeighbors = function(cell) {
  var boundaries = (function buildBoundaries() {
    var n = [], e = [], s = [], w = [];
    var index = cell.get('index');
    var tmp;

    /**
     * Add functionality for if the world is round.
     */
    var col = cell.get('column');
    var row = cell.get('row');

    /**
     * {"neighbor":<o>, "relationships":["neighbor", "rank", "column"]}
     *
     * if the state changed, broadcast a message to all neighbors
     */

    var tst, o;
    /**
     * A better, faster way would be to determine which are valid, and then
     * determine the indices based upon that.
     *
     * If cell coordinates are valid, execute the index arithmetic for that type.
     */
    tst = [
      {"column":col-1, "row":row-1},
      {"column":col, "row":row-1},
      {"column":col+1, "row":row-1}];
    _.each(tst, function(v) {
      if (Collective.areCellCoordinatesValid(v)) {
        o = Collective.getCellByCellCoordinates(v);
        if (o == null) {
          throw Error('Expected a cell, but got null.');
        }
        n.push(o.get('index'));
      }
    });
    tst = [
      {"column":col-1, "row":row+1},
      {"column":col, "row":row+1},
      {"column":col+1, "row":row+1}];
    _.each(tst, function(v) {
      if (Collective.areCellCoordinatesValid(v)) {
        o = Collective.getCellByCellCoordinates(v);
        if (o == null) {
          throw Error('Expected a cell, but got null.');
        }
        s.push(o.get('index'));
      }
    });
    tst = [
      {"column":col+1, "row":row-1},
      {"column":col+1, "row":row},
      {"column":col+1, "row":row+1}];
    _.each(tst, function(v) {
      if (Collective.areCellCoordinatesValid(v)) {
        o = Collective.getCellByCellCoordinates(v);
        if (o == null) {
          throw Error('Expected a cell, but got null.');
        }
        e.push(o.get('index'));
      }
    });
    tst = [
      {"column":col-1, "row":row-1},
      {"column":col-1, "row":row},
      {"column":col-1, "row":row+1}];
    _.each(tst, function(v) {
      if (Collective.areCellCoordinatesValid(v)) {
        o = Collective.getCellByCellCoordinates(v);
        if (o == null) {
          throw Error('Expected a cell, but got null.');
        }
        w.push(o.get('index'));
      }
    });

    /*
    if (cell.getRow() > 1) {
      if (Collective.isCellIndexValid(tmp = index - Collective.getColumnCount() - 1)) {
        n.push(tmp);
      }
      if (Collective.isCellIndexValid(tmp = index - Collective.getColumnCount())) {
        n.push(tmp);
      }
      if (Collective.isCellIndexValid(tmp = index - Collective.getColumnCount() + 1)) {
        n.push(tmp);
      }
    }
    if (cell.getRow() < Collective.getRowCount()) {
      if (Collective.isCellIndexValid(tmp = index + Collective.getColumnCount() - 1)) {
        s.push(tmp);
      }
      console.log(s);
      if (Collective.isCellIndexValid(tmp = index + Collective.getColumnCount())) {
        s.push(tmp);
      }
      console.log(s);
      if (Collective.isCellIndexValid(tmp = index + Collective.getColumnCount() + 1)) {
        s.push(tmp);
      }
      console.log(s);
    }
    if (cell.getColumn() < Collective.getColumnCount()) {
      if (Collective.isCellIndexValid(tmp = index + 1 - Collective.getColumnCount())) {
        e.push(tmp);
      }
      if (Collective.isCellIndexValid(tmp = index + 1)) {
        e.push(tmp);
      }
      if (Collective.isCellIndexValid(tmp = index + 1 + Collective.getColumnCount())) {
        e.push(tmp);
      }
    }
    if (cell.getColumn() > 1) {
      if (Collective.isCellIndexValid(tmp = index - 1 - Collective.getColumnCount())) {
        w.push(tmp);
      }
      if (Collective.isCellIndexValid(tmp = index - 1)) {
        w.push(tmp);
      }
      if (Collective.isCellIndexValid(tmp = index - 1 + Collective.getColumnCount())) {
        w.push(tmp);
      }
    }
    */
    console.log('n');
    console.log(n);
    console.log('s');
    console.log(s);
    console.log('e');
    console.log(e);
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
    return Math.ceil((index + 1) / 5);
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
    }
  }
}
var a = [0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0];
Collective.initialize(a);
console.log(Collective.get('cells').length);

var createTable = function() {
  var num_cols = Collective.getColumnCount();
  var num_rows = Collective.getRowCount();

  var elem, t;

  elem = $('#output thead');
  t = '';
  for (var i=0; i < num_cols; i++) {
    t += '<th class="col" data="' + (i+1) + '"></td>';
  }
  elem.append(t);

  elem = $('#output tbody');
  for (var i=0; i < num_rows; i++) {
    t = '';
    for (var j=0; j < num_cols; j++) {
      t += '<td class="cell" data="' + ((i*num_cols)+j) + '">&nbsp;</td>';
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
    var data = td.attr('data');
    var cell = Collective.getCellByIndex(parseInt(data));
    var col = cell.get('column');
    var row = cell.get('row');

    var neighbors = cell.getNeighbors().getUnique();
    console.log('neighbors');
    console.log(neighbors)
    _.each(neighbors, function(v) {
      var o = Collective.getCellByIndex(v);
      $('#output td[data="' + o.get('index') + '"]').addClass('neighbor');
    });
    var col_cells = Collective.getCellsByColumn(col);
    _.each(col_cells, function(o) {
      $('#output td[data="' + o.get('index') + '"]').removeClass('neighbor').addClass('rank');
    });
    var row_cells = Collective.getCellsByRow(row);
    _.each(row_cells, function(o) {
      $('#output td[data="' + o.get('index') + '"]').removeClass('neighbor').addClass('rank');
    });
    // The class "rank" was added by above.
    td.removeClass('neighbor').removeClass('rank').addClass('active');

    var t = '';
    t += 'classes:   ' + td.attr('class') + '\n';
    t += 'data:      ' + data + '\n';

    if (cell != null) {
      t += 'index:     ' + cell.get('index') + '\n';
      t += 'value:     ' + cell.get('value') + '\n';
      t += 'alive:     ' + cell.get('alive') + '\n';
      t += 'column:    ' + col + '\n';
      t += 'row:       ' + row + '\n';
      t += 'neighbors: ' + cell.getNeighbors().getUnique(true) + '\n';
    }
    $('#details').text(t);
  });
}

var populateTable = function() {
  _.each(Collective.get('cells'), function(o) {
    $('td[data="' + o.get('index') + '"]').text(o.get('index'));
  });
}

var formatOutput = function(nodes) {
  var COLUMNS = 5;
  var s = '- - - - -\n';
  var len = nodes.length;
  var i = 0;

  while (i < len) {
    for (var col = 1; col <= COLUMNS; col++) {
      s += nodes[i].draw();
//      console.log(i + '=>' + a[i] + ' ' + col);
//      s += a[i] + '|';
      i++;

      if (col == COLUMNS) {
        s += '\n';
      }
      if (i >= len) break;
    }
  }
  s += '- - - - -\n';

  return s;
}

//var elem = $('#output');
//elem.text(formatOutput(Collective.get('cells')));

createTable();
appendEvents();
populateTable();
