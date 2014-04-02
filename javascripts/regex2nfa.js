function RegexParser() {}
RegexParser.parse = function(regex, alphabet) {
  alphabet = alphabet || 'ab';
  if (!RegexParser.validate(regex, alphabet)) {
    throw new ParsingError('The RegEx you provided is invalid.');
    return false;
  }

  regex = RegexParser.clean(regex);
  var tokens = RegexParser.tokenize(regex);
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
        var nfa = new NFA('ab');
        var popped = concatStack.pop();
        var newStates = nfa.absorb(popped);
        nfa.getStartState().transition(newStates[popped.getStartState().label], '~');
        var finalStates = nfa.getFinalStates();
        for (var j = 0; j < finalStates.length; j++) {
          finalStates[j].transition(nfa.getStartState(), '~');
        }
        nfa.getStartState().finalize();
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

RegexParser.validate = function(regex, alphabet) {
  var parenthesisStack = [];
  var characterStack = [];

  for (var i = 0; i < regex.length; i++) {
    var character = regex.charAt(i);
    characterStack.push(character);
    
    if (character == "+") {
      if (i - 1 < 0 || i + 1 >= regex.length) {
        return false;
      } else {
        var prevChar = regex.charAt(i-1);
        var nextChar = regex.charAt(i+1);

        if ((["a", "b"].indexOf(nextChar) == -1 && nextChar != "*") || nextChar == ")" || nextChar == "+" || 
            (["a", "b"].indexOf(prevChar) == -1 && prevChar != "*") || prevChar == "(" || prevChar == "+"
            ) {
          return false;
        }
      }
    } else if (character == "*") {
      if (characterStack[characterStack.length-1] == "+") {
        return false;
      }
    } else if (character == "(") {
      parenthesisStack.push(character);
    } else if (character == ")") {
      if (parenthesisStack.length == 0) {
        return false;
      } 
      parenthesisStack.pop();
    } else if (["a", "b"].indexOf(character) == -1){
      return false;
    }
  }

  if (parenthesisStack.length) {
    return false;
  }

  return true;
}

RegexParser.clean = function(regex) {
  var finalRegex = "";

  for (var i = 0; i < regex.length; i++) {
    var character = regex.charAt(i);

    if (!(character == "*" && (finalRegex.charAt(finalRegex.length - 1) == "*" || finalRegex == ""))) {
      finalRegex += character;
    } 
  }

  return finalRegex;
}





function NFA(alphabet) {
  this.alphabet = alphabet;
  this.states = {};
  this.statesCount = 0;
  this.startState = this.addState();
}
NFA.prototype = new CustomEvent();

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

NFA.prototype.accepts = function(input, state) {
  state = state || this.getStartState();
  this.dispatchEvent('yield', { input: input, state: state, type: 'destination' });
  if (input.length) {
    var symbol = input.charAt(0);
    if (symbol in state.transitions) {
      for (var i = 0; i < state.transitions[symbol].length; i++) {
        this.dispatchEvent('yield', { input: input, state: state, type: 'source' });
        if (this.accepts(input.substring(1), state.transitions[symbol][i])) {
          return true;
        }
      }
    }
    if ('~' in state.transitions) {
      for (var i = 0; i < state.transitions['~'].length; i++) {
        this.dispatchEvent('yield', { input: input, state: state, type: 'source' });
        if (this.accepts(input, state.transitions['~'][i])) {
          return true;
        }
      }
    }
    return false;
  }
  return state.final;
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






function CustomEvent() {
  this.events = {};
}

CustomEvent.prototype.addEventListener = function(name, callback) {
  if (!(name in this.events)) {
    this.events[name] = [];
  }
  this.events[name].push(callback);
}

CustomEvent.prototype.removeEventListener = function(name, callback) {
  if (name in this.events) {
    for (var i = 0; i < this.events[name].length; i++) {
      if (this.events[name][i] === callback) {
        this.events[name].splice(i, 1);
      }
    }
  }
}

CustomEvent.prototype.dispatchEvent = function(name, data) {
  if (name in this.events) {
    data = data || {};
    data['target'] = this;
    for (var i = 0; i < this.events[name].length; i++) {
      this.events[name][i](data);
    }
  }
}





function ParsingError(message) {
  this.name = 'ParsingError';
  this.message = message;
}
ParsingError.prototype = Error.prototype;