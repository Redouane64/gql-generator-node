require('graphql-import-node');

const typeDefs = require('./schemas/sampleTypeDef.graphql');
const typeDefsWithoutMutation = require('./schemas/empty.graphql');

const makeExecutableSchema = require('graphql-tools').makeExecutableSchema;
require('should');

const schema = makeExecutableSchema({ typeDefs });
const schemaWithoutMutation = makeExecutableSchema({ typeDefs: typeDefsWithoutMutation });

const schemaTypeDefs = require("./schemas/pineapple.graphql");
const testSchema = makeExecutableSchema({ typeDefs: schemaTypeDefs });

import { generateAll, generateQuery } from "../src";

it('validate generated queries', async () => {
	generateAll(schema, undefined, ({ args }) => {
		const o = {};
		(args || []).forEach(arg => {
			o[arg.name] = arg;
		});
		return o;
	}).mutations.signin.indexOf('signin').should.not.equal(-1)
});

it('limt depth', async () =>
	generateAll(schema, false, false, {}, 1).mutations.signup.indexOf('createdAt').should.equal(-1)
);

it('check field generator', async () =>
	expect(
		generateQuery({
			field: schema
				.getQueryType()
				.getFields().user
		})
	).toMatchSnapshot()
);

it('check field generator with skeleton', async () =>
	expect(
		generateQuery({
			field: schema
				.getQueryType()
				.getFields().user,
			skeleton: {
				email:
					true
			}
		})
	).toMatchSnapshot()
);

it('check field generator with skeleton - nested types', async () =>
	expect(
		generateQuery({
			field: schema
				.getQueryType()
				.getFields().user,
			skeleton: {
				email: true,
				context: {
					domain: true
				}
			}
		})
	).toMatchSnapshot()
);

it('check field generator with skeleton - unions', async () =>
	expect(
		generateQuery({
			field: schema
				.getQueryType()
				.getFields().user,
			skeleton: {
				email: true,
				details: {
					region: true
				}
			}
		})
	).toMatchSnapshot()
);

it('check field generator with skeleton - circular', async () =>
	expect(
		generateQuery({
			field: schema
				.getQueryType()
				.getFields().user,
			skeleton: {
				email: true,
				details: {
					user: {
						region: true
					},
					region: true
				}
			}
		})
	).toMatchSnapshot()
);

it('check field generator with skeleton - multiple fields with same query parameter name', async () =>
	expect(
		generateQuery({
			field: schema
				.getMutationType()
				.getFields().setConfig
		})
	).toMatchSnapshot()
);

it('check field generator with skeleton - multiple fields with same query parameter name', async () =>
	expect(
		generateQuery({
			field: schema
				.getMutationType()
				.getFields().setConfig,
			duplicateArgCounts: {
				setConfig_level_domain: "level_domain",
				setConfig_lastSeen_domain: "lastSeen_domain",
				setConfig_theme_domain: "theme_domain"
			}
		})
	).toMatchSnapshot()
);

it('check field generator for non-empty array ([]!)', async () =>
	expect(
		generateQuery({
			field: schema
				.getQueryType()
				.getFields().users,
			skeleton: {
				email:
					true
			}
		})
	).toMatchSnapshot()
);

it('check warnings for no mutations, query, subscription in schema', async () =>
	expect(
		generateAll(schemaWithoutMutation)
	).toMatchSnapshot()
);

it("Generate mock values", () => {

	const result = generateAll(testSchema, true, true)

	console.log(result);
})