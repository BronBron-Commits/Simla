(print
  (reduce
    (fn (acc x) (add acc x))
    0
    (list 1 2 3 4)))
