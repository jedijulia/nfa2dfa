var regex = "b*ab*a(a+b)*"; 
//var regex = "b*ab*ab*"; 
//var regex = "b*(ab*ab*)*"; 
//var regex = "a(a+b)*"; 
var nfa = RegexParser.parse(regex);
//NFAVisualizer.visualize('#nfa', nfa);
//console.log(nfa)

dfa = NFAConverter.convert(nfa);
NFAVisualizer.visualize('#nfa', dfa);

var events = [];
dfa.addEventListener('yield', function(e) {
  events.push(e);
});

console.log(nfa.accepts('ababaa'));

var previous = null;
step();
function step() {
  if (events.length) {
    var current = document.querySelector('circle.current');
    if (current) {
      previous = events.shift().state;
      var label = document.querySelector('.labels p.current');
      var transition = document.querySelectorAll('path.current');
      current.classList.remove('current');
      label.classList.remove('current');
      if (transition) {
        for (var i = 0; i < transition.length; i++) {
          transition[i].classList.remove('current');
        }
      }
    }
    var state = events.shift().state;
    var label = document.querySelector('.labels p[for="' + state.label + '"]');
    state = document.querySelector('circle[label="' + state.label + '"]');
    state.classList.add('current');
    label.classList.add('current');
    if (previous) {
      var source = previous.label;
      var destination = state.getAttribute('label');
      var transition = document.querySelectorAll('path[source="' + source + '"][destination="' + destination + '"]');
      if (transition) {
        for (var i = 0; i < transition.length; i++) {
          transition[i].classList.add('current');
        }
      }
    }
    setTimeout(step, 500);
  }
}

// console.log("out here!");
// console.log(nfa);
// for (var state in nfa.states) {
//   console.group(state);
//   for (var transition in nfa.states[state].transitions) {
//     var destinations = nfa.states[state].transitions[transition].join(', ');
//     console.log(transition + ' : ' + destinations);
//   }
//   if (nfa.states[state].final) {
//     console.log('-- final state');
//   }
//   console.groupEnd();
// }

// console.log("-----------------------------------------------");

// dfa = NFAConverter.convert(nfa);

// for (var i = 0; i < dfa.length; i++) {
//   console.log(dfa[i].label);
//   console.log(dfa[i].transitions);
//   if (dfa[i].final) {
//     console.log("-- final state --");
//   }
// }