(begin
  (let x (or x 400))
  (let y (or y 300))

  (let x (add x (sub keyD keyA)))
  (let y (add y (sub keyS keyW)))

  (list
    (list "circle" x y 20 255 0 0)))
