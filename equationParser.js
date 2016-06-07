function unitTest(str) {
	
	var cut = str.split(',');
	var output = multiVariableSolver(cut);
	alert(JSON.stringify(output, null, 4));
}

/*
	Reduce input to a standard form for processing.
	Remove white space, change dashes to a simple
	hyphen and eliminate extra negatives.
*/
function normalizeString(str) {
	
	str = str.replace(/\s/g,''); // Remove white space
	str = str.replace(/\u2013|\u2014/g,'-'); // Replace &ndash or &mdash with simple dash
	
	// Reduce consecutive negaive signs Ex. ---2 = -2 
	var repeatedMinus = str.match(/--+/g);
	if (repeatedMinus) {
		for (var i=0; i<repeatedMinus.length; i++) {
			var reduced;
			if (repeatedMinus[i].length%2 === 0) {
				reduced = new RegExp(repeatedMinus);
				str = str.replace(reduced,'');
			}
			else {
				reduced = new RegExp(repeatedMinus);
				str = str.replace(reduced,'-');
			}
		}
	}
	
	str = str.replace(/\+-/g,'-'); // Addition of a negative is just subtraction
	
	return str;
}

/*
	Basic mathematical operations (+,-,*,/,^) for 
	use with whole expressions. To access, create an
	expressionOperations variable and use .add(...) etc
	
	Utilize Fraction.js to increase precision
*/
function expressionOperations() {
	
	/*
		Operation helper functions. Implement rules for variable operations.
		expression parameters = {
			'x': <coefficient>,
			'y': <coefficient>,
			'_': <zero-power>
		}
	*/
	
	/*
		If a term exists in both expression then add the
		right and the left, otherwise add with zero (included
		for clarity but could be changed to self-assignment)
	*/
	this.add = function add(expression1, expression2) {
			
		var result = {};
			
		for (var key1 in expression1) {
			if (expression2[key1]) {
				result[key1] = Fraction(expression1[key1]).add(expression2[key1]);
			}
			else {
				result[key1] = Fraction(expression1[key1]).add(0);
			}
		}
		for (var key2 in expression2) {
			if (!expression1[key2]) {
				result[key2] = Fraction(0).add(expression2[key2]);
			}
		}
		return result;
	}
	
	/*
		If a term exists in both expressions then subtract the 
		right from the left, otherwise subtract with zero.
	*/
	this.subtract = function subtract(expression1, expression2) {
		
		var result = {};
			
		for (var key1 in expression1) {
			if (expression2[key1]) {
				result[key1] = Fraction(expression1[key1]).sub(expression2[key1]);
			}
			else {
				result[key1] = Fraction(expression1[key1]).sub(0);
			}
		}
		for (var key2 in expression2) {
			if (!expression1[key2]) {
				result[key2] = Fraction(0).sub(expression2[key2]);
			}
		}
		return result;
	}
	
	/*
		Determine which expression is the scalar, and multiply all
		terms in the other expression by that value.
	*/
	this.multiply = function multiply(expression1, expression2) {
			
		var result = {};
		var keys1 = Object.keys(expression1);
		var keys2 = Object.keys(expression2);
			
		if (keys1.length === 1 && keys1[0] === '_') {
			for (var i=0; i<keys2.length; i++) {
				result[keys2[i]] = Fraction(expression1[keys1[0]]).mul(expression2[keys2[i]]);
			}
		}
		else if (keys2.length === 1 && keys2[0] === '_') {
			for (var i=0; i<keys1.length; i++) {
				result[keys1[i]] =  Fraction(expression1[keys1[i]]).mul(expression2[keys2[0]]);
			}
		}
		else {
			//Attempted x*y or other unanticipated exception
			alert("Don't Panic.");
		}
		return result;
	}
	
	/*
		Determine which expression is the scalar and divide all
		terms in the other expression by that value. Also accept
		division of like terms both of power 1.
	*/
	this.divide = function divide(expression1, expression2) {
			
		var result = {};
		var keys1 = Object.keys(expression1);
		var keys2 = Object.keys(expression2);
			
		if (keys1.length === 1 && keys1[0] === '_') {
			for (var i=0; i<keys2.length; i++) {
				result[keys2[i]] = Fraction(expression1[keys1[0]]).div(expression2[keys2[i]]);
			}
		}
		else if (keys2.length === 1 && keys2[0] === '_') {
			for (var i=0; i<keys1.length; i++) {
				result[keys1[i]] = Fraction(expression1[keys1[i]]).div(expression2[keys2[0]]);
			}
		}
		// Special case where x/x = 1
		else if (keys1.length === 1 && keys2.length === 1 && keys1[0] === keys2[0]) {
			result['_'] = Fraction(expression1[keys1[0]]).div(expression2[keys2[0]]);
		}
		else {
			//Attempted x/y or other unanticipated exception
			alert("Don't Panic.");
		}
		return result;
	}
	/*
		Allow contant values to be raised to constant powers.
		Need to adjust functionality to match Fraction.js
	*/
	this.raise = function raise(expression1, expression2) {
		
		var result = {};
		result['_'] = Math.pow(expression1['_'], expression2['_']);
			
		return result;
	}
}

