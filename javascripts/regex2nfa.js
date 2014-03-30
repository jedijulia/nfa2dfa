function RegexParser() {}
RegexParser.parse = function(regex) {
  var tokens = RegexParser.tokenize(regex);
  var alphabet = 'ab';
  var concatStack = [];
  var unionStack = [];

  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    if (token.type == 'symbol') {
      if (alphabet.indexOf(token.content) >= 0) {
        var nfa = new NFA(alphabet);
        var state = nfa.addState();
        nfa.getStartState().transition(state.finalize(), token.content);
        concatStack.push(nfa);
      } else if (token.content == '*') {
        var nfa = new NFA(alphabet);
        var popped = concatStack.pop();
        var finalStates = popped.getFinalStates();
        var states = nfa.concatenate(popped);
        nfa.getStartState().finalize().transition(states[popped.getStartState().label], '~');
        for (var j = 0; j < finalStates.length; j++) {
          states[finalStates[j].label].transition(nfa.getStartState(), '~');
        }
        concatStack.push(nfa);
      } else if (token.content == '+') {
        var nfa = RegexParser.combine(concatStack);
        unionStack.push(nfa);
        concatStack = [];
      }
    } else {
      var nfa = RegexParser.parse(token.content);
      concatStack.push(nfa);
    }
  }

  var nfa = new NFA(alphabet);
  if (concatStack.length) {
    nfa = RegexParser.combine(concatStack);
  } else {
    nfa.getStartState().finalize();
  }

  if (unionStack.length) {
    unionStack.push(nfa);
    nfa = new NFA(alphabet);
    while (unionStack.length) {
      var shifted = unionStack.shift();
      var newStates = nfa.absorb(shifted);
      nfa.getStartState().transition(newStates[shifted.getStartState().label], '~');
    }
  }
  return nfa;
}

RegexParser.tokenize = function(regex) {
  var tokens = [];
  var stack = [];
  for (var i = 0; i < regex.length; i++) {
    var symbol = regex.charAt(i);
    if (symbol == '(') {
      stack.push(i);
    } else if (symbol == ')') {
      var open = stack.pop();
      if (!stack.length) {
        tokens.push({ type: 'regex', content: regex.substring(open + 1, i) });
      }
    } else {
      if (!stack.length) {
        tokens.push({ type: 'symbol', content: symbol });
      }
    }
  }
  return tokens;
}

RegexParser.combine = function(nfas) {
  if (nfas.length) {
    var nfa = nfas.shift();
    while (nfas.length) {
      nfa.concatenate(nfas.shift());
    }
    return nfa;
  }
  return null;
}





function NFA(alphabet) {
  this.alphabet = alphabet;
  this.states = {};
  this.statesCount = 0;
  this.startState = this.addState();
}

NFA.prototype.addState = function(label) {
  label = label || this.generateStateLabel();
  this.states[label] = new State(label);
  this.statesCount++;
  return this.states[label];
}

NFA.prototype.getState = function(label) {
  return this.states[label];
}

NFA.prototype.getStartState = function() {
  return this.startState;
}

NFA.prototype.setStartState = function(state) {
  this.startState = state;
}

NFA.prototype.getFinalStates = function() {
  var finalStates = [];
  for (var label in this.states) {
    if (this.states[label].final) {
      finalStates.push(this.states[label]);
    }
  }
  return finalStates;
}

NFA.prototype.alphabetContains = function(symbol) {
  return this.alphabet.indexOf(symbol) >= 0;
}

NFA.prototype.generateStateLabel = function() {
  return 'q' + this.statesCount;
}

NFA.prototype.concatenate = function(nfa) {
  var finalStates = this.getFinalStates();
  var newStates = this.absorb(nfa);
  for (var i = 0; i < finalStates.length; i++) {
    finalStates[i].unfinalize().transition(newStates[nfa.getStartState().label], '~');
  }
  return newStates;
}

NFA.prototype.absorb = function(nfa) {
  var newStates = {};
  for (var label in nfa.states) {
    newStates[label] = this.addState();
  }
  for (var label in nfa.states) {
    var state = nfa.states[label];
    newStates[label].final = state.final;
    for (var symbol in state.transitions) {
      for (var i = 0; i < state.transitions[symbol].length; i++) {
        newStates[label].transition(newStates[state.transitions[symbol][i].label], symbol);
      }
    }
  }
  return newStates;
}





function State(label) {
  this.label = label;
  this.transitions = {};
  this.final = false;
}

State.prototype.transition = function(state, symbol) {
  if (!(symbol in this.transitions)) {
    this.transitions[symbol] = [];
  }
  this.transitions[symbol].push(state);
  return this;
}

State.prototype.finalize = function() {
  this.final = true;
  return this;
}

State.prototype.unfinalize = function() {
  this.final = false;
  return this;
}