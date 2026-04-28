(begin
  (let x (or x 400))
  (let y (or y 300))

  (let vx (or vx 0))
  (let vy (or vy 0))

  (let vx (add vx (mul (sub keyD keyA) 0.5)))
  (let vy (add vy (mul (sub keyS keyW) 0.5)))

  (let vx (mul vx 0.9))
  (let vy (mul vy 0.9))

  (let x (add x vx))
  (let y (add y vy))

  (list
    (list "circle" x y 20 0 255 0)))
