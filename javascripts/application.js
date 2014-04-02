//var regex = "b*ab*a(a+b)*"; 
//var regex = "b*ab*ab*"; 
//var regex = "b*(ab*ab*)*"; 
var regex = "aab"; 
var nfa = RegexParser.parse(regex);
//console.log(nfa)

nfa = NFAConverter.convert(nfa);
console.log("out here!");
console.log(nfa);
for (var state in nfa.states) {
  console.group(state);
  for (var transition in nfa.states[state].transitions) {
    var destinations = nfa.states[state].transitions[transition].join(', ');
    console.log(transition + ' : ' + destinations);
  }
  if (nfa.states[state].final) {
    console.log('-- final state');
  }
  console.groupEnd();
}

// console.log("-----------------------------------------------");

// dfa = NFAConverter.convert(nfa);

// for (var i = 0; i < dfa.length; i++) {
//   console.log(dfa[i].label);
//   console.log(dfa[i].transitions);
//   if (dfa[i].final) {
//     console.log("-- final state --");
//   }
// }