# `ast/nodes.ts`

============================================================ ST AST — Nodos del Árbol de Sintaxis Abstracta ============================================================

## Contents

- [`StatementKind`](#statementkind) — Type
- [`ASTNode`](#astnode) — Interface
- [`LogicDeclNode`](#logicdeclnode) — Interface
- [`AxiomDeclNode`](#axiomdeclnode) — Interface
- [`TheoremDeclNode`](#theoremdeclnode) — Interface
- [`DeriveCmdNode`](#derivecmdnode) — Interface
- [`CheckValidCmdNode`](#checkvalidcmdnode) — Interface
- [`CheckSatisfiableCmdNode`](#checksatisfiablecmdnode) — Interface
- [`CheckEquivalentCmdNode`](#checkequivalentcmdnode) — Interface
- [`ProveCmdNode`](#provecmdnode) — Interface
- [`CountermodelCmdNode`](#countermodelcmdnode) — Interface
- [`ActionExprKind`](#actionexprkind) — Type
- [`ActionExprNode`](#actionexprnode) — Interface
- [`TruthTableCmdNode`](#truthtablecmdnode) — Interface
- [`RenderCmdNode`](#rendercmdnode) — Interface
- [`AnalyzeCmdNode`](#analyzecmdnode) — Interface
- [`ExplainCmdNode`](#explaincmdnode) — Interface
- [`ImportDeclNode`](#importdeclnode) — Interface
- [`ProofBlockNode`](#proofblocknode) — Interface
- [`TheoryMember`](#theorymember) — Interface
- [`TheoryDeclNode`](#theorydeclnode) — Interface
- [`PrintCmdNode`](#printcmdnode) — Interface
- [`SetCmdNode`](#setcmdnode) — Interface
- [`IfBranch`](#ifbranch) — Interface
- [`IfStmtNode`](#ifstmtnode) — Interface
- [`ForStmtNode`](#forstmtnode) — Interface
- [`WhileStmtNode`](#whilestmtnode) — Interface
- [`FnDeclNode`](#fndeclnode) — Interface
- [`ReturnStmtNode`](#returnstmtnode) — Interface
- [`FnCallNode`](#fncallnode) — Interface
- [`ExportDeclNode`](#exportdeclnode) — Interface
- [`DefineDeclNode`](#definedeclnode) — Interface
- [`UnfoldCmdNode`](#unfoldcmdnode) — Interface
- [`FoldCmdNode`](#foldcmdnode) — Interface
- [`SourceField`](#sourcefield) — Interface
- [`SourceDeclNode`](#sourcedeclnode) — Interface
- [`InterpretCmdNode`](#interpretcmdnode) — Interface
- [`GlossaryCmdNode`](#glossarycmdnode) — Interface
- [`LetPassageNode`](#letpassagenode) — Interface
- [`LetFormalizeNode`](#letformalizenode) — Interface
- [`LetFormulaNode`](#letformulanode) — Interface
- [`LetDescriptionNode`](#letdescriptionnode) — Interface
- [`LetActionNode`](#letactionnode) — Interface
- [`LetDeclNode`](#letdeclnode) — Type
- [`ClaimDeclNode`](#claimdeclnode) — Interface
- [`SupportDeclNode`](#supportdeclnode) — Interface
- [`ConfidenceDeclNode`](#confidencedeclnode) — Interface
- [`ContextDeclNode`](#contextdeclnode) — Interface
- [`Statement`](#statement) — Type
- [`Program`](#program) — Interface

## `StatementKind`

> Type · `ast/nodes.ts:10`

Discriminante de todos los nodos de sentencia del AST de ST.

```ts
export type StatementKind = | 'logic_decl' | 'axiom_decl' | 'theorem_decl' | 'derive_cmd' | 'check_valid_cmd' | 'check_satisfiable_cmd' | 'check_equivalent_cmd' | 'prove_cmd' | 'countermodel_cmd' | 'truth_table_cmd' | 'let_decl' | 'claim_decl' | 'support_decl' | 'confidence_decl' | 'context_decl' | 'render_cmd' | 'analyze_cmd' | 'explain_cmd' | 'import_decl' | 'proof_block' | 'theory_decl' | 'print_cmd' | 'set_cmd' | 'if_stmt' | 'for_stmt' | 'while_stmt' | 'fn_decl' | 'return_stmt' | 'fn_call' | 'export_decl' | 'define_decl' | 'unfold_cmd' | 'fold_cmd' | 'source_decl' | 'interpret_cmd' | 'glossary_cmd';
```


## `ASTNode`

> Interface · `ast/nodes.ts:49`

Nodo base del AST. Todos los nodos de sentencia extienden esta interfaz.

```ts
export interface ASTNode
```


## `LogicDeclNode`

> Interface · `ast/nodes.ts:57`

Declaración de perfil lógico activo: `logic classical.propositional`.

```ts
export interface LogicDeclNode extends ASTNode
```


## `AxiomDeclNode`

> Interface · `ast/nodes.ts:63`

Declaración de axioma: `axiom <nombre> := <fórmula>`.

```ts
export interface AxiomDeclNode extends ASTNode
```


## `TheoremDeclNode`

> Interface · `ast/nodes.ts:70`

Declaración de teorema: `theorem <nombre> := <fórmula>`.

```ts
export interface TheoremDeclNode extends ASTNode
```


## `DeriveCmdNode`

> Interface · `ast/nodes.ts:79`

Comando `derive <goal> from <premises...>`: deriva una fórmula a partir de premisas nombradas.

```ts
export interface DeriveCmdNode extends ASTNode
```


## `CheckValidCmdNode`

> Interface · `ast/nodes.ts:86`

Comando `check valid <fórmula>`: verifica si la fórmula es tautología.

```ts
export interface CheckValidCmdNode extends ASTNode
```


## `CheckSatisfiableCmdNode`

> Interface · `ast/nodes.ts:92`

Comando `check satisfiable <fórmula>`: verifica si existe valoración que satisfaga la fórmula.

```ts
export interface CheckSatisfiableCmdNode extends ASTNode
```


## `CheckEquivalentCmdNode`

> Interface · `ast/nodes.ts:98`

Comando `check equivalent <A> <B>`: comprueba equivalencia lógica entre dos fórmulas.

```ts
export interface CheckEquivalentCmdNode extends ASTNode
```


## `ProveCmdNode`

> Interface · `ast/nodes.ts:105`

Comando `prove <goal> from <premises...>`: intenta construir una prueba formal del goal.

```ts
export interface ProveCmdNode extends ASTNode
```


## `CountermodelCmdNode`

> Interface · `ast/nodes.ts:112`

Comando `countermodel <fórmula>`: busca un modelo que falsifique la fórmula.

```ts
export interface CountermodelCmdNode extends ASTNode
```


## `ActionExprKind`

> Type · `ast/nodes.ts:118`

Discriminante de las acciones que puede encapsular un `let x = <acción>`.

```ts
export type ActionExprKind = | 'check_valid' | 'check_satisfiable' | 'check_equivalent' | 'derive' | 'prove' | 'countermodel' | 'truth_table' | 'explain';
```


## `ActionExprNode`

> Interface · `ast/nodes.ts:129`

Expresión de acción usada dentro de `let x = <acción>`.

```ts
export interface ActionExprNode
```


## `TruthTableCmdNode`

> Interface · `ast/nodes.ts:141`

Comando `truth_table <fórmula>`: genera la tabla de verdad completa.

```ts
export interface TruthTableCmdNode extends ASTNode
```


## `RenderCmdNode`

> Interface · `ast/nodes.ts:147`

Comando `render <target> as <format>`: serializa un símbolo a un formato dado.

```ts
export interface RenderCmdNode extends ASTNode
```


## `AnalyzeCmdNode`

> Interface · `ast/nodes.ts:154`

Comando `analyze <premises> therefore <conclusion>`: analiza la validez de un argumento.

```ts
export interface AnalyzeCmdNode extends ASTNode
```


## `ExplainCmdNode`

> Interface · `ast/nodes.ts:161`

Comando `explain <fórmula>`: produce una explicación en lenguaje natural de la fórmula.

```ts
export interface ExplainCmdNode extends ASTNode
```


## `ImportDeclNode`

> Interface · `ast/nodes.ts:167`

Declaración `import "<path>"`: importa otro archivo ST al scope actual.

```ts
export interface ImportDeclNode extends ASTNode
```


## `ProofBlockNode`

> Interface · `ast/nodes.ts:173`

Bloque de prueba estructurado con supuestos locales y goal explícito.

```ts
export interface ProofBlockNode extends ASTNode
```


## `TheoryMember`

> Interface · `ast/nodes.ts:181`

Miembro de una teoría con control de visibilidad pública/privada.

```ts
export interface TheoryMember
```


## `TheoryDeclNode`

> Interface · `ast/nodes.ts:187`

Declaración de teoría con herencia opcional: `theory T extends Parent { ... }`.

```ts
export interface TheoryDeclNode extends ASTNode
```


## `PrintCmdNode`

> Interface · `ast/nodes.ts:198`

Comando `print <expr>`: imprime un valor o fórmula en stdout.

```ts
export interface PrintCmdNode extends ASTNode
```


## `SetCmdNode`

> Interface · `ast/nodes.ts:205`

Comando `set <nombre> := <fórmula>`: asigna una fórmula a una variable mutable.

```ts
export interface SetCmdNode extends ASTNode
```


## `IfBranch`

> Interface · `ast/nodes.ts:212`

Rama condicional de un `if` con condición lógica sobre una fórmula.

```ts
export interface IfBranch
```


## `IfStmtNode`

> Interface · `ast/nodes.ts:219`

Sentencia `if <condición lógica> { ... } else { ... }` del control flow de ST.

```ts
export interface IfStmtNode extends ASTNode
```


## `ForStmtNode`

> Interface · `ast/nodes.ts:226`

Sentencia `for <var> in {A, B, C} { ... }`: itera sobre un conjunto de fórmulas.

```ts
export interface ForStmtNode extends ASTNode
```


## `WhileStmtNode`

> Interface · `ast/nodes.ts:234`

Sentencia `while <condición lógica> <fórmula> { ... }` con límite de iteraciones por seguridad.

```ts
export interface WhileStmtNode extends ASTNode
```


## `FnDeclNode`

> Interface · `ast/nodes.ts:243`

Declaración de función ST: `fn <nombre>(<params>) { ... }`.

```ts
export interface FnDeclNode extends ASTNode
```


## `ReturnStmtNode`

> Interface · `ast/nodes.ts:251`

Sentencia `return <fórmula>` dentro de una función ST.

```ts
export interface ReturnStmtNode extends ASTNode
```


## `FnCallNode`

> Interface · `ast/nodes.ts:257`

Llamada a función ST: `<nombre>(<args...>)`.

```ts
export interface FnCallNode extends ASTNode
```


## `ExportDeclNode`

> Interface · `ast/nodes.ts:264`

Declara una sentencia como pública al importar el módulo ST.

```ts
export interface ExportDeclNode extends ASTNode
```


## `DefineDeclNode`

> Interface · `ast/nodes.ts:272`

Declaración `define <nombre>[(<params>)] := <body>`: crea una abreviación de fórmula.

```ts
export interface DefineDeclNode extends ASTNode
```


## `UnfoldCmdNode`

> Interface · `ast/nodes.ts:281`

Comando `unfold <fórmula>`: expande las definiciones en la fórmula dada.

```ts
export interface UnfoldCmdNode extends ASTNode
```


## `FoldCmdNode`

> Interface · `ast/nodes.ts:287`

Comando `fold <fórmula>`: contrae subexpresiones que coinciden con definiciones.

```ts
export interface FoldCmdNode extends ASTNode
```


## `SourceField`

> Interface · `ast/nodes.ts:293`

Campo clave-valor de una declaración `source`.

```ts
export interface SourceField
```


## `SourceDeclNode`

> Interface · `ast/nodes.ts:299`

Declaración bibliográfica `source <nombre> { author: ..., year: ... }`.

```ts
export interface SourceDeclNode extends ASTNode
```


## `InterpretCmdNode`

> Interface · `ast/nodes.ts:306`

Comando `interpret "<texto>" as <fórmula>`: vincula un texto en lenguaje natural a su formalización.

```ts
export interface InterpretCmdNode extends ASTNode
```


## `GlossaryCmdNode`

> Interface · `ast/nodes.ts:314`

Comando `glossary`: imprime el glosario semántico del documento actual.

```ts
export interface GlossaryCmdNode extends ASTNode
```


## `LetPassageNode`

> Interface · `ast/nodes.ts:321`

Nodo `let <nombre> = passage "<path>"`: vincula un pasaje textual externo.

```ts
export interface LetPassageNode extends ASTNode
```


## `LetFormalizeNode`

> Interface · `ast/nodes.ts:329`

Nodo `let <nombre> = formalize <pasaje> as <fórmula>`: asocia una formalización a un pasaje.

```ts
export interface LetFormalizeNode extends ASTNode
```


## `LetFormulaNode`

> Interface · `ast/nodes.ts:338`

Nodo `let <nombre> = <fórmula>`: declara un alias de fórmula con descripción opcional.

```ts
export interface LetFormulaNode extends ASTNode
```


## `LetDescriptionNode`

> Interface · `ast/nodes.ts:347`

Nodo `let <nombre> = "<texto>"`: asigna una descripción semántica en lenguaje natural.

```ts
export interface LetDescriptionNode extends ASTNode
```


## `LetActionNode`

> Interface · `ast/nodes.ts:355`

Nodo `let <nombre> = <acción>`: almacena el resultado de una acción lógica en una variable.

```ts
export interface LetActionNode extends ASTNode
```


## `LetDeclNode`

> Type · `ast/nodes.ts:363`

Unión discriminada de todas las variantes de la declaración `let`.

```ts
export type LetDeclNode = | LetPassageNode | LetFormalizeNode | LetFormulaNode | LetDescriptionNode | LetActionNode;
```


## `ClaimDeclNode`

> Interface · `ast/nodes.ts:371`

Declaración de aserto: `claim <nombre> := <variable o fórmula>`.

```ts
export interface ClaimDeclNode extends ASTNode
```


## `SupportDeclNode`

> Interface · `ast/nodes.ts:380`

Declaración `support <claim> from <source>`: vincula evidencia bibliográfica a un aserto.

```ts
export interface SupportDeclNode extends ASTNode
```


## `ConfidenceDeclNode`

> Interface · `ast/nodes.ts:387`

Declara un nivel de confianza numérico (0-1) para un aserto.

```ts
export interface ConfidenceDeclNode extends ASTNode
```


## `ContextDeclNode`

> Interface · `ast/nodes.ts:394`

Declaración de contexto textual adicional para un aserto.

```ts
export interface ContextDeclNode extends ASTNode
```


## `Statement`

> Type · `ast/nodes.ts:403`

Unión discriminada de todas las sentencias válidas en un programa ST.

```ts
export type Statement = | LogicDeclNode | AxiomDeclNode | TheoremDeclNode | DeriveCmdNode | CheckValidCmdNode | CheckSatisfiableCmdNode | CheckEquivalentCmdNode | ProveCmdNode | CountermodelCmdNode | TruthTableCmdNode | LetDeclNode | ClaimDeclNode | SupportDeclNode | ConfidenceDeclNode | ContextDeclNode | RenderCmdNode | AnalyzeCmdNode | ExplainCmdNode | ImportDeclNode | ProofBlockNode | TheoryDeclNode | PrintCmdNode | SetCmdNode | IfStmtNode | ForStmtNode | WhileStmtNode | FnDeclNode | ReturnStmtNode | FnCallNode | ExportDeclNode | DefineDeclNode | UnfoldCmdNode | FoldCmdNode | SourceDeclNode | InterpretCmdNode | GlossaryCmdNode;
```


## `Program`

> Interface · `ast/nodes.ts:442`

Representa un programa ST completo: lista de sentencias + ruta del archivo fuente.

```ts
export interface Program
```

