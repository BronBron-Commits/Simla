from pathlib import Path

OUT = Path("c-simla")

RULE_TEMPLATE = """(begin
  (let clampMove
    (fn (player selected enemy)
      (if (eq selected enemy)
        player
        (if (lt selected (sub player 3))
          player
          (if (gt selected (add player 3))
            player
            selected
          )
        )
      )
    )
  )

  (let player {player})
  (let selected {selected})
  (let enemy {enemy})

  (clampMove player selected enemy)
)
"""

CASES = [
    ("combat_rule.sim", 7, 10, 14, 10),
    ("combat_rule_blocked_enemy.sim", 7, 14, 14, 7),
    ("combat_rule_too_far_left.sim", 7, 3, 14, 7),
    ("combat_rule_too_far_right.sim", 7, 11, 14, 7),
]

def main():
    for filename, player, selected, enemy, expected in CASES:
        path = OUT / filename
        path.write_text(
            RULE_TEMPLATE.format(
                player=player,
                selected=selected,
                enemy=enemy,
            )
        )
        print(f"wrote {path} expected={expected}")

    runner = OUT / "combat_cases.txt"
    extra = [
        ("c-simla/spec/core.sim", 10),
        ("c-simla/spec/functions.sim", 10),
        ("c-simla/spec/lists.sim", 5),
        ("c-simla/spec/conditionals.sim", 1),
    ]

    runner.write_text(
        "\n".join(f"c-simla/{name} {expected}" for name, *_rest, expected in CASES) + "\n" +
        "\n".join(f"{path} {expected}" for path, expected in extra) + "\n"
    )
    print(f"wrote {runner}")

if __name__ == "__main__":
    main()
