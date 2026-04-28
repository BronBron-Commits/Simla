(begin
  (let entities
    (or entities
      (list
        (list "x" 200 "y" 50 "vy" 0 "r" 255 "g" 0 "b" 0)
        (list "x" 500 "y" 100 "vy" 0 "r" 0 "g" 0 "b" 255)
      )
    )
  )

  (let entities
    (map
      (fn (e)
        (begin
          (let vy (add (get e "vy") 0.5))
          (let y  (min 580 (add (get e "y") vy)))

          (set
            (set e "vy" vy)
            "y" y
          )
        )
      )
      entities
    )
  )

  (map
    (fn (e)
      (list "circle"
        (get e "x")
        (get e "y")
        20
        (get e "r")
        (get e "g")
        (get e "b")
      )
    )
    entities
  )
)
