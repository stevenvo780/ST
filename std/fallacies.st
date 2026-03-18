// ST Standard Library: Fallacies & Argumentation
logic classical.propositional

export theory FalaciasFormales {
  // Esquemas que NO son validos (suelen engañar a la intuicion)

  // 1. Afirmacion del consecuente
  export let afirmacion_consecuente = {
    let premisa1 = P -> Q
    let premisa2 = Q
    let conclusion = P
    // Ojo: analizar {premisa1, premisa2} -> conclusion lanzara advertencia
  }

  // 2. Negacion del antecedente
  export let negacion_antecedente = {
    let premisa1 = P -> Q
    let premisa2 = !P
    let conclusion = !Q
  }

  // Comprueba si una implicacion bidireccional esta disfrazada
  export fn parece_bicondicional(p, q) {
    print "Comprobando si " + p + " y " + q + " son confundibles"
    check valid (p -> q)
    check invalid (q -> p)
  }
}
