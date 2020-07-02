/* DOCUMENT INFORMATION
	- Author:   Dominik Maszczyk
	- Email:    Skitionek@gmail.com
	- Created:  2019-06-06
*/

import { MODULE_NAME } from "./constants";

/* istanbul ignore next */
export const moduleConsole = {
	log: (...args) =>
		console.log(`[${MODULE_NAME} log]:`, ...args),
	warn: (...args) =>
		console.log(`[${MODULE_NAME} warning]:`, ...args),
	error: (...args) =>
		console.log(`[${MODULE_NAME} error]:`, ...args)
};

/**
 * Compile arguments dictionary for a field
 * @param field current field object
 * @param duplicateArgCounts map for deduping argument name collisions
 * @param allArgsDict dictionary of all arguments
 * @param path to current field
 */
export const getFieldArgsDict = (
	field,
	duplicateArgCounts,
	allArgsDict = {},
	path
) =>
	field.args.reduce((o, arg) => {
		const arg_name = `${path.join('_')}_${field.name}_${arg.name}`;
		/* istanbul ignore next */
		if (arg_name in duplicateArgCounts) {
			moduleConsole.warn(`
			I cannot find the case for these duplicates anymore,
			please let me know if you are seeing this message.
			`);
			const index = duplicateArgCounts[arg_name] + 1;
			duplicateArgCounts[arg_name] = index;
			o[`${arg_name}${index}`] = arg;
		} else /* istanbul ignore next */ if (allArgsDict[arg_name]) {
			moduleConsole.warn(`
			I cannot find the case for these duplicates anymore,
			please let me know if you are seeing this message.
			`);
			duplicateArgCounts[arg_name] = 1;
			o[arg_name] = arg;
		} else if (!path.length) {
			o[arg.name] = arg;
		} else {
			o[arg_name] = arg;
		}
		return o;
	}, {});

/**
 * Generate variables string
 * @param dict dictionary of arguments
 */
export const getArgsToVarsStr = dict =>
	Object.entries(dict)
		.map(mapArgsToVars /* ([varName, arg]) => `${arg.name}: $${varName}` */)
		.join(', ');

function mapArgsToVars([varName, arg]) {

	let type = arg.type;
	while (type.ofType) type = type.ofType

	/* console.log("\nName:", varName,
				"\nType:", type.name); */

	// eslint-disable-next-line no-unused-vars
	const varValue = "$BLABLABLA" /* `$${varName}` */;

	/* We get suitable random value based on variable type... */
	/* for complex types, we need to deepen to it's simple type 
	fields and construct an object */

	/* See result.txt file */
/* 	if (type.name === "String") {
		varValue = "STRING";
	} else if (type.name === "Int") {
		varValue = -1;
	} */

	// eslint-disable-next-line prefer-const
	var varValue2 = "";
	
	const Go = (_arg) => {
 		let t = _arg;
		while (t.ofType) t = t.ofType;

		/* console.log(
			"\nArg Name:", arg.name,
			"\nArg Type:", t.name); */

		let numberOfFields = 0;
		varValue2 = "{ ";
		for (const [name, data] of Object.entries(t.getFields())) {

			let dataType = data.type;
			while (dataType.ofType) dataType = dataType.ofType
			/* console.log(
				"\nArg Name:", name,
				"\nArg Type:", dataType.name); */

			if (numberOfFields > 0) varValue2 += ", ";

			varValue2 += `${name}: `;

			if (dataType.name === "String") {
				varValue2 += "STRING";
			} else if (dataType.name === "Int") {
				varValue2 += -1;
			} else {
				Go(data.type);
			}

			++numberOfFields;
		}
			
		varValue2 += " }";
	}

	if(type.getFields) {
		Go(type);
	} else {
		varValue2 += `BOOM!`;
	}
	console.log(varValue2);

	/* for complex types */
	//const object = createObjectShape(arg.type);
	//console.log(object);
	return `${arg.name}: ${varValue2}`;
}
/* 
function createObjectShape(obj) {

	let result = "";
	result += "{";

	const recursivelyCreateObjectShape = (type, _result) => {

		if(type.getFields) {
			_result += "{";
			type.getFields().forEach(field => {
				if (field.getFields) {
					recursivelyCreateObjectShape(field, _result);
				} else {
					_result += `${field.name}: "BOOM"`;
				}
			});
			_result += "}";
		} else {
			_result += `${type.name}: "BOOM"`;
		}
	}

	recursivelyCreateObjectShape(obj, result);

	result += "}";
	return result;
}
 */

/**
 * Generate types string
 * @param dict dictionary of arguments
 */
export const getVarsToTypesStr = dict =>
	Object.entries(dict)
		.map(([varName, arg]) => `$${varName}: ${arg.type}`)
		.join(', ');

