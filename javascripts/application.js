//var regex = "a+b";
var regex = "(a+b*)*";
var nfa = RegexParser.parse(regex);
console.log(NFAConverter.EClosure(nfa, nfa.states["q0"], []));

nfa = NFAConverter.convert(nfa);
for (var state in nfa.states) {
  console.group(state);
  for (var transition in nfa.states[state].transitions) {
    var destinations = nfa.states[state].transitions[transition].map(function(item) {
      return item.label;
    }).join(', ');
    console.log(transition + ' : ' + destinations);
  }
  if (nfa.states[state].final) {
    console.log('-- final state');
  }
  console.groupEnd();
}
