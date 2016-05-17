/*
	Remove all white space from a string.
*/
function trimSpace(str) {
	
	str = str.replace(/\s/g,'');
	return str;
}

function unitTest(str) {

	var root = new Node();
	root.leftChild = new Node();
	root.rightChild = new Node();
	root.value = '+';
	root.leftChild.value = [5,0];
	root.rightChild.value = [3,0];
	
	alert(interpretEquationTree(root));
}

/*
	Build a tree for general arithmetic equations. Operators serve as inner nodes
	and numerical terms serve as leaves. Tree is constructed with higher order
	operations at a greater depth than low order operations.
*/
function constructEquationTree(str, currentNode){
	
	var inParen = false;
	var parenCount = 0;
	
	var opOrder = 2;
	var lowestOrderIndex = -1;
	
	while (lowestOrderIndex === -1) {
		// Base case registers when a valid numerical term is passed
			// Variable terms in the form 4x+7 --> [7,4]
		if (/^(?=.*\d)\d*(?:\.\d*)?$/.test(str)) {
			return [parseFloat(str),0];
		}
		else if (/^(?:(?=.*\d)\d*(?:\.\d*)?)?[a-z]$/.test(str)) {
			return [0,parseFloat(str.slice(0,-1))];
		}
		// Search the current equation for the lowest order operator
			// Precedence follows standard mathematical order of operations
		for (var i=str.length-1;i>=0;i--) {
			if (!inParen && opOrder > 0) {
				if ((str[i] === '-' || str[i] === '+') && opOrder > 0){
					opOrder = 0;
					lowestOrderIndex = i;
				}
				else if ((str[i] === '*' || str[i] === '/') && opOrder > 1) {
					opOrder = 1;
					lowestOrderIndex = i;
				}
				else if (str[i] === '^') {
					opOrder = 2;
					lowestOrderIndex = i;
				}
			}
			// Track the depth of parentheses to ignore their contents until 
				// all other operations are registered
			if (str[i] === ')') {
				inParen = true;
				parenCount++;
			}
			else if (str[i] === '(') {
				parenCount--;
				if (parenCount === 0) {
					inParen = false;
				}
			}
		}
		// If no operator was found
		if (lowestOrderIndex === -1) {
			if (str[0] === '('){
				// assume () surround entire expression
				str = str.slice(1,-1); //trim the parentheses from beginning and end
			}
			else {
				// assume invalid input
				// raise an exception and terminate the program
			}
		}
	}
	
	currentNode.leftChild = new Node();
	currentNode.rightChild = new Node();
	// special case where the equation has a leading negative term	
		// treat negatives as subtraction from zero
	if (lowestOrderIndex === 0 && str[0] === '-') {
		currentNode.leftChild.value = 0;
	}
	else {
		currentNode.leftChild.value = constructEquationTree(str.slice(0,lowestOrderIndex),currentNode.leftChild);
	}
	currentNode.rightChild.value = constructEquationTree(str.slice(lowestOrderIndex+1),currentNode.rightChild)
		
	return str[lowestOrderIndex];
}

/*
	Instantiate the root node of the tree and request
	an equation tree to be built from the provided string.
*/
function initiateEquationTree(str) {
	
	var output;
	var root = new Node();
	str = trimSpace(str);
	root.value = constructEquationTree(str, root);
	
	output = interpretEquationTree(root);
	alert(output[1] + "x" + " + " + output[0]);
}

/*
	Given the root of a mathematical parse tree containing numerical
	and operational (+,-,*,/,^) values, compute the result.
	Need to update rules to handle operations with variables (x,y)
*/
function interpretEquationTree(root) {
	
	// Leaves should contain only terms that can be evaluated to a number
	if (!root.leftChild && !root.rightChild) {
		return root.value;
	}
	
	switch (root.value) {
		case '+':
			return add(interpretEquationTree(root.leftChild),interpretEquationTree(root.rightChild));
			break;
		case '-':
			return subtract(interpretEquationTree(root.leftChild),interpretEquationTree(root.rightChild));
			break;
		case '*':
			return multiply(interpretEquationTree(root.leftChild),interpretEquationTree(root.rightChild));
			break;
		case '/':
			return divide(interpretEquationTree(root.leftChild),interpretEquationTree(root.rightChild));
			break;  
		case '^':
			return Math.pow(interpretEquationTree(root.leftChild),interpretEquationTree(root.rightChild));
			break;
	}
	
	/*
	/^(?=.*\d)\d*(?:\.\d*)?$/
		Operation helper functions. Implement rules for variable operations.
		
		term parameters are arrays where the value stored at index i is equal
		to the coefficient of x^i
	*/
	function add(term1, term2) {
	
		return [term1[0] + term2[0], term1[1] + term2[1]];
	}
	function subtract(term1, term2) {
	
		return [term1[0] - term2[0], term1[1] - term2[1]];
	}
	// Only capable of x^0 and x^1 order functions
	function multiply(term1, term2) {
	
		// zero-power * zero-power
		if (term1[1] === 0 && term2[1] === 0) {
			return [term1[0] * term2[0],0];
		}
		// zero-power * (zero-power + first-power)
		else if (term1[1] === 0) {
			return [term1[0] * term2[0], term1[0] * term2[1]];
		}
		// (zero-power + first-power) * zero-power
		else {
			return [term1[0] * term2[0], term1[1] * term2[0]];
		}
	}
	// Only capable of x^0 and x^1 order functions
	function divide(term1, term2) {
		// zero-power / zero-power
		if (term1[1] === 0 && term2[1] === 0) {
			return [term1[0] / term2[0],0];
		}
		// zero-power / (zero-power + first-power)
		else if (term1[1] === 0) {
			return [term1[0] / term2[0], term1[0] / term2[1]];
		}
		// (zero-power + first-power) / zero-power
		else {
			return [term1[0] / term2[0], term1[1] / term2[0]];
		}
	}
}

/*
	Basic definition of a Node for use in a binary tree.
*/
function Node() {

	var value;
	var leftChild;
	var rightChild;
}