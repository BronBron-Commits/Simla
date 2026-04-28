(begin
  (let x (or x 400))
  (let y (or y 100))
  (let vx (or vx 0))
  (let vy (or vy 0))

  ;; gravity
  (let vy (add vy 0.5))

  ;; integrate
  (let ny (add y vy))

  ;; floor clamp
  (let ny (min 580 ny))

  ;; commit
  (let y ny)

  (list
    (list "circle" x y 20 255 0 0))
)
