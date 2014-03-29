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
  var currentState = nfa.states['q0'];
  var newStates = [];
  var eclosures = NFAConverter.eClosure(nfa, currentState, []);
  var finished = false;
  var alphabet = ['a', 'b'];
  var finalDFAstates = [];

  newStates.push(eclosures);

  while (!finished) {
    for (var i = 0; i < alphabet.length; i++) {
      console.log(alphabet[i]);
      var leadsTo = [];

      for (var j = 0; j < newStates[0].length; j++) {
        if (alphabet[i] in nfa.states[newStates[0][j]].transitions) {
          var trans = nfa.states[newStates[0][j]].transitions[alphabet[i]];
          for (var l = 0; l < trans.length; l++) {
            if (leadsTo.indexOf(trans[l]) == -1) {
              leadsTo.push(trans[l]);
            }
          }
        }
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
      if (newStates.indexOf(temp) == -1) {
        newStates.push(temp);
      }
    }

    if (finalDFAstates.indexOf(newStates[0]) == -1) {
      finalDFAstates.push(newStates.shift());
    }
    console.info(finalDFAstates);
    console.warn(newStates);

    finished = true;
  }

}







