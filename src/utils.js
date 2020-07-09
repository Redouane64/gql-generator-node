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
export const getArgsToVarsStr = (dict, generateValues, requiredOnly) =>
	Object.entries(dict)
		.map(([fieldName, fieldInfo]) => 
			generateValues ? mapGeneratedArgsToVars(fieldName, fieldInfo, requiredOnly) :
			`${fieldInfo.name}: $${fieldName}`)
		.join(', ');

function mapGeneratedArgsToVars(fieldName, fieldTypeInfo, ignoreNonRequired) {
	const value = generateArgumentsValues(fieldTypeInfo, fieldName, ignoreNonRequired);
	return `${fieldTypeInfo.name}: ${value}`;
}

function generateArgumentsValues(parentFieldTypeInfo, parentFieldName = null, requiredOnly = false) {
	
	let value = "";

	const createArgumentValueRecursively = 
		(fieldTypeInfo, 
		fieldName = null, 
		_requiredOnly = false) => {

		let type = fieldTypeInfo.type;
		while (type.ofType) type = type.ofType;
		let _value = "";

		if (type.astNode && type.astNode.kind === 'InputObjectTypeDefinition') {
			_value += "{ ";
			_value += Object.entries(type.getFields()).map(([field, typeInfo]) => {
				return `${field}: ${createArgumentValueRecursively(typeInfo, field, _requiredOnly)}`;
			}).join(",");
			_value += " }";
		} else if (type.astNode && type.astNode.kind === 'EnumTypeDefinition') {
			if(_requiredOnly) {
				if (!fieldTypeInfo.type.toString().endsWith('!')) {
					return;
				}
			}
			_value += type.astNode.values[0].name.value;
		} else {
			if(_requiredOnly) {
				if (!fieldTypeInfo.type.toString().endsWith('!')) {
					return;
				}
			}

			const _v = generateScalarValue(fieldTypeInfo);
			console.log(_v);
			
			_value += "BOOOOOOM!";
		}

		return _value;
	}

	if (requiredOnly && !parentFieldTypeInfo.type.toString().endsWith('!')) {
		return null;
	}

	value += createArgumentValueRecursively(parentFieldTypeInfo, parentFieldTypeInfo.name, requiredOnly);
	return value;
}

function generateScalarValue(type) {
	let _type = type.astNode;
	let isRequired = false;
	while(_type.type) {
		if(_type.kind === 'NonNullType') {
			isRequired = true;
		}
		_type = _type.type;
	}

	if(isRequired) {
		return "BOOOOM!";
	}
}

/**
 * Generate types string
 * @param dict dictionary of arguments
 */
export const getVarsToTypesStr = dict =>
	Object.entries(dict)
		.map(([varName, arg]) => `$${varName}: ${arg.type}`)
		.join(', ');

