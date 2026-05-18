import argparse
import ctypes
import os
import pefile


def arch_of(path: str) -> str:
    pe = pefile.PE(path)
    m = pe.FILE_HEADER.Machine
    return {0x14C: "x86", 0x8664: "x64"}.get(m, hex(m))


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate Active Worlds aw.dll architecture and basic exports")
    parser.add_argument("dll", help="Path to aw.dll")
    args = parser.parse_args()

    dll_path = os.path.abspath(args.dll)
    if not os.path.exists(dll_path):
        print(f"missing: {dll_path}")
        return 2

    arch = arch_of(dll_path)
    print(f"path: {dll_path}")
    print(f"machine: {arch}")

    try:
        lib = ctypes.WinDLL(dll_path)
        print("load: ok")
    except OSError as e:
        print(f"load: failed ({e})")
        return 1

    try:
        f = lib.aw_sdk_build
        f.restype = ctypes.c_int
        print(f"aw_sdk_build: {f()}")
    except Exception as e:
        print(f"aw_sdk_build: failed ({e})")
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
