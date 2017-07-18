(function(global, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    var wrapper = function(w) {
      if (!w.document) {
        throw new Error('AnyChart requires a window with a document');
      }
      factory.call(w, w, w.document);
      w.acgraph.isNodeJS = true;
      w.anychart.getGlobal = function() {
        return w;
      };
      return w.anychart;
    };
    module.exports = global.document ? wrapper(global) : wrapper;
  } else {
    factory.call(global, window, document)
  }
})(typeof window !== 'undefined' ? window : this, function(window, document, opt_noGlobal) {
  
});