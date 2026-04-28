(begin
  (list
    (list "rect" 50 50 100 100 255 0 0)
    (list "circle" 200 200 40 0 0 255)
    (list "translate"
      (mul 100 (sin time))
      0
      (list "circle" 400 300 30 255 255 0))
    (list "rotate"
      time
      (list "rect" 350 250 80 80 0 255 0))))
