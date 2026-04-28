(begin
  ;; ball 1
  (let x1 (or x1 200))
  (let y1 (or y1 50))
  (let vy1 (or vy1 0))

  (let vy1 (add vy1 0.5))
  (let y1 (min 580 (add y1 vy1)))

  ;; ball 2
  (let x2 (or x2 500))
  (let y2 (or y2 100))
  (let vy2 (or vy2 0))

  (let vy2 (add vy2 0.3))
  (let y2 (min 580 (add y2 vy2)))

  ;; return scene
  (list
    (list "circle" x1 y1 20 255 0 0)
    (list "circle" x2 y2 20 0 0 255)
  )
)
