(print
  ((fn (x)
     (begin
       (print x)
       (print (add x 1))
       (add x 2)))
   5))
