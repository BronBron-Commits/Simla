(begin
  ;; init once
  (let entities
    (or entities
      (list
        (list "x" 200 "y" 50 "vx" 0 "vy" 0 "r" 255 "g" 0 "b" 0)
      )
    )
  )

  ;; update
  (let entities
    (map
      (fn (e)
        (begin
          ;; compute new velocity directly from entity
          (let nvx
            (mul
              (add
                (get e "vx")
                (mul (sub keyd keya) 0.5)
              )
              0.9
            )
          )

          (let nvy
            (mul
              (add
                (get e "vy")
                (mul (sub keys keyw) 0.5)
              )
              0.9
            )
          )

          ;; compute new position
          (let nx (add (get e "x") nvx))
          (let ny (add (get e "y") nvy))

          ;; 🔥 RETURN FULL NEW ENTITY
          (list
            "x" nx
            "y" ny
            "vx" nvx
            "vy" nvy
            "r" (get e "r")
            "g" (get e "g")
            "b" (get e "b")
          )
        )
      )
      entities
    )
  )

  ;; render
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
