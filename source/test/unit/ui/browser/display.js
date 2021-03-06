JS.Test.Unit.UI.Browser.TestRunner.extend({
  Display: new JS.Class({
    extend: {
      getInstance: function() {
        return this._instance = this._instance || new this();
      },
      
      Context: new JS.Class({
        initialize: function(type, parent, name) {
          this._parent   = parent;
          this._type     = type;
          this._children = [];
          
          if (name === undefined) {
            this._ul = parent;
            return;
          }
          
          this._constructDOM(name);
        },
        
        _constructDOM: function(name) {
          var self = this, container = this._parent._ul || this._parent,
              fields = {_tests: 'T', _failures: 'F'};
          
          this._li = new JS.DOM.Builder(container).li({className: this._type + ' passed closed'},
          function(li) {
            li.ul({className: 'stats'}, function(ul) {
              for (var key in fields)
                ul.li(function(li) {
                  li.span({className: 'letter'}, fields[key] + ': ');
                  self[key] = li.span({className: 'number'}, '0');
                });
            });
            if (name) self._toggle = li.p({className: self._type + '-name'}, name);
            self._ul = li.ul({className: 'children'});
          });
          
          JS.DOM.Event.on(this._toggle, 'click', function() {
            JS.DOM.toggleClass(this._li, 'closed');
          }, this);
        },
        
        child: function(name) {
          return this._children[name] = this._children[name] ||
                                        new this.klass('spec', this, name);
        },
        
        addTest: function(name) {
          var test = this._children[name] = new this.klass('test', this, name);
          test.ping('_tests');
        },
        
        addFault: function(message) {
          var item = JS.DOM.li({className: 'fault'}, function(li) {
            li.p(function(p) {
              var parts = message.split(/[\r\n]+/);
              parts.splice(1,1);
              
              for (var i = 0, n = parts.length; i < n; i++) {
                if (i > 0) p.br();
                p.concat(parts[i]);
              }
            });
          });
          this._ul.appendChild(item);
          this.ping('_failures');
          this.fail();
        },
        
        ping: function(field) {
          if (!this[field]) return;
          this[field].innerHTML = parseInt(this[field].innerHTML) + 1;
          if (this._parent.ping) this._parent.ping(field);
        },
        
        fail: function() {
          if (!this._li) return;
          JS.DOM.removeClass(this._li, 'passed');
          JS.DOM.addClass(this._toggle, 'failed');
          if (this._parent.fail) this._parent.fail();
        }
      })
    },
    
    initialize: function() {
      this._constructDOM();
      document.body.insertBefore(this._container, document.body.firstChild);
    },
    
    _constructDOM: function() {
      var self = this;
      self._container = JS.DOM.div({className: 'test-result-container'}, function(div) {
        div.table({className: 'report'}, function(table) {
          table.thead(function(thead) {
            thead.tr(function(tr) {
              tr.th({scope: 'col'}, 'Tests');
              tr.th({scope: 'col'}, 'Assertions');
              tr.th({scope: 'col'}, 'Failures');
              tr.th({scope: 'col'}, 'Errors');
            });
          });
          table.tbody(function(tbody) {
            tbody.tr(function(tr) {
              self._tests      = tr.td();
              self._assertions = tr.td();
              self._failures   = tr.td();
              self._errors     = tr.td();
            });
          });
        });
        self._context = new self.klass.Context('spec', div.ul({className: 'specs'}));
        self._summary = div.p({className: 'summary'});
      });
    },
    
    setTestCount: function(n) {
      this._tests.innerHTML = String(n);
    },
    
    setAssertionCount: function(n) {
      this._assertions.innerHTML = String(n);
    },
    
    setFailureCount: function(n) {
      this._failures.innerHTML = String(n);
    },
    
    setErrorCount: function(n) {
      this._errors.innerHTML = String(n);
    },
    
    addTestCase: function(testCase) {
      var data    = this._testData(testCase),
          name    = data.name,
          context = data.context;
      
      context.addTest(name);
    },
    
    finishTestCase: function(testCase) {
    
    },
    
    addFault: function(testCase, fault) {
      var data    = this._testData(testCase),
          name    = data.name,
          context = data.context;
      
      context.child(name).addFault(fault.longDisplay());
    },
    
    printSummary: function(elapsedTime) {
      this._summary.innerHTML = 'Finished in ' + elapsedTime + ' seconds.';
    },
    
    _testData: function(testCase) {
      var name    = testCase.name(),
          klass   = testCase.klass,
          context = klass.getContextName ? klass.getContextName() : klass.displayName,
          parents = new JS.Enumerable.Collection();
      
      name = name.replace(context, '')
                 .replace(context, '')
                 .replace(/\(.*?\)$/g, '')
                 .replace(/^test\W+/g, '');
      
      while (klass !== JS.Test.Unit.TestCase) {
        parents.push(klass);
        klass = klass.superclass;
      }
      
      context = parents.reverseForEach().inject(this._context, function(context, klass) {
        return context.child(klass._contextName || klass.displayName);
      });
      return {name: name, context: context};
    }
  })
});