/*
	Substitute known values for a given variable and return the 
	resulting expression. Handles substitution into multi-variable
	expression through multiple function calls.
	
	expression 4x + 3 = {'x':4, '_':3}
	value (x = 2) = ['x',2] 
*/
function substitute(expression, value) {
	
	var result = {};
	var opHelper = new expressionOperations();
	
	result['_'] = Fraction(expression[value[0]]).mul(value[1]);	// Multiply coefficient by the known value
	delete expression[value[0]];								// Remove given variable from the expression
	result = opHelper.add(result, expression); 	
	
	return result;
}

/*
	Given a first- or zero-order expression combine all like terms 
	and return the expression in its simplest form as an object of
	variable-coefficient pairs. Numerical term is stored under the 
	key '_'
	
	Ex.
	simplifyExpression("4x+9*2-(x*3)") --> {'_':18, 'x':1} ~~ x + 18
*/
function simplifyExpression(str) {
	
	return initiateEquationTree(str);
	
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
			/* 
				Base case registers when a valid numerical term is passed
				Variable terms in the form 4x+7+2y --> {'x':4, '_':7, 'y':2}
				where coefficients are stored as Fractions 
			*/
			// Any number
			if (/^(?=.*\d)\d*(?:\.\d*)?$/.test(str)) {			
				var term = {};
				term['_'] = new Fraction(parseFloat(str));
				
				return term;
			}
			// Any number appended by a letter
			else if (/^(?:(?=.*\d)\d*(?:\.\d*)?)?[a-z]$/.test(str)) {	
				var key = str.slice(-1);
				var term = {};
				
				if (str.length > 1) {
					term[key] = new Fraction(parseFloat(str.slice(0,-1)));
				}
				else {
					term[key] = new Fraction(1);
				}
				
				return term;
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
				/* 
					Track the depth of parentheses to ignore their contents
					until all other operations are registered.
					Interpreted right -> left to maintain left precedence
				*/
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
				// parentheses surround entire expression
				if (/^\(.+\)$/.test(str)){
					str = str.slice(1,-1); //trim the parentheses from beginning and end
				}
				else {
					// assume invalid input
					// raise an exception and terminate the program
					return null;
				}
			}
		}
		
		currentNode.leftChild = new Node();
		currentNode.rightChild = new Node();
		// special case where the equation has a leading negative term	
			// treat negatives as subtraction from zero
		if (lowestOrderIndex === 0 && str[0] === '-') {
			var term = {};
			term['_'] = new Fraction(0);
			currentNode.leftChild.value = term;
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
		str = normalizeString(str);
		root.value = constructEquationTree(str, root);
		
		return interpretEquationTree(root);
		/*
		var terms = Object.keys(output);
		for (var i=0; i<terms.length; i++) {
			terms[i] = "" + output[terms[i]] + terms[i];
		}
		var simpExp = terms.join('+');
		
		alert(simpExp);
		*/
	}

	/*
		Given the root of a mathematical parse tree containing numerical
		and operational (+,-,*,/,^) values, compute the result.
		Need to update rules to handle operations with variables (x,y)
	*/
	function interpretEquationTree(root) {
		
		var opHelper = new expressionOperations();
		
		// Leaves should contain only terms that can be evaluated to a number
		if (!root.leftChild && !root.rightChild) {
			return root.value;
		}
		
		switch (root.value) {
			case '+':
				return opHelper.add(interpretEquationTree(root.leftChild),interpretEquationTree(root.rightChild));
				break;
			case '-':
				return opHelper.subtract(interpretEquationTree(root.leftChild),interpretEquationTree(root.rightChild));
				break;
			case '*':
				return opHelper.multiply(interpretEquationTree(root.leftChild),interpretEquationTree(root.rightChild));
				break;
			case '/':
				return opHelper.divide(interpretEquationTree(root.leftChild),interpretEquationTree(root.rightChild));
				break;  
			case '^':
				return opHelper.raise(interpretEquationTree(root.leftChild),interpretEquationTree(root.rightChild));
				break;
		}
	}

	/*
		Basic definition of a Node for use in a binary tree.
	*/
	function Node() {

		this.value;
		this.leftChild;
		this.rightChild;
	}
}

