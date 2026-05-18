import ctypes
import json
import os
import sys
import threading

# Attribute constants based on the bundled ConsoleApp sample.
AW_LOGIN_NAME = 0
AW_LOGIN_PASSWORD = 1
AW_LOGIN_OWNER = 2
AW_LOGIN_PRIVILEGE_PASSWORD = 3
AW_LOGIN_PRIVILEGE_NUMBER = 4
AW_LOGIN_PRIVILEGE_NAME = 5
AW_LOGIN_APPLICATION = 6
AW_LOGIN_EMAIL = 7
AW_CITIZEN_NUMBER = 29

AW_MY_X = 198
AW_MY_Y = 199
AW_MY_Z = 200
AW_MY_YAW = 201
AW_MY_PITCH = 202
AW_MY_TYPE = 203
AW_MY_GESTURE = 204
AW_MY_STATE = 205

AW_ENTER_GLOBAL = 328

AW_CELL_X = 224
AW_CELL_Z = 225
AW_CELL_SEQUENCE = 226
AW_CELL_SIZE = 227
AW_CELL_ITERATOR = 228
AW_CELL_COMBINE = 229

# World attributes
AW_WORLD_OBJECT_PATH = 48
AW_WORLD_BUILD_RIGHT = 50
AW_WORLD_OBJECT_PASSWORD = 64
AW_WORLD_BUILD_CAPABILITY = 71
AW_WORLD_ALLOW_TOURIST_BUILD = 184

# Object attributes — correct values from Aw.h enum (AW_ATTRIBUTE)
AW_OBJECT_ID          = 230
AW_OBJECT_NUMBER      = 231
AW_OBJECT_X           = 232
AW_OBJECT_Y           = 233
AW_OBJECT_Z           = 234
AW_OBJECT_YAW         = 235
AW_OBJECT_TILT        = 236
AW_OBJECT_ROLL        = 237
AW_OBJECT_MODEL       = 238
AW_OBJECT_DESCRIPTION = 239
AW_OBJECT_ACTION      = 240
AW_OBJECT_OWNER       = 244
AW_OBJECT_TYPE        = 248
AW_OBJECT_DATA        = 249
AW_QUERY_COMPLETE     = 250
AW_OBJECT_CALLBACK_REFERENCE = 454

# Events — AW_EVENT_ATTRIBUTE enum values
AW_EVENT_CELL_BEGIN  = 3
AW_EVENT_CELL_OBJECT = 4
AW_EVENT_CELL_END    = 5
AW_EVENT_OBJECT_ADD  = 7

# Callbacks — AW_CALLBACK enum values
AW_CALLBACK_OBJECT_RESULT = 3
AW_CALLBACK_QUERY    = 8
AW_CALLBACK_OBJECT_QUERY = 41

RC_NAMES = {
    0: "RC_SUCCESS",
    1: "RC_CITIZENSHIP_EXPIRED",
    3: "RC_NO_SUCH_CITIZEN",
    13: "RC_INVALID_PASSWORD",
    18: "RC_MUST_UPGRADE",
    27: "RC_NO_SUCH_WORLD",
    32: "RC_UNAUTHORIZED",
    58: "RC_MUST_UPGRADE",
    59: "RC_BOT_LIMIT_EXCEEDED",
    67: "RC_NO_SUCH_SESSION",
    77: "RC_CITIZEN_DISABLED",
    404: "RC_UNABLE_TO_CONTACT_UNIVERSE",
    439: "RC_NO_CONNECTION",
    444: "RC_NOT_INITIALIZED",
    445: "RC_NO_INSTANCE",
    454: "RC_VERSION_MISMATCH",
    466: "RC_EJECTED",
    467: "RC_NOT_WELCOME",
    471: "RC_CONNECTION_LOST",
    474: "RC_NOT_AVAILABLE",
    500: "RC_CANT_RESOLVE_UNIVERSE_HOST",
    505: "RC_INVALID_ARGUMENT",
}


def rc_name(rc: int) -> str:
    return RC_NAMES.get(int(rc), "RC_UNKNOWN")


def decode_aw_string(value) -> str:
    return (value or b"").decode("latin-1", errors="replace").rstrip("\x00").strip()


