(let x 10)

(fn makeAdder (n)
  (fn addInner (y)
    (add x (add n y))))

(let add5 (makeAdder 5))

(print (add5 3))
