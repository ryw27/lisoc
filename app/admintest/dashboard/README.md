# Guidelines and logic explanations that must be followed to ensure no runtime errors


## Insertion/Update order

1. Unique Check
2. Enrichment (changing the form fields to match the schema, I'm pretty sure this only needs to be done for foreign keys)
3. Add extras, user information, etc.
3. Make sure it fits the insert schema
4. Insert/Update

** Further testing to see if this pattern works every time, but it should. **


## Dates
All dates should be DISPLAYED in **DD/MM/YY** form. Internally, they will be represented as fully as possible, i.e. day/month/year HH:MM:SS EST.
ENSURE CONSISTENCY HERE. Refer to formatDate function in (some file) to display correctly.

## Form Schemas for insertion and update
Keep optional and enriched fields at the bottom of the Zod object. MARK EVERY FIELD THAT IS ENRICHED WITH A COMMENT. For simplicity, keep every field in the form schema the same as the table column names, except for the foreign keys that need to be enriched. IN THE FORM SCHEMA, DO NOT NAME THE ENRICHED FIELDS AS THE CORRESPONDING COLUMNS. For example, classupid in classes should be named upgradeclass in the form schema. 

## How the entity config factory works
Almost everything that can be generically written has been. There is a possibility that even more generics can be done, but for now: Each entity only requires a few things to be handwritten. Refer to class-helpers.ts for an example.

1. Form Schema
2. Object denoting how to enrich fields
3. What fields need to be checked to ensure uniqueness
4. Extra fields that need to be handwritten when inserting/updating
5. Header names for each column that can be displayed

### Each entity has a few files/pages:

1. An ID page, displaying information for individual rows of a certain config
2. An edit entity page, to edit individual rows
3. An add entity pages, self-explanatory
4. Helpers, contains all the handwritten things + useful types to use
5. The data of the entiy, the main page itself. 