class AWBridge:
    def __init__(self) -> None:
        self._dll = None
        self._initialized = False  # aw_init called
        self._connected = False
        self._lock = threading.Lock()
        self._sdk_build = None
        self._query_objects: list = []
        self._query_done = threading.Event()
        self._cb_object_add = None   # keep references alive
        self._cb_query_done = None
        self._world_objects = {}
        self._cell_stats = {"begins": 0, "objects": 0, "ends": 0}
        self._cb_cell_begin = None
        self._cb_cell_object = None
        self._cb_cell_end = None

    def _load(self) -> None:
        if self._dll is not None:
            return

        dll_path = os.environ.get("AW_CLASSICSDK_PATH", r"Deltaworlds\ConsoleApp\ConsoleApp\sdk\ClassicSdk.dll")
        abs_path = os.path.abspath(dll_path)

        if not os.path.exists(abs_path):
            raise RuntimeError(f"ClassicSdk.dll not found: {abs_path}")

        dll = ctypes.WinDLL(abs_path)

        dll.aw_init.argtypes = [ctypes.c_int]
        dll.aw_init.restype = ctypes.c_int

        dll.aw_create.argtypes = [ctypes.c_char_p, ctypes.c_int, ctypes.POINTER(ctypes.c_void_p)]
        dll.aw_create.restype = ctypes.c_int

        dll.aw_login.argtypes = []
        dll.aw_login.restype = ctypes.c_int

        dll.aw_enter.argtypes = [ctypes.c_char_p]
        dll.aw_enter.restype = ctypes.c_int

        dll.aw_term.argtypes = []
        dll.aw_term.restype = ctypes.c_int

        dll.aw_state_change.argtypes = []
        dll.aw_state_change.restype = ctypes.c_int

        dll.aw_wait.argtypes = [ctypes.c_int]
        dll.aw_wait.restype = ctypes.c_int

        dll.aw_int.argtypes = [ctypes.c_int]
        dll.aw_int.restype = ctypes.c_int

        dll.aw_int_set.argtypes = [ctypes.c_int, ctypes.c_int]
        dll.aw_int_set.restype = ctypes.c_int

        dll.aw_bool_set.argtypes = [ctypes.c_int, ctypes.c_int]
        dll.aw_bool_set.restype = ctypes.c_int

        dll.aw_string_set.argtypes = [ctypes.c_int, ctypes.c_char_p]
        dll.aw_string_set.restype = ctypes.c_int

        dll.aw_data_set.argtypes = [ctypes.c_int, ctypes.c_char_p, ctypes.c_uint]
        dll.aw_data_set.restype = ctypes.c_int

        dll.aw_sdk_build.argtypes = []
        dll.aw_sdk_build.restype = ctypes.c_int

        dll.aw_object_add.argtypes = []
        dll.aw_object_add.restype = ctypes.c_int

        try:
            dll.aw_object_delete.argtypes = []
            dll.aw_object_delete.restype = ctypes.c_int
        except AttributeError:
            pass

        dll.aw_string.argtypes = [ctypes.c_int]
        dll.aw_string.restype = ctypes.c_char_p

        dll.aw_world_attribute_set.argtypes = [ctypes.c_int, ctypes.c_char_p]
        dll.aw_world_attribute_set.restype = ctypes.c_int

        dll.aw_world_attribute_get.argtypes = [ctypes.c_int, ctypes.POINTER(ctypes.c_int), ctypes.c_char_p]
        dll.aw_world_attribute_get.restype = ctypes.c_int

        try:
            dll.aw_check_right.argtypes = [ctypes.c_int, ctypes.c_char_p]
            dll.aw_check_right.restype = ctypes.c_int
        except Exception:
            pass

        try:
            dll.aw_has_world_right.argtypes = [ctypes.c_int, ctypes.c_int]
            dll.aw_has_world_right.restype = ctypes.c_int
        except Exception:
            pass

        self._dll = dll
        self._sdk_build = int(dll.aw_sdk_build())

    def _load_query_funcs(self) -> bool:
        """Bind query-related functions. Returns False if DLL doesn't export them."""
        dll = self._dll
        try:
            dll.aw_event_set.argtypes = [ctypes.c_int, ctypes.c_void_p]
            dll.aw_event_set.restype = ctypes.c_int

            dll.aw_callback_set.argtypes = [ctypes.c_int, ctypes.c_void_p]
            dll.aw_callback_set.restype = ctypes.c_int

            dll.aw_cell_next.argtypes = []
            dll.aw_cell_next.restype = ctypes.c_int

            dll.aw_object_query.argtypes = []
            dll.aw_object_query.restype = ctypes.c_int

            Seq5x5Row = ctypes.c_int * 5
            Seq5x5 = Seq5x5Row * 5
            dll.aw_query_5x5.argtypes = [ctypes.c_int, ctypes.c_int, Seq5x5]
            dll.aw_query_5x5.restype = ctypes.c_int
            dll._Seq5x5 = Seq5x5
            return True
        except AttributeError as e:
            return False

    def _load_cell_stream_funcs(self) -> bool:
        dll = self._dll
        try:
            dll.aw_event_set.argtypes = [ctypes.c_int, ctypes.c_void_p]
            dll.aw_event_set.restype = ctypes.c_int
            return True
        except AttributeError:
            return False

    @staticmethod
    def _enc(s: str) -> bytes:
        return (s or "").encode("utf-8", errors="ignore")

    def object_query(self, args: dict) -> dict:
        with self._lock:
            if not self._connected:
                raise RuntimeError("not connected")

            if not self._load_query_funcs():
                raise RuntimeError("aw_object_query/aw_callback_set not exported by this SDK build")

            object_id = int(args.get("objectId", 0))
            object_number = int(args.get("objectNumber", 0))
            if object_id <= 0 and object_number == 0:
                raise RuntimeError("objectId must be > 0 or objectNumber must be non-zero")

            done = {"value": False, "rc": None}
            result = {}
            CBTYPE = ctypes.CFUNCTYPE(None, ctypes.c_int)

            def on_object_query(rc: int):
                done["value"] = True
                done["rc"] = int(rc)
                if int(rc) == 0:
                    model = decode_aw_string(self._dll.aw_string(AW_OBJECT_MODEL))
                    if model:
                        result.update({
                            "id": int(self._dll.aw_int(AW_OBJECT_ID)),
                            "number": int(self._dll.aw_int(AW_OBJECT_NUMBER)),
                            "x": int(self._dll.aw_int(AW_OBJECT_X)),
                            "y": int(self._dll.aw_int(AW_OBJECT_Y)),
                            "z": int(self._dll.aw_int(AW_OBJECT_Z)),
                            "yaw": int(self._dll.aw_int(AW_OBJECT_YAW)),
                            "tilt": int(self._dll.aw_int(AW_OBJECT_TILT)),
                            "roll": int(self._dll.aw_int(AW_OBJECT_ROLL)),
                            "model": model,
                            "description": decode_aw_string(self._dll.aw_string(AW_OBJECT_DESCRIPTION)),
                            "action": decode_aw_string(self._dll.aw_string(AW_OBJECT_ACTION)),
                            "type": int(self._dll.aw_int(AW_OBJECT_TYPE)),
                            "owner": int(self._dll.aw_int(AW_OBJECT_OWNER)),
                        })

            cb = CBTYPE(on_object_query)
            self._cb_query_done = cb
            self._dll.aw_callback_set(AW_CALLBACK_OBJECT_QUERY, cb)
            if object_id > 0:
                self._dll.aw_int_set(AW_OBJECT_ID, object_id)
            else:
                self._dll.aw_int_set(AW_OBJECT_NUMBER, object_number)

            rc = int(self._dll.aw_object_query())
            if rc != 0:
                self._dll.aw_callback_set(AW_CALLBACK_OBJECT_QUERY, None)
                raise RuntimeError(f"aw_object_query failed rc={rc} ({rc_name(rc)})")

            timeout_ms = int(args.get("timeoutMs", 5000))
            elapsed = 0
            while not done["value"] and elapsed < timeout_ms:
                self._dll.aw_wait(100)
                elapsed += 100

            self._dll.aw_callback_set(AW_CALLBACK_OBJECT_QUERY, None)

            return {
                "complete": done["value"],
                "rc": done["rc"],
                "rcName": rc_name(done["rc"]) if done["rc"] is not None else None,
                "object": result or None,
            }

    def object_add(self, args: dict) -> dict:
        with self._lock:
            if not self._connected:
                raise RuntimeError("not connected")

            object_type = int(args.get("type", 0))
            x = int(args.get("x", self._dll.aw_int(AW_MY_X)))
            y = int(args.get("y", self._dll.aw_int(AW_MY_Y)))
            z = int(args.get("z", self._dll.aw_int(AW_MY_Z)))
            yaw = int(args.get("yaw", 0))
            tilt = int(args.get("tilt", 0))
            roll = int(args.get("roll", 0))
            model = str(args.get("model") or "").strip()
            description = str(args.get("description") or "")
            action = str(args.get("action") or "")
            callback_reference = int(args.get("callbackReference", 0))
            data = args.get("data")

            if not model:
                raise RuntimeError("model is required")

            result = {"complete": False, "rc": None}
            CBTYPE = ctypes.CFUNCTYPE(None, ctypes.c_int)

            def on_object_result(rc: int):
                result["complete"] = True
                result["rc"] = int(rc)
                if int(rc) == 0:
                    result.update({
                        "number": int(self._dll.aw_int(AW_OBJECT_NUMBER)),
                        "id": int(self._dll.aw_int(AW_OBJECT_ID)),
                        "callbackReference": int(self._dll.aw_int(AW_OBJECT_CALLBACK_REFERENCE)),
                        "cellX": int(self._dll.aw_int(AW_CELL_X)),
                        "cellZ": int(self._dll.aw_int(AW_CELL_Z)),
                    })

            cb = CBTYPE(on_object_result)
            self._cb_object_add = cb
            self._dll.aw_callback_set(AW_CALLBACK_OBJECT_RESULT, cb)

            self._dll.aw_int_set(AW_OBJECT_TYPE, object_type)
            self._dll.aw_int_set(AW_OBJECT_X, x)
            self._dll.aw_int_set(AW_OBJECT_Y, y)
            self._dll.aw_int_set(AW_OBJECT_Z, z)
            self._dll.aw_int_set(AW_OBJECT_YAW, yaw)
            self._dll.aw_int_set(AW_OBJECT_TILT, tilt)
            self._dll.aw_int_set(AW_OBJECT_ROLL, roll)
            self._dll.aw_string_set(AW_OBJECT_MODEL, self._enc(model))
            self._dll.aw_string_set(AW_OBJECT_DESCRIPTION, self._enc(description))
            self._dll.aw_string_set(AW_OBJECT_ACTION, self._enc(action))
            self._dll.aw_int_set(AW_OBJECT_CALLBACK_REFERENCE, callback_reference)

            payload = None
            if isinstance(data, str):
                payload = data.encode("utf-8")
            elif isinstance(data, list):
                payload = bytes(data)
            elif isinstance(data, (bytes, bytearray)):
                payload = bytes(data)
            if payload is not None:
                self._dll.aw_data_set(AW_OBJECT_DATA, payload, len(payload))

            rc = int(self._dll.aw_object_add())
            if rc != 0:
                self._dll.aw_callback_set(AW_CALLBACK_OBJECT_RESULT, None)
                raise RuntimeError(f"aw_object_add failed rc={rc} ({rc_name(rc)})")

            timeout_ms = int(args.get("timeoutMs", 5000))
            elapsed = 0
            while not result["complete"] and elapsed < timeout_ms:
                self._dll.aw_wait(100)
                elapsed += 100

            self._dll.aw_callback_set(AW_CALLBACK_OBJECT_RESULT, None)

            if result.get("complete") and result.get("rc") == 0 and result.get("number") is not None:
                self._world_objects[result["number"]] = {
                    "number": result["number"],
                    "id": result.get("id"),
                    "x": x,
                    "y": y,
                    "z": z,
                    "yaw": yaw,
                    "tilt": tilt,
                    "roll": roll,
                    "model": model,
                    "description": description,
                    "action": action,
                    "type": object_type,
                    "owner": int(self._dll.aw_int(AW_OBJECT_OWNER)),
                }

            return {
                "complete": result["complete"],
                "rc": result["rc"],
                "rcName": rc_name(result["rc"]) if result["rc"] is not None else None,
                "number": result.get("number"),
                "id": result.get("id"),
                "callbackReference": result.get("callbackReference"),
                "cellX": result.get("cellX"),
                "cellZ": result.get("cellZ"),
                "object": {
                    "type": object_type,
                    "x": x,
                    "y": y,
                    "z": z,
                    "yaw": yaw,
                    "tilt": tilt,
                    "roll": roll,
                    "model": model,
                    "description": description,
                    "action": action,
                },
            }

    def object_delete(self, args: dict) -> dict:
        with self._lock:
            if not self._connected:
                raise RuntimeError("not connected")
            if not hasattr(self._dll, "aw_object_delete"):
                raise RuntimeError("aw_object_delete not exported by this SDK build")

            object_id = int(args.get("objectId", 0))
            object_number = int(args.get("objectNumber", 0))
            if object_id <= 0 and object_number == 0:
                raise RuntimeError("objectId must be > 0 or objectNumber must be non-zero")

            result = {"complete": False, "rc": None}
            CBTYPE = ctypes.CFUNCTYPE(None, ctypes.c_int)

            def on_object_result(rc: int):
                result["complete"] = True
                result["rc"] = int(rc)
                if int(rc) == 0:
                    result.update({
                        "number": int(self._dll.aw_int(AW_OBJECT_NUMBER)),
                        "id": int(self._dll.aw_int(AW_OBJECT_ID)),
                    })

            cb = CBTYPE(on_object_result)
            self._cb_object_delete = cb
            self._dll.aw_callback_set(AW_CALLBACK_OBJECT_RESULT, cb)
            if object_id > 0:
                self._dll.aw_int_set(AW_OBJECT_ID, object_id)
            else:
                self._dll.aw_int_set(AW_OBJECT_NUMBER, object_number)

            rc = int(self._dll.aw_object_delete())
            if rc != 0:
                self._dll.aw_callback_set(AW_CALLBACK_OBJECT_RESULT, None)
                raise RuntimeError(f"aw_object_delete failed rc={rc} ({rc_name(rc)})")

            timeout_ms = int(args.get("timeoutMs", 5000))
            elapsed = 0
            while not result["complete"] and elapsed < timeout_ms:
                self._dll.aw_wait(100)
                elapsed += 100

            self._dll.aw_callback_set(AW_CALLBACK_OBJECT_RESULT, None)

            if result.get("complete") and result.get("rc") == 0:
                to_remove = []
                for number, obj in self._world_objects.items():
                    if int(obj.get("id") or 0) == object_id:
                        to_remove.append(number)
                for number in to_remove:
                    self._world_objects.pop(number, None)

            return {
                "complete": result["complete"],
                "rc": result["rc"],
                "rcName": rc_name(result["rc"]) if result["rc"] is not None else None,
                "number": result.get("number"),
                "id": result.get("id", object_id if object_id > 0 else None),
            }

    def _read_object_path(self, wait_ms: int = 0) -> str:
        if wait_ms > 0:
            self._dll.aw_wait(wait_ms)
        return decode_aw_string(self._dll.aw_string(AW_WORLD_OBJECT_PATH))

    def _world_attribute_get(self, attribute: int) -> dict:
        read_only = ctypes.c_int(0)
        buffer = ctypes.create_string_buffer(4096)
        rc = int(self._dll.aw_world_attribute_get(int(attribute), ctypes.byref(read_only), buffer))
        value = decode_aw_string(buffer.value)
        return {
            "attribute": int(attribute),
            "rc": rc,
            "rcName": rc_name(rc),
            "readOnly": bool(read_only.value),
            "value": value,
        }

    def _world_diagnostics(self, wait_ms: int = 0) -> dict:
        if wait_ms > 0:
            self._dll.aw_wait(wait_ms)
        build_right = decode_aw_string(self._dll.aw_string(AW_WORLD_BUILD_RIGHT))
        citizen_number = int(self._dll.aw_int(AW_CITIZEN_NUMBER))

        can_build_by_list = None
        if build_right and hasattr(self._dll, "aw_check_right"):
            try:
                can_build_by_list = bool(self._dll.aw_check_right(citizen_number, self._enc(build_right)))
            except Exception:
                can_build_by_list = None

        can_build_by_world_right = None
        if hasattr(self._dll, "aw_has_world_right"):
            try:
                can_build_by_world_right = bool(self._dll.aw_has_world_right(citizen_number, AW_WORLD_BUILD_RIGHT))
            except Exception:
                can_build_by_world_right = None

        return {
            "objectPath": self._read_object_path(),
            "buildRight": build_right,
            "buildCapability": int(self._dll.aw_int(AW_WORLD_BUILD_CAPABILITY)),
            "allowTouristBuild": int(self._dll.aw_int(AW_WORLD_ALLOW_TOURIST_BUILD)),
            "objectPassword": decode_aw_string(self._dll.aw_string(AW_WORLD_OBJECT_PASSWORD)),
            "citizenNumber": citizen_number,
            "canBuildByList": can_build_by_list,
            "canBuildByWorldRight": can_build_by_world_right,
            "objectPathInfo": self._world_attribute_get(AW_WORLD_OBJECT_PATH),
        }

    def object_path_set(self, args: dict) -> dict:
        with self._lock:
            self._load()
            if not self._connected:
                raise RuntimeError("not connected")

            value = str(args.get("value") or args.get("objectPath") or "").strip()
            if not value:
                raise RuntimeError("objectPath is required")

            rc = int(self._dll.aw_world_attribute_set(AW_WORLD_OBJECT_PATH, self._enc(value)))
            if rc != 0:
                raise RuntimeError(f"aw_world_attribute_set failed rc={rc} ({rc_name(rc)})")

            wait_ms = int(args.get("waitMs", 250))
            diagnostics = self._world_diagnostics(wait_ms)
            return {
                "connected": True,
                "sdkBuild": self._sdk_build,
                "requestedObjectPath": value,
                **diagnostics,
            }

    def _capture_current_object(self) -> None:
        model = decode_aw_string(self._dll.aw_string(AW_OBJECT_MODEL))
        if not model:
            return
        number = int(self._dll.aw_int(AW_OBJECT_NUMBER))
        self._world_objects[number] = {
            "number": number,
            "x": int(self._dll.aw_int(AW_OBJECT_X)),
            "y": int(self._dll.aw_int(AW_OBJECT_Y)),
            "z": int(self._dll.aw_int(AW_OBJECT_Z)),
            "yaw": int(self._dll.aw_int(AW_OBJECT_YAW)),
            "tilt": int(self._dll.aw_int(AW_OBJECT_TILT)),
            "roll": int(self._dll.aw_int(AW_OBJECT_ROLL)),
            "model": model,
            "description": decode_aw_string(self._dll.aw_string(AW_OBJECT_DESCRIPTION)),
            "action": decode_aw_string(self._dll.aw_string(AW_OBJECT_ACTION)),
            "type": int(self._dll.aw_int(AW_OBJECT_TYPE)),
            "owner": int(self._dll.aw_int(AW_OBJECT_OWNER)),
        }

    @staticmethod
    def _cell_iterator_value(cell_x: int, cell_z: int) -> int:
        x_word = ctypes.c_ushort(cell_x).value
        z_word = ctypes.c_ushort(cell_z).value
        return ctypes.c_int((x_word << 16) | z_word).value

    def _install_cell_stream_handlers(self) -> None:
        if not self._load_cell_stream_funcs():
            return

        CBTYPE = ctypes.CFUNCTYPE(None)

        def on_cell_begin():
            self._cell_stats["begins"] += 1

        def on_cell_object():
            self._cell_stats["objects"] += 1
            self._capture_current_object()

        def on_cell_end():
            self._cell_stats["ends"] += 1

        self._cb_cell_begin = CBTYPE(on_cell_begin)
        self._cb_cell_object = CBTYPE(on_cell_object)
        self._cb_cell_end = CBTYPE(on_cell_end)

        self._dll.aw_event_set(AW_EVENT_CELL_BEGIN, self._cb_cell_begin)
        self._dll.aw_event_set(AW_EVENT_CELL_OBJECT, self._cb_cell_object)
        self._dll.aw_event_set(AW_EVENT_CELL_END, self._cb_cell_end)

    def connect(self, args: dict) -> dict:
        with self._lock:
            self._load()
            if self._connected:
                return {"alreadyConnected": True, "sdkBuild": self._sdk_build}

            host = str(args.get("host") or os.environ.get("AW_HOST") or "auth.deltaworlds.com")
            port = int(args.get("port") or os.environ.get("AW_PORT") or 6671)
            world = str(args.get("world") or os.environ.get("AW_WORLD") or "Foundry")
            owner = int(args.get("owner") or os.environ.get("AW_OWNER") or 0)
            name = str(args.get("name") or os.environ.get("AW_NAME") or "SimlaBot")
            app = str(args.get("application") or os.environ.get("AW_APPLICATION") or "SimlaAWBridge")
            password = str(args.get("password") or os.environ.get("AW_PASSWORD") or "")
            privilege_password = str(args.get("privilegePassword") or os.environ.get("AW_PRIVILEGE_PASSWORD") or "")
            privilege_name = str(args.get("privilegeName") or os.environ.get("AW_PRIVILEGE_NAME") or "")
            privilege_number = int(args.get("privilegeNumber") or os.environ.get("AW_PRIVILEGE_NUMBER") or 0)
            enter_global = 1 if bool(args.get("enterGlobal") or False) else 0

            if not self._initialized:
                rc = int(self._dll.aw_init(self._sdk_build))
                if rc != 0:
                    raise RuntimeError(f"aw_init failed rc={rc} ({rc_name(rc)})")
                self._initialized = True

            instance = ctypes.c_void_p()
            rc = int(self._dll.aw_create(self._enc(host), int(port), ctypes.byref(instance)))
            if rc != 0:
                # Reset SDK so next connect attempt can try aw_init again
                self._dll.aw_term()
                self._initialized = False
                raise RuntimeError(f"aw_create failed rc={rc} ({rc_name(rc)})")

            # Login fields
            self._dll.aw_int_set(AW_LOGIN_OWNER, int(owner))
            self._dll.aw_string_set(AW_LOGIN_NAME, self._enc(name))
            self._dll.aw_string_set(AW_LOGIN_APPLICATION, self._enc(app))

            if password:
                self._dll.aw_string_set(AW_LOGIN_PASSWORD, self._enc(password))
            if privilege_password:
                self._dll.aw_string_set(AW_LOGIN_PRIVILEGE_PASSWORD, self._enc(privilege_password))
            if privilege_name:
                self._dll.aw_string_set(AW_LOGIN_PRIVILEGE_NAME, self._enc(privilege_name))
            if privilege_number > 0:
                self._dll.aw_int_set(AW_LOGIN_PRIVILEGE_NUMBER, privilege_number)

            rc = int(self._dll.aw_login())
            if rc != 0:
                self._dll.aw_term()
                self._initialized = False
                raise RuntimeError(f"aw_login failed rc={rc} ({rc_name(rc)})")

            self._dll.aw_bool_set(AW_ENTER_GLOBAL, int(enter_global))
            rc = int(self._dll.aw_enter(self._enc(world)))
            if rc != 0:
                self._dll.aw_term()
                self._initialized = False
                raise RuntimeError(f"aw_enter failed rc={rc} ({rc_name(rc)})")

            # Initial avatar state
            self._dll.aw_int_set(AW_MY_X, int(args.get("x", 0)))
            self._dll.aw_int_set(AW_MY_Y, int(args.get("y", 0)))
            self._dll.aw_int_set(AW_MY_Z, int(args.get("z", 0)))
            self._dll.aw_int_set(AW_MY_YAW, int(args.get("yaw", 0)))
            self._dll.aw_int_set(AW_MY_TYPE, int(args.get("avatarType", 0)))

            rc = int(self._dll.aw_state_change())
            if rc != 0:
                raise RuntimeError(f"aw_state_change failed rc={rc} ({rc_name(rc)})")

            self._world_objects.clear()
            self._cell_stats = {"begins": 0, "objects": 0, "ends": 0}
            self._install_cell_stream_handlers()
            self._connected = True
            object_path = self._read_object_path(200)
            return {
                "connected": True,
                "sdkBuild": self._sdk_build,
                "host": host,
                "port": port,
                "world": world,
                "owner": owner,
                "name": name,
                "privilegeNumber": privilege_number,
                "loginPrivilegeName": decode_aw_string(self._dll.aw_string(AW_LOGIN_PRIVILEGE_NAME)),
                "citizenNumber": int(self._dll.aw_int(AW_CITIZEN_NUMBER)),
                "objectPath": object_path,
            }

    def _read_pose(self) -> dict:
        return {
            "x": int(self._dll.aw_int(AW_MY_X)),
            "y": int(self._dll.aw_int(AW_MY_Y)),
            "z": int(self._dll.aw_int(AW_MY_Z)),
            "yaw": int(self._dll.aw_int(AW_MY_YAW)),
            "pitch": int(self._dll.aw_int(AW_MY_PITCH)),
            "type": int(self._dll.aw_int(AW_MY_TYPE)),
            "gesture": int(self._dll.aw_int(AW_MY_GESTURE)),
            "state": int(self._dll.aw_int(AW_MY_STATE)),
        }

    def state(self, args: dict) -> dict:
        with self._lock:
            self._load()
            if not self._connected:
                return {"connected": False, "sdkBuild": self._sdk_build}

            wait_ms = int(args.get("waitMs", 20))
            self._dll.aw_wait(wait_ms)
            pose = self._read_pose()
            return {
                "connected": True,
                "sdkBuild": self._sdk_build,
                "pose": pose,
                **self._world_diagnostics(),
                "cellStats": dict(self._cell_stats),
                "nearbyObjectCount": len(self._world_objects),
            }

    def world_info(self, args: dict) -> dict:
        with self._lock:
            self._load()
            if not self._connected:
                return {"connected": False, "sdkBuild": self._sdk_build}

            wait_ms = int(args.get("waitMs", 100))
            return {
                "connected": True,
                "sdkBuild": self._sdk_build,
                **self._world_diagnostics(wait_ms),
            }

    def move(self, args: dict) -> dict:
        with self._lock:
            if not self._connected:
                raise RuntimeError("not connected")

            self._dll.aw_wait(int(args.get("waitMs", 5)))
            pose = self._read_pose()

            dx = int(args.get("dx", 0))
            dy = int(args.get("dy", 0))
            dz = int(args.get("dz", 0))
            dyaw = int(args.get("dyaw", 0))

            self._dll.aw_int_set(AW_MY_X, pose["x"] + dx)
            self._dll.aw_int_set(AW_MY_Y, pose["y"] + dy)
            self._dll.aw_int_set(AW_MY_Z, pose["z"] + dz)
            self._dll.aw_int_set(AW_MY_YAW, (pose["yaw"] + dyaw) % 360)

            rc = int(self._dll.aw_state_change())
            if rc != 0:
                raise RuntimeError(f"aw_state_change failed rc={rc} ({rc_name(rc)})")

            self._dll.aw_wait(5)
            return {"connected": True, "pose": self._read_pose()}

    def teleport(self, args: dict) -> dict:
        with self._lock:
            if not self._connected:
                raise RuntimeError("not connected")

            x = int(args.get("x", self._dll.aw_int(AW_MY_X)))
            y = int(args.get("y", self._dll.aw_int(AW_MY_Y)))
            z = int(args.get("z", self._dll.aw_int(AW_MY_Z)))
            yaw = int(args.get("yaw", self._dll.aw_int(AW_MY_YAW)))

            self._dll.aw_int_set(AW_MY_X, x)
            self._dll.aw_int_set(AW_MY_Y, y)
            self._dll.aw_int_set(AW_MY_Z, z)
            self._dll.aw_int_set(AW_MY_YAW, yaw)

            rc = int(self._dll.aw_state_change())
            if rc != 0:
                raise RuntimeError(f"aw_state_change failed rc={rc} ({rc_name(rc)})")

            self._dll.aw_wait(5)
            return {"connected": True, "pose": self._read_pose()}

    def query(self, args: dict) -> dict:
        with self._lock:
            if not self._connected:
                raise RuntimeError("not connected")

            if not self._load_query_funcs():
                raise RuntimeError("aw_cell_next not exported by this SDK build")

            self._world_objects.clear()
            self._cell_stats = {"begins": 0, "objects": 0, "ends": 0}
            self._install_cell_stream_handlers()
            self._dll.aw_wait(int(args.get("warmupMs", 50)))

            current_cell_x = int(self._dll.aw_int(AW_MY_X)) // 1000
            current_cell_z = int(self._dll.aw_int(AW_MY_Z)) // 1000
            radius = int(args.get("radius", 2))
            cell_errors = []

            for dz in range(-radius, radius + 1):
                for dx in range(-radius, radius + 1):
                    cell_x = current_cell_x + dx
                    cell_z = current_cell_z + dz
                    iterator_value = self._cell_iterator_value(cell_x, cell_z)
                    self._dll.aw_int_set(AW_CELL_ITERATOR, iterator_value)
                    self._dll.aw_bool_set(AW_CELL_COMBINE, 0)

                    rc = int(self._dll.aw_cell_next())
                    if rc != 0:
                        cell_errors.append({"cellX": cell_x, "cellZ": cell_z, "rc": rc, "rcName": rc_name(rc)})
                        continue

                    self._dll.aw_wait(int(args.get("cellWaitMs", 5)))

            return {
                "objects": list(self._world_objects.values()),
                "complete": True,
                "cellX": current_cell_x,
                "cellZ": current_cell_z,
                "radius": radius,
                "cellStats": dict(self._cell_stats),
                "cellErrors": cell_errors,
            }

    def world_attrs_scan(self, args: dict) -> dict:
        """Scan world attribute numbers and return any with non-empty string values."""
        with self._lock:
            self._load()
            if not self._connected:
                raise RuntimeError("not connected")
            start = int(args.get("start", 40))
            end = int(args.get("end", 300))
            results = {}
            for attr in range(start, end + 1):
                try:
                    val = decode_aw_string(self._dll.aw_string(attr))
                    if val:
                        results[attr] = val
                except Exception:
                    pass
            return {"attrs": results}

    def disconnect(self) -> dict:
        with self._lock:
            if self._dll is None:
                return {"connected": False}
            if self._connected or self._initialized:
                if self._dll is not None and self._load_cell_stream_funcs():
                    self._dll.aw_event_set(AW_EVENT_CELL_BEGIN, None)
                    self._dll.aw_event_set(AW_EVENT_CELL_OBJECT, None)
                    self._dll.aw_event_set(AW_EVENT_CELL_END, None)
                self._dll.aw_term()
                self._connected = False
                self._initialized = False
                self._world_objects.clear()
                self._cell_stats = {"begins": 0, "objects": 0, "ends": 0}
            return {"connected": False}