/*
	Accept an algebraic equation and return a tuple
	of the variable and its value.
	
	Ex.
	4x + 8 = 16 --> ['x',2] ~~ x = 2
*/
function singleVariableSolver(str) {
	
	var keys;
	var token;
	var temp = str.split('=');
	var opHelper = new expressionOperations();
	
	temp = opHelper.subtract(simplifyExpression(temp[0]), simplifyExpression(temp[1]));
	
	keys = Object.keys(temp);
	for (var i=0; i<keys.length; i++) {
		if (/[a-z]/.test(keys[i])) {
			token = keys[i];
		}
	}
	
	return [token, Fraction(-1).mul((Fraction(temp['_']).div(temp[token])))];
}

/*
	Accept a series of equations with related
	variables and successively solve for the 
	value of each. Return a tuple array of 
	variables and associated values.
	
	Ex.
	x + y = 10
	-x + 3y = 14  --> [['x',4],['y',6]]
*/
function multiVariableSolver(strArr) {
	
	//========local variables declared here==================//
	var equations = [];
	var opHelper = new expressionOperations();
	var keys;
	var result = [];
	//=======================================================//
	
	// Put all equations into the form Ax + By + Cz + D = 0
	for (var i=0; i<strArr.length; i++) {
		var temp = strArr[i].split('=');
		equations.push(opHelper.subtract(simplifyExpression(temp[0]),simplifyExpression(temp[1])));
	}
	keys = Object.keys(equations[0]);
	
	for (var i=1; i<equations.length; i++) {
		for (var j=0; j<keys.length; j++) {
			if (!equations[i][keys[j]]) {
				equations[i][keys[j]] = new Fraction(0);
			}
		}
	}
	
	// Order of variable keys is irrelevant, but '_' must be at the end
	for (var i=0; i<keys.length ;i++) {
		if (keys[i] === '_') {
			keys.splice(i,1);
			keys.push('_');
			break;
		}
	}
	
	// Elementary row operations to reduce matrix to upper triangular
	for (var i=0; i<keys.length-2; i++) {
		for (var j=i+1; j<equations.length; j++){
			if (equations[j][keys[i]].n !== 0) {
				var coeff = {};
				coeff['_'] = Fraction(equations[i][keys[i]]).div(equations[j][keys[i]]);
				equations[j] = opHelper.subtract(equations[i],opHelper.multiply(coeff,equations[j]));
			}
		}
	}
	
	for (var i=equations.length-1; i>=0; i--) {
		keys = Object.keys(equations[i]);
		for (var j=0; j<keys.length; j++) {
			if (equations[i][keys[j]].n !== 0 && keys[j] !== '_') {
				var stringy = equations[i][keys[j]].toFraction();
				stringy = "0=" + stringy + keys[j] + "+" + equations[i]['_'];
				result.push(singleVariableSolver(stringy));
			}
		}
		if (i>0) {
			for (var j=0; j<result.length; j++) {
				equations[i-1] = substitute(equations[i-1], result[j]);
			}
		}
	}
	return result;
}
/*
	Hold a simplified expression of the form
	A + Bx + Cy
var term = {	
	_: A,
	x: B,
	y: C
}*/