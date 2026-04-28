(begin
  (let entities
    (list
      (list 200 50 255 0 0)
      (list 500 100 0 0 255)
    )
  )

  (map
    (fn (e)
      (list "circle"
        (first e)
        (second e)
        20
        (nth e 2)
        (nth e 3)
        (nth e 4)
      )
    )
    entities
  )
)