BRIDGE = AWBridge()


def handle(cmd: str, args: dict) -> dict:
    if cmd == "connect":
        return BRIDGE.connect(args)
    if cmd == "state":
        return BRIDGE.state(args)
    if cmd == "world_info":
        return BRIDGE.world_info(args)
    if cmd == "object_path_set":
        return BRIDGE.object_path_set(args)
    if cmd == "move":
        return BRIDGE.move(args)
    if cmd == "teleport":
        return BRIDGE.teleport(args)
    if cmd == "query":
        return BRIDGE.query(args)
    if cmd == "object_query":
        return BRIDGE.object_query(args)
    if cmd == "object_add":
        return BRIDGE.object_add(args)
    if cmd == "object_delete":
        return BRIDGE.object_delete(args)
    if cmd == "world_attrs_scan":
        return BRIDGE.world_attrs_scan(args)
    if cmd == "disconnect":
        return BRIDGE.disconnect()
    if cmd == "health":
        s = BRIDGE.state({"waitMs": 0})
        return {"ok": True, "bridge": "aw", **s}
    raise RuntimeError(f"unknown cmd: {cmd}")


def main() -> int:
    for raw in sys.stdin:
        raw = raw.strip()
        if not raw:
            continue
        req_id = None
        try:
            req = json.loads(raw)
            req_id = req.get("id")
            cmd = str(req.get("cmd"))
            args = req.get("args") or {}
            data = handle(cmd, args)
            out = {"id": req_id, "ok": True, "data": data}
        except Exception as e:
            out = {"id": req_id, "ok": False, "error": str(e)}
        sys.stdout.write(json.dumps(out) + "\n")
        sys.stdout.flush()

    try:
        BRIDGE.disconnect()
    except Exception:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
