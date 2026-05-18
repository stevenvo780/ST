;; profile: classical.propositional

// Este archivo contiene un error de sintaxis intencional.
// El parser de st-lang debe rechazarlo con un error (exitCode != 0).
logic classical.propositional

// INCORRECTO: fórmula con tokens inválidos — debe fallar en parse.
check valid @@formula-invalida@@
