(begin
  (let entities
    (list
      (list "id" 1 "type" "player" "hp" 10 "team" "player")
      (list "id" 2 "type" "enemy"  "hp" 3  "team" "enemy")
      (list "id" 3 "type" "enemy"  "hp" 1  "team" "enemy")
    )
  )

  ;; damage enemies
  (let entities
    (map
      (fn (e)
        (if (eq (get e "team") "enemy")
          (set e "hp" (sub (get e "hp") 1))
          e
        )
      )
      entities
    )
  )

  ;; remove dead entities
  (let entities
    (filter
      (fn (e) (gt (get e "hp") 0))
      entities
    )
  )

  ;; return final world summary
  (list
    "entities" entities
    "count" (len entities)
  )
)
