(begin
  (let x (or x 400))
  (let y (or y 100))
  (let vx (or vx 0))
  (let vy (or vy 0))

  ;; gravity
  (let vy (add vy 0.5))
  (let ny (add y vy))
  (let ny (min 580 ny))
  (let y ny)

  (list
    ;; row y=560
    (list "rect" 0   560 40 40 200 200 200)
    (list "rect" 40  560 40 40 80  80  80)
    (list "rect" 80  560 40 40 200 200 200)
    (list "rect" 120 560 40 40 80  80  80)
    (list "rect" 160 560 40 40 200 200 200)
    (list "rect" 200 560 40 40 80  80  80)
    (list "rect" 240 560 40 40 200 200 200)
    (list "rect" 280 560 40 40 80  80  80)
    (list "rect" 320 560 40 40 200 200 200)
    (list "rect" 360 560 40 40 80  80  80)

    ;; row y=520 (offset)
    (list "rect" 0   520 40 40 80  80  80)
    (list "rect" 40  520 40 40 200 200 200)
    (list "rect" 80  520 40 40 80  80  80)
    (list "rect" 120 520 40 40 200 200 200)
    (list "rect" 160 520 40 40 80  80  80)
    (list "rect" 200 520 40 40 200 200 200)
    (list "rect" 240 520 40 40 80  80  80)
    (list "rect" 280 520 40 40 200 200 200)
    (list "rect" 320 520 40 40 80  80  80)
    (list "rect" 360 520 40 40 200 200 200)

    ;; ball
    (list "circle" x y 20 255 0 0)
  )
)
