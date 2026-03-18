// ST Standard Library: Ethics & Deontic Logic
logic deontic.standard

export theory EticaBase {
  // Axiomas fundamentales de la logica deontica estandar (KD)
  axiom consistencia = []P -> <>P  // Lo obligatorio es permitido
  axiom distribucion = [](P -> Q) -> ([]P -> []Q) // Si es obligatorio que P implique Q, y P es obligatorio, Q es obligatorio

  // Equivalencias semanticas
  export fn prohibido(phi) {
    return [](!phi) // Prohibido es obligatorio no
  }

  export fn permitido(phi) {
    return <>(phi) // Permitido es no obligatorio no
  }

  export fn opcional(phi) {
    return (<>phi) & (<>(!phi)) // Permitido hacerlo y permitido no hacerlo
  }
}
