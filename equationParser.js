/*
	Remove all white space from a string.
*/
function trimSpace(str) {
	
	str = str.replace(/\s/g,'');
	return str;
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
		if (/^(?=.*\d)\d*(?:\.\d*)?$/.test(str)) {
			return parseFloat(str);
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
	
	var root = new Node();
	str = trimSpace(str);
	root.value = constructEquationTree(str, root);
	alert(interpretEquationTree(root));
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
		case '-':
			return interpretEquationTree(root.leftChild) - interpretEquationTree(root.rightChild);
			break;
		case '+':
			return interpretEquationTree(root.leftChild) + interpretEquationTree(root.rightChild);
			break;
		case '/':
			return interpretEquationTree(root.leftChild) / interpretEquationTree(root.rightChild);
			break;
		case '*':
			return interpretEquationTree(root.leftChild) * interpretEquationTree(root.rightChild);
			break;  
		case '^':
			return Math.pow(interpretEquationTree(root.leftChild),interpretEquationTree(root.rightChild));
			break;
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