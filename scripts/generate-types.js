// This file is a utility file used to build generated types from json schema in typescript
// This allows us to have schemas for all of the data structures and types referenced
const JsonSchemaTranspiler = require('@json-schema-tools/transpiler').default;
const metadataConfigSchema = require('../lsp4_metadata_schema.json');
const headsupDatumSchema = require('../headsup_datum_schema.json');
const Dereferencer = require('@json-schema-tools/dereferencer').default;
const fs = require('fs-extra');

async function generate(fileName, schema) {
  const dereffer = new Dereferencer(schema);
  const dereffedSchema = await dereffer.resolve();
  const transpiler = new JsonSchemaTranspiler(dereffedSchema);
  fs.writeFile(fileName, transpiler.toTypescript());
}
(async function () {
  try {
    console.log('made it started');
    await generate(
      './src/generated/lsp4_metadata_schema.ts',
      metadataConfigSchema,
    );
    console.log('made it');
    await generate(
      './src/generated/headsup_datum_schema.ts',
      headsupDatumSchema,
    );
  } catch (e) {
    console.log(e);
  }
})();
