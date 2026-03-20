// Aislamiento: El modelo infinito
logic classical.first_order
let infinite_model = (forall x (!R(x,x))) & (forall x (forall y (forall z (((R(x,y) & R(y,z)) -> R(x,z)))))) & (forall x (exists y (R(x,y))))
print "Iniciando evaluacion del modelo infinito en FOL..."
check satisfiable infinite_model
print "Esto no deberia imprimirse si FOL se cuelga"
