//var regex = "b*ab*a(a+b)*"; 
//var regex = "b*ab*ab*"; 
//var regex = "b*(ab*ab*)*"; 
var regex = "(a+b)*(b+aa)"; 
var nfa = RegexParser.parse(regex);

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

console.log("-----------------------------------------------");

dfa = NFAConverter.convert(nfa);

for (var i = 0; i < dfa.length; i++) {
  console.log(dfa[i].label);
  console.log(dfa[i].transitions);
  if (dfa[i].final) {
    console.log("-- final state --");
  }
}