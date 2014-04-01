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
  var eclosures = NFAConverter.eClosure(nfa, currentState, []).sort();
  var finished = false;
  var alphabet = ['a', 'b'];
  var finalDFAstates = [];

  newStates.push(eclosures);

  var count = 0;
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
        } else {
          //diri ibutang ang empty state
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

      temp.sort();
      //if (finalDFAstates.indexOf(temp) == -1) { 
      if (!(contains(finalDFAstates, temp))) {
        //if (newStates.indexOf(temp) == -1) {
        if (!(contains(newStates, temp))) {
          var equal = false;
          for (var n = 0; n < newStates.length; n++) {
            if (isEqual(newStates[n], temp)) {      
              equal = true;
              break;
            }
          }

          if (!equal && temp.length != 0) {
            newStates.push(temp);
          }
        }
      }
    }

    //if (finalDFAstates.indexOf(newStates[0]) == -1) {
    //if (!(contains(finalDFAstates, newStates[0]))) {
      finalDFAstates.push(newStates.shift());
    //}

    console.warn(finalDFAstates);
    console.info(newStates);

   //count += 1;
   //console.log("omg we just finished this!" + count);
   //if (count == 4) {
   if (newStates.length == 0) {
      finished = true;
   }
  }

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
    if (isEqual(source[i], toCheck)) {
      return true;
    } 
  } 
  return false;
}



