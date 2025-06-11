# All types and generalized server actions are encompassed here

## Explanation of every file:

### auth-actions.ts
Contains authentication server actions, login, logout, register, etc.

### auth.ts
Contains next-auth configuration. auth-actions.ts builds on this config. TODO

### column-actions.ts
Contains types for column definitions used in data-table.tsx. Also contains generateColumnDefinitions, which is used almost everywhere.


### column-types.ts
Probably redundant right now, TODO to delete and organize column-actions + column-types

### data-actions.ts
Contains all generalized CRUD operations. 

### entity-config.ts
Creates the entity config 

### entity-types.ts
Very important. Contains entity types to be used throughout project

### handle-params.ts
Handles search params for viewing such as page