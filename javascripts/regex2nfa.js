function RegexParser() {}
RegexParser.parse = function(regex) {
  var nfa = new NFA('ab');
  var emptyContext = nfa.startState();
  var context = emptyContext.finalize();
  var tokens = RegexParser.tokenize(regex);

  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    if (token.type == 'symbol') {
      if (nfa.alphabetContains(token.content)) {
        emptyContext = nfa.addState();
        var state = nfa.addState();
        context.unfinalize().transition(emptyContext, '~');
        emptyContext.transition(state, token.content);
        context = state.finalize();
      } else if (token.content == '*') {
        context.transition(emptyContext, '~');
        emptyContext.transition(context, '~');
      } else if (token.content == '+') {
        emptyContext = nfa.startState();
        context = emptyContext;
      }
    } else {
      var nested = RegexParser.parse(token.content);
      var newStates = [];
      for (var j = 0; j < nested.stateCount; j++) {
        newStates.push(nfa.addState());
      }
      var finalState = nfa.addState();
      for (var state in nested.states) {
        var index = parseInt(state.substring(1));
        for (var transition in nested.states[state].transitions) {
          for (var j = 0; j < nested.states[state].transitions[transition].length; j++) {
            var destinationIndex = parseInt(nested.states[state].transitions[transition][j].label.substring(1));
            newStates[index].transition(newStates[destinationIndex], transition);
          }
        }
        if (nested.states[state].final) {
          newStates[index].unfinalize().transition(finalState, '~');
        }
      }
      context.unfinalize().transition(newStates[0], '~');
      emptyContext = newStates[0];
      context = finalState.finalize();
    }
  }
  return nfa;
}

RegexParser.tokenize = function(regex) {
  var tokens = [];
  var stack = [];
  for (var i = 0; i < regex.length; i++) {
    var symbol = regex.charAt(i);
    if (symbol === '(') {
      stack.push(i);
    } else if (symbol == ')') {
      var openPar = stack.pop();
      if (!stack.length) {
        var insideParens = regex.substring(openPar + 1, i);
        tokens.push({type: 'regex', content: insideParens});
      }
    } else {
      if (!stack.length) {
        tokens.push({type: 'symbol', content: symbol});
      }
    }
  }
  return tokens;
}





function NFA(alphabet) {
  this.alphabet = alphabet.split('');
  this.states = {};
  this.stateCount = 0;
  this.addState();
}

NFA.prototype.startState = function() {
  return this.states['q0'];
}

NFA.prototype.finalStates = function() {
  var finalStates = [];
  for (var state in this.states) {
    if (this.states[state].final) {
      finalStates.push(this.states[state]);
    }
  }
  return finalStates;
}

NFA.prototype.addState = function(label) {
  label = label || this.generateStateLabel();
  var state = new State(label);
  this.states[label] = state;
  this.stateCount++;
  return state;
}

NFA.prototype.alphabetContains = function(symbol) {
  return this.alphabet.join('').indexOf(symbol) > -1;
}

NFA.prototype.generateStateLabel = function() {
  return 'q' + this.stateCount;
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