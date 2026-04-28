(fn makeAdder (n)
  (fn inner (y)
    (add n y)))

(print ((makeAdder 5) 3))
