function NFAConverter() {}
NFAConverter.convert = function(nfa) {
  nfa = NFAConverter.expandStringTransitions(nfa);
  return nfa;
}

NFAConverter.expandStringTransitions = function(nfa) {
  for (var state in nfa.states) {
    for (var transition in nfa.states[state].transitions) {
      if (transition.length != 1) {
        for (var i = 0; i < nfa.states[state].transitions[transition].length; i++) {
          var stringTransition = transition;
          var currentState = nfa.states[state];
          for (var j = 0; j < transition.length - 1; j++) {
            var newState = nfa.addState();
            var first = stringTransition.charAt(0);
            stringTransition = stringTransition.substring(1, stringTransition.length);
            currentState.transition(newState, first);
            currentState = newState;
          }
          currentState.transition(nfa.states[state].transitions[transition][i], stringTransition);
        }
        delete nfa.states[state].transitions[transition];
      }
    }
  }
  return nfa;
}

NFAConverter.eClosure = function(nfa, state, eStates) {
  eStates.push(state.label);
  if ('~' in state.transitions) {
    var moreEStates = [];
    for (var i = 0; i < state.transitions['~'].length; i++) {
      if (eStates.indexOf(state.transitions['~'][i].label) == -1) {
        moreEStates = NFAConverter.eClosure(nfa, state.transitions['~'][i], eStates);
      } 
      for (var j = 0; j < moreEStates.length; j++) {
        if (eStates.indexOf(moreEStates[j]) == -1) {
          eStates.push(moreEStates[j]);
        }
      }
    } 
  }
  return eStates;
}

NFAConverter.convert = function(nfa) {
  var dfa = new NFA('ab');
  var currentState = nfa.states['q0'];
  var alphabet = ['a', 'b'];
  var id = 1;
  var possibleNewStates = [];
  var nfaFinalStates = nfa.getFinalStates();
  var finalDFAstates = [];
  var finished = false;
  var eclosures = NFAConverter.eClosure(nfa, currentState, []).sort();
  var deadState = {  
    label: "deadState", 
    transitions : {a : "deadState", b : "deadState"}, 
    eclosure:[]
  }

  possibleNewStates.push({label: "q0", transitions : {}, eclosure: eclosures});

  while (!finished) {
    for (var i = 0; i < alphabet.length; i++) {
      var leadsTo = [];

      for (var j = 0; j < possibleNewStates[0].eclosure.length; j++) {
        if (alphabet[i] in nfa.states[possibleNewStates[0].eclosure[j]].transitions) {
          var trans = nfa.states[possibleNewStates[0].eclosure[j]].transitions[alphabet[i]];
          for (var l = 0; l < trans.length; l++) {
            if (leadsTo.indexOf(trans[l]) == -1) {
              leadsTo.push(trans[l]);
            }
          }
        }
      }

      if (leadsTo.length == 0) {
        possibleNewStates[0].transitions[alphabet[i]] = deadState.label;
        continue;
      }

      var temp = [];
      for (var k = 0; k < leadsTo.length; k++) {
        var x = NFAConverter.eClosure(nfa, leadsTo[k], []);
        for (var m = 0; m < x.length; m++) {
          if (temp.indexOf(x[m]) == -1) {
            temp.push(x[m]);
          }
        }
      }

      temp.sort();
      toBeAdded = {label : "q" + id, transitions: {}, eclosure : temp};
      toBeAdded.transitions[alphabet[i]] = "";
      id++;

      if (contains(finalDFAstates, toBeAdded)) {
        possibleNewStates[0].transitions[alphabet[i]] = getLabel(finalDFAstates, toBeAdded);
        id--;
      } else {
        if (contains(possibleNewStates, toBeAdded)) {
          possibleNewStates[0].transitions[alphabet[i]] = getLabel(possibleNewStates, toBeAdded);
          id--;
        } else {
          possibleNewStates[0].transitions[alphabet[i]] = toBeAdded.label;
          possibleNewStates.push(toBeAdded);
        }
      }
    }

    finalDFAstates.push(possibleNewStates.shift());

    if (possibleNewStates.length == 0) {
      finished = true;
    }
  }

  finalDFAstates = setFinalStates(finalDFAstates, nfaFinalStates);
  finalDFAstates.push(deadState);
  dfa.states = {};
  dfa.statesCount = 0;
  dfa.startState = null;
  var nStates = {};
  for (var i = 0; i < finalDFAstates.length; i++) {
    nStates[finalDFAstates[i].label] = dfa.addState();
  }

  console.info(nStates);

  for (var i = 0; i < finalDFAstates.length; i++) {
    var s = finalDFAstates[i];
    var state = nStates[s.label];
    state.final = s.final || false;
    for (var symbol in s.transitions) {
      console.log(state);
      console.log(nStates[s.transitions[symbol]]);
      state.transition(nStates[s.transitions[symbol]], symbol);
    }
  }
  dfa.setStartState(dfa.getState('q0'));

  console.log(dfa);

  // for (var i = 0; i < finalDFAstates.length; i++) {
  //   var addedState = dfa.addState(finalDFAstates[i].label);
  //   console.info(addedState);
  //   if (finalDFAstates[i].final) {
  //     addedState.finalize();
  //   }
  // }

  // console.warn(dfa.statesCount);

  // dfa.setStartState(dfa.states["q0"]);

  // for (state in dfa.states) {
  //   var finalDFAstatesState = getStateByLabel(finalDFAstates, dfa.states[state].label);
  //   for (stateKey in finalDFAstatesState.transitions) {
  //     dfa.states[state].transition(finalDFAstatesState.transitions[stateKey], stateKey);
  //   }
  // }

  // console.log(finalDFAstates);
  return dfa;
}






function isEqual(array1, array2) {
  if (array1.length == array2.length) {
    for (var i = 0; i < array1.length; i++) {
      if (array1[i] != array2[i]) return false;
    }
    return true;
  }
  return false;
} 

function contains(source, toCheck) {
  for (var i = 0; i < source.length; i++) {
    if (isEqual(source[i].eclosure, toCheck.eclosure)) {
      return true;
    } 
  } 
  return false;
}

function getLabel(source, toGet) {
  for (var i = 0; i < source.length; i++) {
    if (isEqual(source[i].eclosure, toGet.eclosure)) {
      return source[i].label;
    }
  }
}

function getStateByLabel(finalDFAstates, label) {
  for (var i = 0; i < finalDFAstates.length; i++) {
    if (label == finalDFAstates[i].label) {
      return finalDFAstates[i];
    }
  }
}

function setFinalStates(finalDFAstates, nfaFinalStates) {
  for (var i = 0; i < finalDFAstates.length; i++) {
    for (var j = 0; j < nfaFinalStates.length; j++) {
      for (var k = 0; k < finalDFAstates[i].eclosure.length; k++) {
        if (finalDFAstates[i].eclosure[k] == nfaFinalStates[j].label) {
          finalDFAstates[i].final = true;
        }
      }
    }
  }

  return finalDFAstates;
}