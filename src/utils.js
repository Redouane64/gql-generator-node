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
export const getArgsToVarsStr = (dict, generateValues, requiredOnly, scalarTypeConfig = {}) =>
	Object.entries(dict)
		.map(([fieldName, fieldInfo]) => 
			generateValues ? mapGeneratedArgsToVars(fieldName, fieldInfo, requiredOnly, scalarTypeConfig) :
			`${fieldInfo.name}: $${fieldName}`)
		.join(', ');

function mapGeneratedArgsToVars(fieldName, fieldTypeInfo, ignoreNonRequired, scalarTypesConfig = {}) {
	const value = generateArgumentsValues(fieldTypeInfo, fieldName, ignoreNonRequired, scalarTypesConfig);
	return `${fieldTypeInfo.name}: ${value}`;
}

function generateArgumentsValues(parentFieldTypeInfo, parentFieldName = null, requiredOnly = false, scalarTypesConfig = {}) {
	
	let value = "";
	// user given types config
	// GraphQL user defined types to Javascript type
	const typesConfig = {
		String: "String",
		Int: "Number",
		BigNumber: "Number",
		Float: "Number",
		Boolean: "Boolean",
		DateTime: "Date"
	};
	Object.assign(typesConfig, scalarTypesConfig);
	
	const createArgumentValueRecursively = 
		(fieldTypeInfo, 
		fieldName = null, 
		_requiredOnly = false) => {

		let isRequired = false;
		let isList = false;
		let astType = fieldTypeInfo.astNode.type;
		while(astType) {
			
			if(astType.kind === 'ListType') {
				isList = true;
			}

			if(astType.kind === 'NonNullType') {
				isRequired = true;
			}

			// if both flags set, shortcut the loop because 
			// what's needed is found.
			if(isRequired && isList) break;

			astType = astType.type;
		}

		if(!isRequired) {
			return null;
		}

		let type = fieldTypeInfo.type;
		while (type.ofType) type = type.ofType;
		let _value = "";

		if (type.astNode && type.astNode.kind === 'InputObjectTypeDefinition') {

			if(isList)
				_value += "[";

			_value += "{ ";
			_value += Object.entries(type.getFields()).map(([field, typeInfo]) => {
				return `${field}: ${createArgumentValueRecursively(typeInfo, field, _requiredOnly, typesConfig)}`;
			}).join(",");
			_value += " }";
			
			if(isList)
				_value += "]";

		} else if (type.astNode && type.astNode.kind === 'EnumTypeDefinition') {
			_value += type.astNode.values[0].name.value;
		} else if (isList) {
			_value += "[";
			_value += generateScalarValue(type, isList, typesConfig);
			_value += "]";
		} else {
			_value += generateScalarValue(type, isList, typesConfig);
		}

		return _value;
	}

	value += createArgumentValueRecursively(parentFieldTypeInfo, parentFieldTypeInfo.name, requiredOnly);
	return value;
}

/* Mapping from Javascript types to user defined graphql scalar types */

const primitiveTypesFactory = {
	/* eslint-disable-next-line no-magic-numbers */
	String: (length = 10) => {
		let result = "";
		const alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		for(let i = 0; i < length; i++) {
			result += alphabets.charAt(Math.floor(Math.random() * alphabets.length))
		}
		return `'${result}'`;
	},

	/* eslint-disable-next-line no-magic-numbers */
	Number: (min = 0, max = 1000, float = false) => min + (float ? (Math.random() * max): Math.floor(Math.random() * max)),
	
	Boolean: () => true,

	BigInt: () => primitiveTypesFactory.Int(),

	Date: () => `'${new Date().toISOString()}'`,

	/* eslint-disable-next-line no-magic-numbers */
	List: (type, size = 3) => {
		const list = [];
		for(let i = 0; i < size; i++)
			list.push(primitiveTypesFactory[type]());
		return list;
	}
};

function generateScalarValue(type, isList, typesConfig) {

	if(isList && primitiveTypesFactory.hasOwnProperty(type.name)) {
		/* eslint-disable-next-line no-magic-numbers */
		return primitiveTypesFactory.List(type.name);
	}

	if(primitiveTypesFactory.hasOwnProperty(type.name)) {
		return primitiveTypesFactory[type.name]();
	}

	if(type.astNode && type.astNode.kind === 'ScalarTypeDefinition') {
		const typeName = typesConfig[type.name];

		if(!primitiveTypesFactory.hasOwnProperty(typeName)) {
			throw new Error("Unrecognized scalar type.");
		}

		return primitiveTypesFactory[typeName]();
	}
	
	return primitiveTypesFactory.String();
}

/**
 * Generate types string
 * @param dict dictionary of arguments
 */
export const getVarsToTypesStr = dict =>
	Object.entries(dict)
		.map(([varName, arg]) => `$${varName}: ${arg.type}`)
		.join(', ');

