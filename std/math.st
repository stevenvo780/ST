// ST Standard Library: Math & Arithmetic
logic arithmetic

export theory Algebra {
  axiom identidad_suma = (x + 0 = x)
  axiom identidad_mult = (x * 1 = x)
  axiom conmutativa_suma = (x + y = y + x)
  axiom conmutativa_mult = (x * y = y * x)
  axiom distributiva = (x * (y + z) = (x * y) + (x * z))

  export fn es_par(n) {
    return (n % 2) = 0
  }

  export fn es_impar(n) {
    return (n % 2) = 1
  }
}
