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

	const value = generateArgumentsValues(type);

	return `${arg.name}: ${value}`;
}

function generateArgumentsValues(type) {
	
	let value = "";

	const createArgumentValueRecursively = (_arg) => {

		let t = _arg;
		while (t.ofType) t = t.ofType;

		let numberOfFields = 0;
		if (t.astNode && t.astNode.kind === 'InputObjectTypeDefinition') {
			value += "{ ";
			for (const [name, data] of Object.entries(t.getFields())) {

				let dataType = data.type;
				while (dataType.ofType) dataType = dataType.ofType

				if (numberOfFields > 0) value += ", ";

				value += `${name}: `;

				/* TODO: replace dummy values, a better way to
				distinguish between primitive and complex types */

				createArgumentValueRecursively(data.type);

				++numberOfFields;
			}
			value += " }";
		} else {
			value += "BOOOOOOM!"
		}

	}

	createArgumentValueRecursively(type);
	return value;
}

/**
 * Generate types string
 * @param dict dictionary of arguments
 */
export const getVarsToTypesStr = dict =>
	Object.entries(dict)
		.map(([varName, arg]) => `$${varName}: ${arg.type}`)
		.join(', ');

